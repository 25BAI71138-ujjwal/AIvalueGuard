import os
import sys
from pathlib import Path
import uvicorn

# Ensure repository root and backend directory are on sys.path
_backend_dir = Path(__file__).resolve().parent
_repo_root = _backend_dir.parent
for p in [_repo_root, _backend_dir]:
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    print(f"Starting AIValueGuard Gateway on {host}:{port}")
    uvicorn.run("backend.app.main:app", host=host, port=port, log_level="info")
