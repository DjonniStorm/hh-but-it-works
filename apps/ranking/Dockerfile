FROM python:3.12-slim

ARG DEBIAN_FRONTEND=noninteractive
ARG RANKING_ARTIFACT_DIR=evaluation/artifacts/ltr-v1.3.0-llm

WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt requirements-runtime-ml.txt ./
RUN pip install --no-cache-dir -r requirements-runtime-ml.txt
COPY . .

# Versioned, pre-trained artifacts are part of the source release. Building or
# starting this image never imports scikit-learn and never trains a model.
COPY ${RANKING_ARTIFACT_DIR}/model.txt ./model.txt
COPY ${RANKING_ARTIFACT_DIR}/model.meta.json ./model.meta.json
COPY ${RANKING_ARTIFACT_DIR}/calibrator.json ./calibrator.json
COPY ${RANKING_ARTIFACT_DIR}/promotion-report.json ./promotion-report.json

# The default bundle is llm-approved (labelSource llm_judge_v1, approvalSource
# in metadata), so hybrid ranking activates without any unapproved override.
# A human-approved bundle (--production-approved) is the next tier up.
ENV RANKING_MODE=hybrid \
    RANKING_LTR_WEIGHT=0.25 \
    PYTHONUNBUFFERED=1

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=2)"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
