from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import random
import time
import re
import asyncio
from routes.profile import router as profile_router

app = FastAPI(title="AM I HUMAN AIS", version="1.0.0")

# Include routers
app.include_router(profile_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class AnticipateRequest(BaseModel):
    tbId: str
    relationship: str

class AnticipateResponse(BaseModel):
    predicted_user: str
    risk_tier: str
    confidence: float
    reasoning: str
    nonce: str
    challenge: Optional[Dict[str, Any]] = None

class VoiceNonceRequest(BaseModel):
    audio_data: str  # base64 encoded
    nonce: str

class VoiceNonceResponse(BaseModel):
    voice_bio: float
    liveness: float
    ok: bool
    confidence: float

class VoiceNameRequest(BaseModel):
    audio_data: str  # base64 encoded
    expected_name: str

class VoiceNameResponse(BaseModel):
    detected_name: str
    name_match: float
    ok: bool
    confidence: float

class ChallengePrebakedRequest(BaseModel):
    tbId: str
    facet: str

class ChallengePrebakedResponse(BaseModel):
    prompt: str
    nonce: str
    ttlMs: int

class ChallengeAnswerRequest(BaseModel):
    transcript: str
    challenge_id: str
    expected_tokens: list

class ChallengeAnswerResponse(BaseModel):
    decision: str
    confidence: float
    score: float
    reasoning: str

# Mock data
MOCK_NONCES = ["pinecone", "marigold", "driftwood", "tumbleweed", "sourdough", "starlight"]
MOCK_CHALLENGES = {
    "milestone_count": "Tell me about 3 trips you call your classics.",
    "place_object": "What object became a keepsake from your favorite trip?",
    "sequence": "Describe the route you took in three steps.",
    "quote": "What phrase do you two use that no one else would know?"
}

# Simple scorers
def score_audio_length(audio_data: str) -> float:
    """Simulate scoring based on audio length"""
    # Mock: longer audio = higher score
    length = len(audio_data)
    return min(0.9, 0.5 + (length / 10000))

def score_text_tokens(transcript: str) -> float:
    """Simulate scoring based on text content"""
    # Mock: more tokens = higher score
    tokens = len(transcript.split())
    return min(0.95, 0.6 + (tokens / 50))

def extract_name_from_transcript(transcript: str, expected: str) -> float:
    """Extract and score name match from transcript"""
    transcript_lower = transcript.lower()
    expected_lower = expected.lower()
    
    # Simple name matching
    if expected_lower in transcript_lower:
        return 0.88
    elif any(word in transcript_lower for word in expected_lower.split()):
        return 0.75
    else:
        return 0.3

def check_challenge_answer(transcript: str, expected_tokens: list) -> Dict[str, Any]:
    """Check if transcript contains expected tokens"""
    transcript_lower = transcript.lower()
    
    # Look for child name + number pattern
    name_pattern = r'\b(ash|ashlyn|spencer|wendt)\b'
    number_pattern = r'\b\d+\b'
    
    has_name = bool(re.search(name_pattern, transcript_lower))
    has_number = bool(re.search(number_pattern, transcript_lower))
    
    score = 0.0
    if has_name:
        score += 0.4
    if has_number:
        score += 0.4
    if len(transcript.split()) > 5:  # Sufficient detail
        score += 0.2
    
    decision = "allow" if score >= 0.6 else "deny"
    
    return {
        "decision": decision,
        "confidence": score,
        "score": score,
        "reasoning": f"Name match: {has_name}, Number: {has_number}, Detail: {len(transcript.split())} words"
    }

# Endpoints
@app.post("/ais/anticipate", response_model=AnticipateResponse)
async def anticipate(request: AnticipateRequest):
    """Predict user and return nonce + challenge"""
    print(f"🔮 [AIS] Anticipate request: {request}")
    
    # Mock delay
    await asyncio.sleep(0.5)
    
    # Pick random nonce
    nonce = random.choice(MOCK_NONCES)
    
    # Mock challenge for ASH example
    challenge = {
        "id": f"challenge_{int(time.time())}",
        "tbId": request.tbId,
        "facet": "milestone_count",
        "prompt": MOCK_CHALLENGES["milestone_count"],
        "nonce": f"{nonce}-marigold-driftwood",
        "ttlMs": 120000
    }
    
    return AnticipateResponse(
        predicted_user="Ashlyn Wendt",
        risk_tier="low",
        confidence=0.85,
        reasoning="Voice pattern matches known user profile",
        nonce=nonce,
        challenge=challenge
    )

@app.post("/ais/voice/nonce", response_model=VoiceNonceResponse)
async def voice_nonce(request: VoiceNonceRequest):
    """Process voice nonce verification"""
    print(f"🎤 [AIS] Voice nonce request: {request.nonce}")
    
    await asyncio.sleep(0.3)
    
    # Score based on audio length
    voice_bio = score_audio_length(request.audio_data)
    liveness = 0.99  # Mock high liveness
    
    return VoiceNonceResponse(
        voice_bio=voice_bio,
        liveness=liveness,
        ok=True,
        confidence=min(voice_bio, liveness)
    )

@app.post("/ais/voice/name", response_model=VoiceNameResponse)
async def voice_name(request: VoiceNameRequest):
    """Extract and verify name from voice"""
    print(f"👤 [AIS] Voice name request: {request.expected_name}")
    
    await asyncio.sleep(0.4)
    
    # Mock transcript processing
    mock_transcript = f"My name is {request.expected_name}"
    name_match = extract_name_from_transcript(mock_transcript, request.expected_name)
    
    return VoiceNameResponse(
        detected_name=request.expected_name,
        name_match=name_match,
        ok=name_match > 0.7,
        confidence=name_match
    )

@app.post("/ais/challenge/prebaked", response_model=ChallengePrebakedResponse)
async def challenge_prebaked(request: ChallengePrebakedRequest):
    """Return pre-baked challenge prompt"""
    print(f"🎯 [AIS] Challenge prebaked request: {request}")
    
    await asyncio.sleep(0.2)
    
    prompt = MOCK_CHALLENGES.get(request.facet, "Tell me something only you two would know.")
    nonce = f"{random.choice(MOCK_NONCES)}-{random.choice(MOCK_NONCES)}"
    
    return ChallengePrebakedResponse(
        prompt=prompt,
        nonce=nonce,
        ttlMs=120000
    )

@app.post("/ais/challenge/answer", response_model=ChallengeAnswerResponse)
async def challenge_answer(request: ChallengeAnswerRequest):
    """Validate challenge response"""
    print(f"✅ [AIS] Challenge answer request: {request.transcript}")
    
    await asyncio.sleep(0.6)
    
    result = check_challenge_answer(request.transcript, request.expected_tokens)
    
    return ChallengeAnswerResponse(
        decision=result["decision"],
        confidence=result["confidence"],
        score=result["score"],
        reasoning=result["reasoning"]
    )

@app.get("/ais/health")
async def health():
    """Health check endpoint"""
    return {
        "ok": True,
        "service": "amihuman-ais",
        "version": "1.0.0",
        "timestamp": time.time()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
