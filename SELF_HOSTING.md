# Self-Hosting Software Inc Mod Studio

## Why Self-Host?

The version on GitHub Pages is fully functional for creating mods — but browser security (CORS) blocks direct AI API calls from `github.io` domains. When you self-host, the tool runs on **your own domain** (even `localhost`), which removes that restriction and enables the full AI assistant.

**What you get when self-hosting:**
- AI-powered mod generation (BYOK — bring your own API key)
- AI chat assistant that can edit your mod in real-time
- AI feature generation inside the editor
- Same modern UI, live preview, and validation
- Works on any device that can reach your server — PC, phone, tablet

## Quick Start (Local)

### Option 1: Node.js / npm (Recommended)

```bash
# Clone the repo
git clone https://github.com/elayindeoh/Software-Inc-Mod-Creator.git
cd Software-Inc-Mod-Creator

# If you have a simple static server package
npx serve .

# Or with Vite (zero config)
npx vite .

# Or with http-server
npx http-server -p 8080
```

Then open `http://localhost:8080` in your browser.

### Option 2: Python

```bash
# Python 3
python -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080
```

Then open `http://localhost:8080`.

### Option 3: VS Code Live Server

Install the **Live Server** extension, right-click `index.html`, and choose **"Open with Live Server"**.

### Option 4: Any Static File Host

This is a static site (HTML, CSS, JS). Upload the files to:
- Netlify Drop
- Vercel
- Cloudflare Pages
- Your own VPS (nginx, Apache, Caddy)
- Any shared hosting provider

## AI Setup (BYOK)

Once self-hosted, the AI settings will be available in the UI:

1. Click **"AI Settings"** (or the gear icon)
2. Choose your provider: OpenAI, Anthropic Claude, Google Gemini, OpenRouter, or a custom OpenAI-compatible endpoint
3. Enter your **API key** — it stays in your browser's localStorage, never sent to us
4. Pick a model (or type one in for custom endpoints)
5. Click **"Save & Test"**

That's it. AI works immediately.

### Supported Providers

| Provider | API Key Location | Notes |
|----------|-----------------|-------|
| **OpenAI** | https://platform.openai.com/api-keys | Standard, reliable |
| **Anthropic Claude** | https://console.anthropic.com/ | Excellent for structured output |
| **Google Gemini** | https://aistudio.google.com/app/apikey | Free tier available |
| **OpenRouter** | https://openrouter.ai/keys | Access many models through one key |
| **OpenAI Compatible** | Your server | LM Studio, LocalAI, Ollama, etc. |

## Hosting on a VPS

If you want others (or your phone) to use it too:

```bash
# On your VPS, clone and serve
git clone https://github.com/elayindeoh/Software-Inc-Mod-Creator.git
cd Software-Inc-Mod-Creator
npx serve -l 80
```

Or use nginx:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/Software-Inc-Mod-Creator;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Then share the URL. Anyone who visits can use AI with their own key.

## Mobile Access

You don't run `npm` on your phone. Instead:
- **Host it on your PC** and open `http://your-pc-ip:8080` from your phone on the same WiFi
- **Host it on a VPS** and visit the URL from any device
- **Use GitHub Pages** for no-AI editing on the go, then switch to your self-hosted instance when you want AI help

## Security Notes

- Your API key is stored in your browser's `localStorage` only
- Keys are sent directly from your browser to the AI provider — never through our servers
- Use HTTPS if hosting publicly (Let's Encrypt is free)
- The GitHub Pages version cannot access your key even if you saved one locally; it's a separate origin

## Branches

| Branch | Purpose |
|--------|---------|
| `main` | GitHub Pages version. No AI UI, fully static, zero config. |
| `self-hosted` | Full AI capability. Clone this branch to run locally or on a VPS. |

To switch branches:

```bash
git checkout self-hosted
```

## Troubleshooting

**"AI connection failed — CORS error"**
- You're on GitHub Pages. Self-host instead.

**"AI connection failed — 401"**
- Bad API key. Double-check it in AI Settings.

**"AI connection failed — 404"**
- Wrong model ID or custom URL. Verify the endpoint.

**"Fetch Models doesn't work"**
- Some providers don't expose `/v1/models`. Just type the model ID manually.

## Need Help?

- [Official Software Inc. Modding Wiki](https://softwareinc.coredumping.com/wiki/index.php/Modding)
- [GitHub Issues](https://github.com/elayindeoh/Software-Inc-Mod-Creator/issues)
