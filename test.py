from transformers import AutoProcessor, AutoModelForCausalLM
from PIL import Image
import torch
import json

# -----------------------------
# LOAD FLORENCE-2
# -----------------------------

model_id = "microsoft/Florence-2-large"

processor = AutoProcessor.from_pretrained(
    model_id,
    trust_remote_code=True
)

model = AutoModelForCausalLM.from_pretrained(
    model_id,
    trust_remote_code=True,
    torch_dtype=torch.float16,
    device_map="auto"
)

# -----------------------------
# LOAD IMAGE
# -----------------------------

image_path = "test.jpg"
image = Image.open(image_path).convert("RGB")

# -----------------------------
# GENERATE IMAGE CAPTION
# -----------------------------

prompt = "Give me a caption and scoring based on the following prompts axes: cozy, luxury, chaotic, urban, natur, nostalgic, cinematic"

inputs = processor(
    text=prompt,
    images=image,
    return_tensors="pt"
).to(model.device)

generated_ids = model.generate(
    input_ids=inputs["input_ids"],
    pixel_values=inputs["pixel_values"],
    max_new_tokens=256,
    num_beams=3
)

generated_text = processor.batch_decode(
    generated_ids,
    skip_special_tokens=True
)[0]

print("\n=== FLORENCE CAPTION ===")
print(generated_text)

# -----------------------------
# FAKE "VIBE ANALYZER"
# (replace with Gemini/OpenAI later)
# -----------------------------

def analyze_vibes(caption):

    # placeholder logic
    caption_lower = caption.lower()

    vibe_scores = {
        "cozy": 0,
        "luxury": 0,
        "chaotic": 0,
        "urban": 0,
        "nature": 0,
        "nostalgic": 0,
        "cinematic": 0
    }

    keywords = {
        "cozy": ["warm", "coffee", "candle", "wood"],
        "luxury": ["marble", "elegant", "modern", "premium"],
        "chaotic": ["crowded", "busy", "messy"],
        "urban": ["city", "street", "building", "traffic"],
        "nature": ["forest", "mountain", "lake", "trees"],
        "nostalgic": ["vintage", "retro", "old"],
        "cinematic": ["dramatic", "lighting", "moody"]
    }

    for axis, words in keywords.items():
        for word in words:
            if word in caption_lower:
                vibe_scores[axis] += 1

    return vibe_scores

vibes = analyze_vibes(generated_text)

print("\n=== VIBE AXES ===")
print(json.dumps(vibes, indent=2))