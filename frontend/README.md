# FMU Settings React frontend

## Installation

The steps for getting the code and installing for the
[Python application](../README.md#developing) should be done first.

Before React and dependencies can be installed, the JavaScript runtime environment
[Node.js](https://nodejs.org/) and a package manager ([pnpm](https://pnpm.io/)) need to
be installed, as well as the build tool and web server ([Vite](https://vite.dev/)).
Installation of Node.js is best handled by a version manager
([fnm](https://github.com/Schniz/fnm)).

```shell
# Change to the frontend directory
$ cd frontend

# fnm Node.js version manager
$ curl -fsSL https://fnm.vercel.app/install | bash
$ eval "$(fnm env --shell bash)"
$ fnm --version

# Node.js JavaScript runtime environment
$ fnm install --lts
$ node --version

# pnpm package manager
$ curl -fsSL https://get.pnpm.io/install.sh | sh -
$ pnpm self-update
$ pnpm --version

# Vite build tool and web server
$ pnpm add -D vite

# Package dependencies and external tools
$ pnpm install
$ mkdir tools
$ curl -L https://github.com/biomejs/biome/releases/download/%40biomejs%2Fbiome%402.0.0-beta.1/biome-linux-x64-musl -o tools/biome
$ chmod a+x tools/biome
```

Installation of the Biome toolchain is done by downloading the binary. Ideally the
program would be defined as a package dependency, but currently there are version issues
about the C standard library its using (it requires `glibc` 2.29 but only 2.28 is
available on servers where development takes place). Picking an exact binary means that a
version using the `musl` alternative can be used instead. Available versions can be see
in the [Biome release list](https://github.com/biomejs/biome/releases). When a new
version is available, it can be installed manually, and the documentation with the above
command updated to refer to the new version. Note that linting rules might change between
versions, so care should be taken when upgrading the program.


### Visual Studio Code

The repo contains configuration files for Visual Studio Code, with
[recommendations](../.vscode/extensions.json) for installing extensions for Biome
toolchain (formatting and linting) and ESLint. Furthermore, there is a workspace
[settings](../.vscode/settings.json) file that configures Biome as the default formatter
for JavaScript and TypeScript files (includeing JSX/TSX), as well as CSS/SCSS/JSON files.
Formatting is set up to be done on save.


## Developing

The application is started by running the following command:

```shell
$ pnpm dev
```

The web page of the application can then be shown by opening the URL
[http://localhost:5173/](http://localhost:5173/). Note that an authorization token from
the API is needed, so initially the web page won't show any content.

The web server is running with Hot Module Replacement, so any changes done to the TypeScript
and CSS files will be reflected in the running application.

### FMU Settings

This frontend application is part of the FMU Settings applications: The CLI application
is used for starting the API server as well as the GUI (frontend) server, while the API
application is the one used by the frontend. There is also an `fmu-settings` package
which contains the business logic and which is used by the API.

The necessary applications can be installed as follows:

```shell
$ pip install fmu-settings-cli
```

*Note: Currently the `fmu-settings-cli` package is not published and thus cannot be
installed via pip. Instead, follow the
[steps for installing it from the source](https://github.com/equinor/fmu-settings-cli#developing).
The API can then be started from this installation.*

Then, the API is started with the following command:

```shell
$ fmu-settings api --gui-port 5173 --print-url
```

The specified port number should be the same that the frontend application runs on,
which has a default of 5173. The API uses this port number for setting up the correct
[CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS) rules, allowing API
access from an application running on localhost on that port. The command also prints the
complete URL for the frontend application, including the authorization token. The URL can
be opened in the web browser, and as the URL contains the token the API access will be
authorized and communication will work as expected.
