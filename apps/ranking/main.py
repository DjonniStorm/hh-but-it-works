from time import perf_counter

from fastapi import FastAPI

from career import analyze_career
from ltr import LTRRanker
from monitoring import record_rank_metrics
from schemas import CareerAnalyzeRequest, CareerAnalyzeResponse, RankRequest, RankResponse

# Singleton ranker loads optional artifacts once at process startup.
_ranker = LTRRanker()
app = FastAPI(title="hh-but-it-works ranking", version=_ranker.model_version)


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": "ranking",
        "modelVersion": _ranker.model_version,
        "ranker": _ranker.status,
    }


@app.post("/rank", response_model=RankResponse)
def rank(body: RankRequest) -> RankResponse:
    started = perf_counter()
    run = _ranker.rank_run(body.candidates, body.need(), body.context)
    record_rank_metrics(run, len(body.candidates), (perf_counter() - started) * 1000)
    return RankResponse(
        results=run.items,
        modelVersion=run.model_version,
    )


@app.post("/career/analyze", response_model=CareerAnalyzeResponse)
def career_analyze(body: CareerAnalyzeRequest) -> CareerAnalyzeResponse:
    current, actions, gaps = analyze_career(
        body.candidate,
        body.opportunities,
        body.strongMatchThreshold,
        _ranker.rank,
    )
    return CareerAnalyzeResponse(
        currentStrongMatches=current,
        actions=actions,
        topGaps=gaps,
        modelVersion=_ranker.model_version,
    )
