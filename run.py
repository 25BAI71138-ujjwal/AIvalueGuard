import os
import sys
from pathlib import Path
import uvicorn

# Ensure repository root is on sys.path
_repo_root = Path(__file__).resolve().parent
if str(_repo_root) not in sys.path:
    sys.path.insert(0, str(_repo_root))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    print(f"Starting AIValueGuard Gateway on {host}:{port}")
    uvicorn.run("backend.app.main:app", host=host, port=port, log_level="info")
