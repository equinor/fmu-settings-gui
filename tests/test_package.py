"""Tests for the fmu-settings-gui package."""

from fmu_settings_gui import get_static_directory


def test_get_static_directory() -> None:
    """The package exposes its frontend asset directory."""
    static_directory = get_static_directory()

    assert static_directory.is_absolute()
    assert static_directory.name == "static"
    assert static_directory.parent.name == "fmu_settings_gui"
    assert static_directory.is_dir()
