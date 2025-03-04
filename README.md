# fmu-settings-gui

[![ci](https://github.com/equinor/fmu-settings-gui/actions/workflows/ci.yml/badge.svg)](https://github.com/equinor/fmu-settings-gui/actions/workflows/ci.yml)

**fmu-settings-gui** is the React frontend for fmu-settings.

## Developing

Clone and install into a virtual environment.

```sh
git clone git@github.com:equinor/fmu-settings-gui.git
cd fmu-settings-gui
# Create or source virtual/Komodo env
pip install -U pip
pip install -e ".[dev]"
# Make a feature branch for your changes
git checkout -b some-feature-branch
```

Run the tests with

```sh
pytest -n auto tests
```

Ensure your changes will pass the various linters before making a pull
request. It is expected that all code will be typed and validated with
mypy.

```sh
ruff check
ruff format --check
mypy src tests
```

See the [contributing document](CONTRIBUTING.md) for more.
