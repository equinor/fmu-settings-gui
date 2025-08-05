"""The main entry point for fmu-settings-gui."""

import asyncio
import os
import re
import signal
import sys
from pathlib import Path
from types import FrameType

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse

app = FastAPI(title="FMU Settings GUI")

current_dir = Path(__file__).parent.absolute()
static_dir = current_dir / "static"


@app.get("/{full_path:path}")
async def serve_spa_catchall(full_path: str) -> FileResponse:
    """Ensures internal paths to the GUI are served by the SPA."""
    if full_path == "":
        full_path = "index.html"
    resolved_path = os.path.normpath(
        os.path.realpath(os.path.join(str(static_dir), full_path))
    )
    if bool(re.fullmatch(r"^[\w\s\.\-/]+$", str(resolved_path))) is False:
        raise ValueError(f"Unallowed characters present in {full_path!r}")
    if not resolved_path.startswith(str(static_dir)):
        raise HTTPException(status_code=403, detail="Access denied")
    if os.path.exists(resolved_path):
        return FileResponse(resolved_path)
    return FileResponse(static_dir / "index.html")


app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")


def run_server(host: str = "127.0.0.1", port: int = 8000) -> None:
    """Starts the GUI server."""
    server_config = uvicorn.Config(app=app, host=host, port=port)
    server = uvicorn.Server(server_config)

    def signal_handler(signum: int, frame: FrameType | None) -> None:
        """Gracefully handles interrupt shutdowns."""
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    try:
        asyncio.run(server.serve())
    except KeyboardInterrupt:
        sys.exit(0)


if __name__ == "__main__":
    run_server()
