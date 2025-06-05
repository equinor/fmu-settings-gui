# fmu-settings-gui

[![ci](https://github.com/equinor/fmu-settings-gui/actions/workflows/ci.yml/badge.svg)](https://github.com/equinor/fmu-settings-gui/actions/workflows/ci.yml)

**fmu-settings-gui** is the web frontend for fmu-settings. There are two parts to this
repo:
- The code for the React application, located in the `frontend` directory. This is the
  main application, containing the web frontend
- The code for the Python application, located in the root and in the `src` directory.
  This serves the built and deployed React application


## Python application

Doing a local pip install will attempt to build the React application behind
the scenes. This requires a few dependencies (Node, pnpm, ..) that are not
installable via pip. View the [frontend README](/frontend/README.md) for
instructions.

Be sure to include a verbose flag or two (`pip install . -vv`) if you need to
observe the frontend installation output.

### Developing

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


## React application

See the application's [README](frontend/README.md) file for information.
