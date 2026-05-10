from fastapi import FastAPI, Depends
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
import hashlib
import firebase_admin
from firebase_admin import credentials, auth, firestore
from auth import verify_firebase_token, get_current_user
from firebase_config import firebase_init

firebase_init()
app = FastAPI()

load_dotenv()

gemini_client = genai.Client(
    api_key=os.getenv("LLM_GEMINI_KEY")
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://gdg-hackathon2026-git-main-mfish18s-projects.vercel.app",
        "https://gdg-hackathon2026.vercel.app",
        "http://localhost:3000",
    ],
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

travel_profile_cache = {}

device = "mps" if torch.backends.mps.is_available() else "cpu"

model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")


class ImageRequest(BaseModel):
    image_url: str
    feedback: int


def scale(score):
    return round(1 + score * 9)

def hash_profile(profile):
    return hashlib.md5(
        json.dumps(profile, sort_keys=True).encode()
    ).hexdigest()

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
    You are an AI travel personality engine.

    Analyze the user's personality scores and infer:
    - their travel behavior
    - preferred environments
    - social tendencies
    - pacing
    - ideal trip atmosphere

    User scores:
    {json.dumps(scores, indent=2)}

    Generate:
    1. A personality-style travel archetype title
    Examples:
    - "The Adventurer"
    - "The Urban Explorer"
    - "The Cultural Nomad"
    - "The Luxury Wanderer"

    2. A travel lifestyle description:
    - 1 to 2 detailed paragraphs
    - explain WHY this person travels this way
    - describe the kinds of environments, experiences, energy levels, and activities they are naturally drawn toward
    - make it feel personalized and insightful like a personality test result

    3. A short caption:
    - one memorable sentence
    - should feel modern, inspiring, and social-media friendly

    4. Three destination recommendations:
    - each destination should strongly match the personality profile
    - include a 2 to 3 sentence explanation for WHY the destination fits this traveler
    - explanations should reference atmosphere, activities, social vibe, nature, luxury, nightlife, exploration style, etc.

    IMPORTANT RULES:
    - Return ONLY valid JSON
    - No markdown
    - No code blocks
    - No explanations outside JSON
    - Make the writing immersive and human
    - Destinations must be real places
    - Avoid repetitive destination choices

    Return this EXACT JSON structure:

    {{
    "title": "",
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
            "max_output_tokens": 1200,
            "temperature": 0.7,
            "response_mime_type": "application/json",
        }
    )

    try:
        text = response.text.strip()
        # Strip markdown code fences if the model adds them anyway
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
            text = text.strip()
        # raw_decode stops after the first valid JSON object, ignoring trailing content
        result, _ = json.JSONDecoder().raw_decode(text)
        return result

    except json.JSONDecodeError:
        print("RAW MODEL OUTPUT:\n", response.text)
        raise

@app.post("/score-image")
def score_image(
    req: ImageRequest,
    user=Depends(get_current_user)
):
    uid = user["uid"]

    start = time.perf_counter()

    response = requests.get(req.image_url)
    image = Image.open(BytesIO(response.content)).convert("RGB")

    image_features = encode_image(image)

    scores = compute_scores(image_features)

    update_user_profile(scores, req.feedback)

    end = time.perf_counter()

    return {
        "uid": uid,
        "scores": scores,
        "user_profile": user_profile,
        "inference_time_sec": round(end - start, 4)
    }

@app.get("/travel-profile")
def travel_profile(user=Depends(get_current_user)):
    try:
        key = hash_profile(user_profile)

        if key in travel_profile_cache:
            return {
                "uid": user["uid"],
                "cached": True,
                "data": travel_profile_cache[key]
            }

        result = generate_travel_profile(user_profile)
        travel_profile_cache[key] = result

        return {
            "uid": user["uid"],
            "cached": False,
            "data": result
        }

    except Exception as e:
        return {"error": str(e)}
    
@app.get("/verify-token")
def verify_route(user=Depends(get_current_user)):
    return {
        "message": "You are logged in",
        "uid": user["uid"]
    }