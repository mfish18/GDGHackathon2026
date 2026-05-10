# Travel DNA

A 24 hour hackathon project that builds a personalized travel personality profile from your visual preferences. Users swipe through travel images, the app learns their aesthetic preferences across 5 dimensions using CLIP, then Google Gemini generates a custom travel archetype and destination recommendations.

## How It Works

1. Sign in with Google (Firebase Auth)
2. Start a new trip and swipe through travel images (like/dislike)
3. The backend encodes each image with OpenAI CLIP and scores it across 5 personality axes
4. Once you finish swiping, Gemini generates your travel personality — a title, description, social caption, and 3 destination recommendations
5. View past trips and personality results from your dashboard

### Personality Dimensions

| Dimension | Low | High |
|---|---|---|
| Energy | Calm / slow-paced | Active / chaotic |
| Nature | Urban | Natural landscapes |
| Nightlife | Quiet evenings | Vibrant night scenes |
| Luxury | Budget travel | High-end settings |
| Social Density | Secluded | Crowded / social |

## Tech Stack

**Frontend** — Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion, Firebase Auth/Firestore

**Backend** — FastAPI, Python, OpenAI CLIP (via HuggingFace Transformers + PyTorch), Google Gemini API (`gemini-2.0-flash-lite`), Firebase Admin SDK

## Project Structure

```
GDGHackathon2026/
├── frontend/          # Next.js app
│   ├── app/
│   │   ├── page.tsx           # Dashboard / home
│   │   ├── auth/              # Login & signup
│   │   ├── swipe/             # Image swiping interface
│   │   └── results/           # Travel personality results
│   └── components/
└── backend/           # FastAPI service
    ├── main.py                # API routes
    ├── clip_scorer.py         # CLIP image scoring
    └── requirements.txt
```

## Setup

### Prerequisites

- Node.js 18+
- Python 3.10+
- Firebase project with Auth and Firestore enabled
- Google Gemini API key

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
npm run dev
```

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt
```

Create `backend/.env`:

```env
GEMINI_API_KEY=...
```

Place your Firebase service account JSON at `backend/firebase-service-account.json`.

```bash
uvicorn main:app --reload
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/trips` | Create a new trip |
| POST | `/score-image` | Score an image and update trip scores |
| GET | `/travel-profile` | Generate personality & recommendations |
| DELETE | `/delete-trip/{trip_id}` | Delete a trip |
| GET | `/verify-token` | Verify Firebase auth token |

## Built At

GDG Hackathon 2026
