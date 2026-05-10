import torch
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
import time

device = "mps" if torch.backends.mps.is_available() else "cpu"

start = time.perf_counter()
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

def scale(score):
    # This turns a 0.0-1.0 probability into a 1-10 scale
    return round(1 + score * 9)

def encode_image(image):
    inputs = processor(images=image, return_tensors="pt").to(device)
    with torch.no_grad():
        outputs = model.get_image_features(**inputs)
        features = outputs.pooler_output if hasattr(outputs, 'pooler_output') else outputs
    return features / features.norm(dim=-1, keepdim=True)

def encode_text(text_list):
    inputs = processor(text=text_list, return_tensors="pt", padding=True).to(device)
    with torch.no_grad():
        outputs = model.get_text_features(**inputs)
        features = outputs.pooler_output if hasattr(outputs, 'pooler_output') else outputs
    return features / features.norm(dim=-1, keepdim=True)

def get_vibe_score(image_features, low_desc, high_desc):
    # We compare the image against two opposite poles
    text_features = encode_text([low_desc, high_desc])
    
    # Cosine similarity. CLIP logits usually need scaling (multiply by 100)
    # to make the Softmax "sharper" and more useful.
    sims = (image_features @ text_features.T).squeeze(0) * 100
    probs = sims.softmax(dim=0)
    
    # Return probs[1] because that represents the "High" description
    return probs[1].item()

image = Image.open("../assets/test.jpg").convert("RGB")
image_features = encode_image(image)

# We define each vibe with a "floor" (1) and a "ceiling" (10)
# Use natural, descriptive language—no numbers!
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
        "low": "an image with 0 people or a very sparse crowd with only a few individuals within it or a rural area",
        "high": "a very crowded location packed with many people and large groups or a cityscape with many buildings"
    },
    # "aesthetic_style": {
    #     "low": "ancient historical architecture, old weathered stone buildings, ornate traditional ruins and classical vintage structures",
    #     "high": "futuristic modern architecture, cutting-edge skyscraper design, sleek glass and steel buildings with minimalist futuristic style"
    # }
}

scores = {}
for category, prompts in vibe_definitions.items():
    raw_prob = get_vibe_score(image_features, prompts["low"], prompts["high"])
    scores[category] = scale(raw_prob)

end = time.perf_counter()
print("Vibe Scores (1-10):")
print(scores)
print(f"Executed in {end - start:0.4f} seconds")