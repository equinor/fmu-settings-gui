"""The main entry point for fmu-settings-gui."""

import asyncio
import signal
import sys
from pathlib import Path
from types import FrameType

import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="FMU Settings GUI")

current_dir = Path(__file__).parent.absolute()
static_dir = current_dir / "static"

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
