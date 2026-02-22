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
cd frontend

# fnm Node.js version manager
curl -fsSL https://fnm.vercel.app/install | bash
eval "$(fnm env --shell bash)"
fnm --version

# Node.js JavaScript runtime environment
fnm install --lts
node --version

# pnpm package manager
curl -fsSL https://get.pnpm.io/install.sh | sh -
pnpm self-update
pnpm --version

# Vite build tool and web server
pnpm add -D vite

# Package dependencies and external tools
pnpm install
mkdir tools
curl -L https://github.com/biomejs/biome/releases/download/%40biomejs%2Fbiome%402.4.4/biome-linux-x64-musl -o tools/biome
# macOS Apple Silicon
# curl -L https://github.com/biomejs/biome/releases/download/%40biomejs%2Fbiome%402.4.4/biome-darwin-arm64 -o tools/biome
chmod a+x tools/biome
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

Furthermore, the `package.json` contains the script `lint`, which calls `biome` from the
`tools` subdirectory. This script is for checking the code when developing, where `biome`
has been installed manually. There is also the script `ci-lint`, but this script calls
`biome` from the base directory (ie. not from a subdirectory). This script is meant to be
called from the CI actions, which is executed in a GitHub runner environment and where
installation has been done through a workflow action.

### Visual Studio Code

The repo contains configuration files for Visual Studio Code, with
[recommendations](../.vscode/extensions.json) for installing extensions for Biome
toolchain (formatting and linting), ESLint and styled-components. Furthermore, there is a
workspace [settings](../.vscode/settings.json) file that configures Biome as the default
formatter for JavaScript and TypeScript files (includeing JSX/TSX), as well as
CSS/SCSS/JSON files. Formatting is set up to be done on save.

## Developing

The frontend application is started by running the following command:

```shell
pnpm dev
```

The web server is running with Hot Module Replacement, so any changes done to the TypeScript
and CSS files will be reflected in the running application.

The API also needs to be running, and is started with the following command:

```shell
fmu settings api --gui-port 5173 --print-url --log-level info
```

The specified port number should be the same that the frontend application runs on,
which has a default of 5173. The API uses this port number for setting up the correct
[CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS) rules, allowing API
access from an application running on localhost on that port. The command also prints the
complete URL for the frontend application, including the authorization token. The URL can
be opened in the web browser, and as the URL contains the token the API access will be
authorized and communication will work as expected.

### Updating API endpoints and models

Whenever there are been updates to the API endpoints and models, a tool can be used to
update the frontend code:

```shell
pnpm openapi-ts
```

This command will get the API's `openapi.json` specification file, and create TypeScript
code for the various endpoints as well as the models. The code is placed in the
`frontend/src/client` directory, and is part of the repo. Any changes will thus be
tracked and needs to be commited.

### Path aliases

The codebase is configured to use path aliases, to more easily arrange imports and to
avoid excessive levels of relative directories in imports. The code is structured in a
handful of main subdirectories, like components, routes and utils. There are path aliases
configured for these subdirectories, which are named prefixed with `#` (ie.
`#components`). These path aliases are defined in the
[tsconfig.app.json](tsconfig.app.json) file, and should rarely need to be updated or
added to. Editors like Visual Studio Code should be able to deal naturally with these
path aliases. Note that the Vite configuration is set up with a plugin for handling these
aliases, and that a change in the alias definition list requires a restart of Vite.

### Formatting and linting

There are two tools configured to do formatting and linting of the TypeScript code:

- [Biome toolchain](https://biomejs.dev/): Does formatting and general linting
- [ESLint](https://eslint.org/) with [typescript-eslint](https://typescript-eslint.io/):
  Does type-checked linting

When installing and using the recommended extensions for Visual Studio Code (see above),
formatting and linting will happen during editing and saving of each file. In addition,
this can be done for all files, using the following command:

```shell
pnpm lint
```

When a pull request is created, the CI workflow checks for formatting and linting issues,
so any such issues should be dealt with before code is commited.

The ESLint plugin (currently at version 3.0.10) in Visual Studio Code will sometimes
produce false positives, marking code as having type errors when in fact the code is
correct, as seen when checking the code with the `pnpm lint` command. This is a known
error, and after a restart of the plugin the code will not be marked as having errors.
This error has been observed when using the `*Options` functions from the Hey API
openapi-ts generated code, such as this:

```typescript
queryClient.fetchQuery(userGetUserOptions());
```

In this example, `userGetUserOptions()` would be marked with the errors
`@typescript-eslint/no-unsafe-argument` and `@typescript-eslint/no-unsafe-call`. This is
a false positive, as running the command `pnpm lint` will indicate.
