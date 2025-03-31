# FMU Settings React frontend

## Installation

Before React and dependencies can be installed, the JavaScript runtime environment
[Node.js](https://nodejs.org/) and a package manager ([pnpm](https://pnpm.io/)) need to
be installed, as well as the build tool and web server ([Vite](https://vite.dev/)).
Installation of Node.js is best handled by a version manager
([fnm](https://github.com/Schniz/fnm)).

```shell
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
$ cd frontend
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

The web server is running with Hot Module Replacement, so any changes done to the TypeScript
and CSS files will be reflected in the running application.
