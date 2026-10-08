from fastapi import FastAPI

from career import analyze_career
from ltr import LTRRanker
from schemas import CareerAnalyzeRequest, CareerAnalyzeResponse, RankRequest, RankResponse
from scoring import MODEL_VERSION, rank_candidates

# Singleton LTR ranker – loads the model file if present.
_ranker = LTRRanker()
app = FastAPI(title="hh-but-it-works ranking", version=_ranker.model_version)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "ranking", "modelVersion": _ranker.model_version}


@app.post("/rank", response_model=RankResponse)
def rank(body: RankRequest) -> RankResponse:
    return RankResponse(
        results=_ranker.rank(body.candidates, body.need(), body.context),
        modelVersion=_ranker.model_version,
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
