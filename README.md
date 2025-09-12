# fmu-settings-gui

[![ci](https://github.com/equinor/fmu-settings-gui/actions/workflows/ci.yml/badge.svg)](https://github.com/equinor/fmu-settings-gui/actions/workflows/ci.yml)

This frontend application is part of the FMU Settings applications: The CLI application
is used for starting the API server as well as the GUI (frontend) server, while the API
application is the one used by the frontend. There is also an `fmu-settings` package
which contains the business logic and models and which is used by the API. Finally, the
`fmu-datamodels` package contains some additional models used by FMU Settings.

There are two parts to this repo:

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

When developing features in the React application, there are corresponding changes in the
other FMU Settings packages that the frontend application needs. It is therefore
important to make sure that the other packages are used in their newest versions.
Installing these packages from the package repository PyPI might not provide the newest
versions, so installations should be done as editable installs. Python will then import
functions from the cloned code repos.

A Python virtual environment (venv) should first be created:

```shell
python -m venv ~/venv/fmu-settings
source ~/venv/fmu-settings/bin/activate
```

Then, an editable install of a package can be done, with the following steps:

```shell
git clone git@github.com:equinor/fmu-settings-cli.git
cd fmu-settings-cli
pip install -e ".[dev]"
```

These commands clone the code repo and perform an install of the package, including any
regular and development dependencies. An FMU Settings dependency will initially be
installed in regular mode, so each of these packages need to be cloned and installed as
editable in separate steps. The above commands need to be repeated for the rest of the
packages:

- `fmu-settings-api`
- `fmu-settings-gui`
- `fmu-settings`
- `fmu-datamodels`

Tests for the Python applications are run with the following command:

```shell
pytest -n auto tests
```

Ensure your changes will pass the various linters before making a pull
request. It is expected that all code will be typed and validated with
mypy.

```shell
ruff check
ruff format --check
mypy src tests
```

See the [contributing document](CONTRIBUTING.md) for more.


## React application

See the application's [README](frontend/README.md) file for information.
