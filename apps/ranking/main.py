from fastapi import FastAPI
from pydantic import BaseModel


class RankRequest(BaseModel):
    vacancy: dict
    candidates: list[dict]


class RankItem(BaseModel):
    candidateId: str
    score: float
    reasons: list[str]


class RankResponse(BaseModel):
    results: list[RankItem]


app = FastAPI()


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "ranking"}


@app.post("/rank")
def rank(body: RankRequest) -> RankResponse:
    results = [
        RankItem(
            candidateId=str(candidate.get("id", "")),
            score=0,
            reasons=["stub"],
        )
        for candidate in body.candidates
    ]
    return RankResponse(results=results)
