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
curl -L https://github.com/biomejs/biome/releases/download/%40biomejs%2Fbiome%402.0.0-beta.1/biome-linux-x64-musl -o tools/biome
chmod a+x tools/biome