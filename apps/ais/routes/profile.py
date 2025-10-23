from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

@router.get("/ais/anticipate-packs")
def anticipate_packs():
    return {
      "pack": {
        "relationship":"parent_child",
        "domains":[
          {"name":"cooking","seeds":["Cooking: Tell me something that defines how cooking worked in your family.","What dish instantly reminds you of mom and why?","When you tried to help, what usually happened?"],"refine":["Name the first dish you tried to copy, and how it went.","Say the unspoken cooking rule at home in six words.","Include one object from the kitchen that mattered."]},
          {"name":"trips","seeds":["Top three trips we call our classics.","The windy one—what broke and what was plan B?","The snack and store we hit after a tough day."],"refine":["Say the route or two waypoints.","Name one person who witnessed it.","Give the object that became a keepsake."]}
        ],
        "nonce_words":["pinecone","marigold","driftwood","tumbleweed","sourdough","starlight"]
      }
    }

class ExtractIn(BaseModel):
    tbId: Optional[str] = None
    domain: str
    prompt: str
    answer: str

@router.post("/ais/profile/session")
def session():
    return {"ok": True}

@router.post("/ais/profile/extract")
def extract(payload: ExtractIn):
    # trivial deterministic behavior: first call returns refine; second returns preview
    if "Cooking" in payload.prompt:
        return {"refinePrompt":"Name the first dish you tried to copy, and how it went."}
    return {"preview":{
        "summary":"Mother taught by example; first copied biscuits.",
        "anchors":["Cooking","Biscuits","Observation"], 
        "confidence":0.92
    }}
