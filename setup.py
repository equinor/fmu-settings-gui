"""Builds the React app into the Python package."""

import subprocess
import sys
from pathlib import Path
from typing import Self

from setuptools import setup
from setuptools.command.build_py import build_py
from setuptools.command.develop import develop
from setuptools.command.sdist import sdist


def build_frontend() -> None:
    """Builds the frontend.

    Output from this function (print statements, output from pnpm) can only be viewed
    when the '-v' flag is given to 'pip install'.
    """
    root = Path(__file__).parent
    static = root / "src/fmu_settings_gui/static"

    frontend_dir = Path(root / "frontend")
    if not all((frontend_dir.exists(), frontend_dir.is_dir())):
        raise OSError("Frontend directory does not exist or is not a directory")

    try:
        print("Installing frontend packages...", file=sys.stderr)
        subprocess.run(["pnpm", "install"], cwd=frontend_dir, check=True)
        print("Building frontend...", file=sys.stderr)
        subprocess.run(["pnpm", "run", "build"], cwd=frontend_dir, check=True)

        # Restore removed .gitkeep
        (static / ".gitkeep").touch()
    except subprocess.CalledProcessError as e:
        print(f"Frontend build failed: {e}", file=sys.stderr)
        raise


class BuildPyCommand(build_py):
    """Build for py."""

    def run(self: Self) -> None:
        """Run."""
        build_frontend()
        super().run()


class DevelopCommand(develop):
    """Build for develop."""

    def run(self: Self) -> None:
        """Run."""
        build_frontend()
        super().run()


class SdistCommand(sdist):
    """Build the sdist."""

    def run(self: Self) -> None:
        """Run."""
        build_frontend()
        super().run()


setup(
    cmdclass={
        "build_py": BuildPyCommand,
        "develop": DevelopCommand,
        "sdist": SdistCommand,
    },
)
