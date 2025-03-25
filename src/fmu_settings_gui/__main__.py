"""The main entry point for fmu-settings-gui."""

import asyncio
from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="FMU Settings GUI")

current_dir = Path(__file__).parent.absolute()
static_dir = current_dir / "static"

app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


@app.get("/")
async def serve_index() -> FileResponse:
    """Serve index.html."""
    index_path = static_dir / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="index.html not found")
    return FileResponse(index_path)


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Simple health check endpoint."""
    return {"status": "ok"}


def run_server(host: str = "127.0.0.1", port: int = 8000) -> None:
    """Starts the GUI server."""
    server_config = uvicorn.Config(app=app, host=host, port=port)
    server = uvicorn.Server(server_config)

    asyncio.run(server.serve())


if __name__ == "__main__":
    run_server()
