"""Built frontend assets for FMU Settings."""

from pathlib import Path

try:
    from ._version import __version__, version
except ImportError:
    __version__ = version = "0.0.0"


def get_static_directory() -> Path:
    """Return the directory that contains the built frontend assets."""
    return Path(__file__).parent.resolve() / "static"


__all__ = ["get_static_directory"]
