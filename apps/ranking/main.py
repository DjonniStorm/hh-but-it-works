from fastapi import FastAPI

from career import analyze_career
from schemas import CareerAnalyzeRequest, CareerAnalyzeResponse, RankRequest, RankResponse
from scoring import MODEL_VERSION, rank_candidates


app = FastAPI(title="hh-but-it-works ranking", version=MODEL_VERSION)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "ranking", "modelVersion": MODEL_VERSION}


@app.post("/rank", response_model=RankResponse)
def rank(body: RankRequest) -> RankResponse:
    return RankResponse(
        results=rank_candidates(body.candidates, body.need(), body.context),
        modelVersion=MODEL_VERSION,
    )


@app.post("/career/analyze", response_model=CareerAnalyzeResponse)
def career_analyze(body: CareerAnalyzeRequest) -> CareerAnalyzeResponse:
    current, actions, gaps = analyze_career(
        body.candidate,
        body.opportunities,
        body.strongMatchThreshold,
    )
    return CareerAnalyzeResponse(
        currentStrongMatches=current,
        actions=actions,
        topGaps=gaps,
        modelVersion=MODEL_VERSION,
    )
