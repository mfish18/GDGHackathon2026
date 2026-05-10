from fastapi import FastAPI
from pydantic import BaseModel
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel
import time
import requests
from io import BytesIO

app = FastAPI()

user_profile = {
    "energy": 0.0,
    "nature": 0.0,
    "nightlife": 0.0,
    "luxury": 0.0,
    "social_density": 0.0
}

device = "mps" if torch.backends.mps.is_available() else "cpu"

model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")


class ImageRequest(BaseModel):
    image_url: str
    feedback: int


def scale(score):
    return round(1 + score * 9)


def encode_image(image):
    inputs = processor(images=image, return_tensors="pt").to(device)
    
    with torch.no_grad():
        outputs = model.get_image_features(**inputs)
    
    # ensure tensor
    if hasattr(outputs, "pooler_output"):
        features = outputs.pooler_output
    else:
        features = outputs

    return features / features.norm(dim=-1, keepdim=True)

def encode_text(text_list):
    inputs = processor(text=text_list, return_tensors="pt", padding=True).to(device)

    with torch.no_grad():
        outputs = model.get_text_features(**inputs)

    if hasattr(outputs, "pooler_output"):
        features = outputs.pooler_output
    else:
        features = outputs

    return features / features.norm(dim=-1, keepdim=True)


def get_vibe_score(image_features, low_desc, high_desc):
    text_features = encode_text([low_desc, high_desc])
    sims = (image_features @ text_features.T).squeeze(0) * 100
    probs = sims.softmax(dim=0)
    return probs[1].item()

def compute_scores(image_features):
    scores = {}
    for category, prompts in vibe_definitions.items():
        raw_prob = get_vibe_score(
            image_features,
            prompts["low"],
            prompts["high"]
        )
        scores[category] = scale(raw_prob)
    return scores

def update_user_profile(scores, feedback):
    global user_profile

    direction = 1 if feedback == 1 else -1

    for k in user_profile:
        user_profile[k] += direction * scores[k]

vibe_definitions = {
    "energy": {
        "low": "a static, empty, and very calm silent environment",
        "high": "a chaotic, high-activity scene with crowds, festivals, and lots of movement"
    },
    "nature": {
        "low": "a dense urban environment with concrete buildings and no plants",
        "high": "a dominant natural landscape with mountains, forests, or beaches"
    },
    "nightlife": {
        "low": "a quiet residential area during the daytime",
        "high": "a vibrant nightlife scene with neon lights, bars, and clubs at night"
    },
    "luxury": {
        "low": "a basic, ordinary, or budget everyday environment",
        "high": "a high-end luxury setting with expensive hotels, yachts, and fine dining"
    },
    "social_density": {
        "low": "an image with very few or no people",
        "high": "a very crowded location packed with many people"
    }
}


@app.post("/score-image")
def score_image(req: ImageRequest):
    start = time.perf_counter()

    response = requests.get(req.image_url)
    image = Image.open(BytesIO(response.content)).convert("RGB")

    image_features = encode_image(image)

    scores = compute_scores(image_features)

    update_user_profile(scores, req.feedback)

    end = time.perf_counter()

    return {
        "scores": scores,
        "user_profile": user_profile,
        "inference_time_sec": round(end - start, 4)
    }