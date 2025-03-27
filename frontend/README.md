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

# Package dependencies
$ cd frontend
$ pnpm install
```

## Developing

The application is started by running the following command:

```shell
$ pnpm dev
```

The web server is running with Hot Module Replacement, so any changes done to the TypeScript
and CSS files will be reflected in the running application.
