"""The main entry point for fmu-settings-gui."""

import asyncio
from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="FMU Settings GUI")

current_dir = Path(__file__).parent.absolute()
static_dir = current_dir.parent.parent / "static"

app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")


def run_server(host: str = "127.0.0.1", port: int = 8000) -> None:
    """Starts the GUI server."""
    server_config = uvicorn.Config(app=app, host=host, port=port)
    server = uvicorn.Server(server_config)

    asyncio.run(server.serve())


if __name__ == "__main__":
    run_server()
