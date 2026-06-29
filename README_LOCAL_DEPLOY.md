# Software Inc Mod Studio — Local Deploy

This branch is for users who want to **run Mod Studio locally** or **host it on their own server/VPS**. It includes the full AI assistant (BYOK — bring your own API key).

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/elayindeoh/Software-Inc-Mod-Creator.git
cd Software-Inc-Mod-Creator

# 2. Switch to this branch
git checkout local-deploy

# 3. Install dependencies (just Vite)
npm install

# 4. Start the dev server
npm run dev
```

Then open `http://localhost:8080` in your browser.

## Available Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start dev server with live reload (best for development) |
| `npm run build` | Build static files to `dist/` folder (best for VPS) |
| `npm run preview` | Preview the production build locally |
| `npm start` | Serve the production build on port 8080 |

## Hosting on a VPS

### Option 1: Serve with Vite Preview
```bash
npm install
npm run build
npm start
```
Runs on port 8080. Use a reverse proxy (nginx/Caddy) to point your domain to it.

### Option 2: Static Files + nginx
```bash
npm install
npm run build
```
Then serve the `dist/` folder with nginx:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/Software-Inc-Mod-Creator/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Option 3: Docker (future)
A Dockerfile could be added to this branch for containerized deployment.

## Why Local Deploy?

The GitHub Pages version works great but **cannot call AI APIs** due to browser CORS restrictions. When you run it yourself:
- ✅ AI assistance works (OpenAI, Claude, Gemini, local LLMs)
- ✅ Access from any device on your network
- ✅ Host publicly for others to use
- ✅ Data stays in your browser — your API key never touches our servers

## AI Setup

1. Click **"Connect AI"** or the gear icon in any editor
2. Choose your provider (OpenAI, Anthropic, Gemini, OpenRouter, or custom)
3. Enter your API key — stored only in your browser
4. Pick a model and click **"Save & Test"**

Your key is saved in `localStorage` and sent directly to the AI provider. We never see it.

## Network Access

By default, `npm run dev` binds to all interfaces. This means:
- You can access it from your phone/tablet on the same WiFi
- You can host it on a VPS and access it from anywhere

To bind to localhost only, edit `vite.config.js` and change `host: true` to `host: false`.

## Branches

| Branch | Purpose |
|--------|---------|
| `main` | GitHub Pages. No AI UI. Fully static. |
| `NewUI` | The finalized UI overhaul (same as main for now) |
| `self-hosted` | Static files with AI. Serve with any web server. |
| `local-deploy` | This branch. Optimized for `npm run dev` and VPS deployment. |

## Troubleshooting

**"Command not found: vite"**
Run `npm install` first.

**"Port 8080 already in use"**
Vite will automatically try the next port (8081, 8082, etc.). Check the console output.

**"AI connection failed — CORS error"**
Even self-hosted, some AI providers block browser requests. Try:
- OpenRouter (allows browser requests)
- Local LLM via LM Studio/Ollama (no CORS)
- Configure the proxy in `vite.config.js`

## Future: Docker Support

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
EXPOSE 8080
CMD ["npm", "start"]
```

This could be added to the repo for one-command deployment.
