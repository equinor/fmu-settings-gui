# fmu-settings-gui

[![ci](https://github.com/equinor/fmu-settings-gui/actions/workflows/ci.yml/badge.svg)](https://github.com/equinor/fmu-settings-gui/actions/workflows/ci.yml)

This frontend application is part of the FMU Settings applications: The CLI application
starts the API server, which serves both the API and the built GUI. There is also an
`fmu-settings` package which contains the business logic and models and which is used by
the API. Finally, the `fmu-datamodels` package contains some additional models used by
FMU Settings.

There are two parts to this repo:

- The code for the React application, located in the `frontend` directory. This is the
  main application, containing the web frontend
- The code for the Python package, located in the root and in the `src` directory.
  This builds and packages the static React files for `fmu-settings-api`


## Python package

Doing a local pip install will attempt to build the React application behind
the scenes. This requires a few dependencies (Node, pnpm, ..) that are not
installable via pip. View the [frontend README](/frontend/README.md) for
instructions.

The package does not start a web server. It provides
`fmu_settings_gui.get_static_directory()`, which returns the packaged asset directory.
The API uses this directory when `fmu settings` starts the complete application.

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
uv pip install -e ".[dev]"
```

These commands clone the repository and install the package along with its regular and 
development dependencies. During developemnt, it is often helpful to work to work with 
the latest main branches of related `fmu-settings` packages. This can be done with the 
following command :  

```shell
uv pip install -r dev_requirements.txt
```

Note : This does not install the packages in editable mode. 

Packages installed using the dev_requirements.txt. 
- `fmu-settings-api`
- `fmu-settings-cli`
- `fmu-settings`
- `fmu-datamodels`
- `rms-sys`

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
