from fastapi import FastAPI
from pydantic import BaseModel
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel
import time
import requests
from io import BytesIO
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from dotenv import load_dotenv
import os
import json

app = FastAPI()

load_dotenv()

gemini_client = genai.Client(
    api_key=os.getenv("LLM_GEMINI_KEY")
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

user_profile = {
    "energy": 5,
    "nature": 6,
    "nightlife": 10,
    "luxury": 8,
    "social_density": 5
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

def generate_travel_profile(scores):

    prompt = f"""
    You are a travel personality engine.

    Based on these scores:
    {json.dumps(scores, indent=2)}

    Generate:
    1. A travel lifestyle description
    2. A short travel personality caption
    3. 3 travel destinations

    IMPORTANT:
    - Return ONLY valid JSON
    - No markdown
    - No explanations outside JSON

    Format:
    {{
      "travel_lifestyle": "",
      "caption": "",
      "destinations": [
        {{
          "name": "",
          "reason": ""
        }},
        {{
          "name": "",
          "reason": ""
        }},
        {{
          "name": "",
          "reason": ""
        }}
      ]
    }}
    """

    response = gemini_client.models.generate_content(
        model="gemini-3.1-flash-lite",
        contents=prompt,
        config={
            "max_output_tokens": 300,
            "temperature": 0.9
        }
    )

    raw = response.text

    start = raw.find("{")
    end = raw.rfind("}") + 1

    cleaned = raw[start:end]

    return json.loads(cleaned)

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

@app.get("/travel-profile")
def travel_profile():

    result = generate_travel_profile(user_profile)

    return result