"""The fmu.settings.gui package."""

try:
    from ._version import __version__, version
except ImportError:
    __version__ = version = "0.0.0"

from .__main__ import run_server

__all__ = ["run_server"]
