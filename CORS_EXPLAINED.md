# CORS and GitHub Pages: Why Direct AI API Calls Are Blocked

## The Problem

When you host a tool on **GitHub Pages** (or any static site) and try to call an AI API like OpenCode Go, OpenAI, or a local LM Studio instance directly from the browser, the request is blocked by a browser security feature called **CORS (Cross-Origin Resource Sharing)**. The browser asks the AI server: "Is it okay if this website from github.io talks to you?" If the AI server doesn't respond with the right `Access-Control-Allow-Origin` headers — and most don't, because they're designed for backend-to-backend communication — the browser refuses to send the request. This is not a bug in your code; it is a fundamental security rule built into every modern browser. No amount of JavaScript trickery can bypass it because the block happens at the network layer before your code even runs.

## Your Options

**1. Serverless Proxy (Recommended)**
The standard production solution is a tiny serverless function — like a **Cloudflare Worker** or **Vercel Edge Function** — that sits between your site and the AI API. Your GitHub Pages site calls your proxy (which you control, so you allow CORS), and the proxy forwards the request to the AI API. This costs nothing on Cloudflare's free tier, requires no server maintenance, and takes about 5 minutes to set up. The proxy can be as small as 30 lines of code. This is how nearly every client-side app that talks to paid APIs solves this problem.

**2. OpenRouter (Zero Setup)**
Some API providers, like **OpenRouter**, intentionally allow cross-origin requests from browsers. If your AI provider supports OpenRouter, you can switch to that and it will work immediately with no proxy needed. The tradeoff is that OpenRouter is an intermediary with its own pricing and rate limits.

**3. Browser Extension (Quick Hack)**
Users can install a CORS-unblocking browser extension like "Allow CORS" or "CORS Everywhere." This works instantly but requires every user to install an extension, which is not a viable solution for a tool you want others to use.

**4. Manual Copy/Paste Fallback**
As a last resort, the tool can generate the AI prompt for the user to copy, they paste it into the AI's chat interface manually, copy the response back, and the tool parses it. This always works but breaks the seamless flow.

**5. Self-Host or Electron App**
If you package the tool as a desktop app (Electron, Tauri) or host it on the same domain as the API, CORS restrictions disappear entirely because the requests are no longer cross-origin.

## Bottom Line

For a GitHub Pages site with BYOK AI, **a serverless proxy is the only robust, user-friendly solution.** It is free, fast to set up, and is the industry-standard pattern for this exact problem. Without it, you are fighting a security feature that browsers will never allow you to disable from JavaScript.
