import os
from pathlib import Path
import sys

# Tests must not depend on developer-local promoted artifacts.
os.environ["RANKING_MODE"] = "rules"

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
