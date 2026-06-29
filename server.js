const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Disable caching for JS/CSS/HTML so browser always loads latest versions
app.use((req, res, next) => {
  if (/\.(js|css|html)$/.test(req.path)) {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  next();
});

app.use(express.static(__dirname));

// ─── AI Proxy Endpoint ───
// Browser calls this (same origin, no CORS), server forwards to AI API (no CORS in Node)
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { provider, apiKey, model, customUrl, messages, options } = req.body;

    if (!apiKey) return res.status(400).json({ error: 'Missing API key' });
    if (!messages) return res.status(400).json({ error: 'Missing messages' });

    let url, headers, body;

    switch (provider) {
      case 'openai':
        url = 'https://api.openai.com/v1/chat/completions';
        headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
        body = { model, messages, temperature: 0.7, max_tokens: 4000, ...options };
        break;

      case 'anthropic':
        url = 'https://api.anthropic.com/v1/messages';
        headers = { 'x-api-key': apiKey, 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' };
        body = { model, messages, max_tokens: 2000, ...options };
        break;

      case 'gemini':
        url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        headers = { 'Content-Type': 'application/json' };
        body = {
          contents: messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          }))
        };
        break;

      case 'ollama':
        url = 'http://localhost:11434/api/generate';
        headers = { 'Content-Type': 'application/json' };
        body = { model, prompt: messages.map(m => `${m.role}: ${m.content}`).join('\n\n'), stream: false };
        break;

      case 'openrouter':
        url = 'https://openrouter.ai/api/v1/chat/completions';
        headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'http://localhost:8080', 'X-Title': 'Software Inc Mod Studio' };
        body = { model, messages, temperature: 0.7, max_tokens: 4000, ...options };
        break;

      case 'openaiCompatible':
      case 'custom':
        if (!customUrl) return res.status(400).json({ error: 'Missing custom URL' });
        url = customUrl;
        headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
        body = { model, messages, temperature: 0.7, max_tokens: 4000, ...options };
        break;

      default:
        return res.status(400).json({ error: `Unknown provider: ${provider}` });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `HTTP ${response.status} from ${url}: ${errText.slice(0, 500)}` });
    }

    const data = await response.json();

    // Parse content based on provider format — try multiple paths for resilience
    let content = '';
    if (provider === 'anthropic') {
      content = data.content?.[0]?.text || '';
    } else if (provider === 'gemini') {
      content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else if (provider === 'ollama') {
      content = data.response || '';
    } else {
      // OpenAI-compatible: try standard path, then reasoning_content, then alternatives
      const msg = data.choices?.[0]?.message;
      if (msg) {
        content = msg.content || msg.reasoning_content || msg.text || '';
      }
      if (!content) {
        content = data.choices?.[0]?.delta?.content || data.choices?.[0]?.text || '';
      }
    }

    if (!content) {
      // Include raw response snippet in error so it's diagnosable
      const rawSnippet = JSON.stringify(data).slice(0, 500);
      return res.status(500).json({ error: `Empty response from AI. Raw response: ${rawSnippet}` });
    }
    res.json({ content, raw: data });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Fetch Models Endpoint ───
app.get('/api/ai/models', async (req, res) => {
  try {
    const { apiUrl, apiKey } = req.query;
    if (!apiUrl) return res.status(400).json({ error: 'Missing API URL' });
    if (!apiKey) return res.status(400).json({ error: 'Missing API key' });

    let modelsUrl = apiUrl;
    if (apiUrl.endsWith('/chat/completions')) {
      modelsUrl = apiUrl.replace('/chat/completions', '/models');
    } else if (!apiUrl.endsWith('/models')) {
      modelsUrl = apiUrl.replace(/\/?$/, '') + '/models';
    }

    const response = await fetch(modelsUrl, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `HTTP ${response.status}: ${errText.slice(0, 500)}` });
    }

    const data = await response.json();
    const models = data.data || data.models || data;
    if (!Array.isArray(models)) {
      return res.status(500).json({ error: 'Unexpected response format from models endpoint' });
    }

    const modelList = models.map(m => typeof m === 'string' ? m : (m.id || m.name || JSON.stringify(m)));
    res.json({ models: modelList });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Test Connection Endpoint ───
app.post('/api/ai/test', async (req, res) => {
  try {
    const { provider, apiKey, model, customUrl } = req.body;
    const testMessages = [{ role: 'user', content: 'Say "hello" in one word.' }];

    const response = await fetch(`http://localhost:${PORT}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey, model, customUrl, messages: testMessages })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    res.json({ success: true, message: data.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Serve all HTML pages ───
const pages = ['index.html', 'software-type.html', 'company-type.html', 'name-generator.html', 'personalities.html', 'meta-editor.html'];
pages.forEach(page => {
  app.get('/' + page, (req, res) => res.sendFile(path.join(__dirname, page)));
});

app.listen(PORT, HOST, () => {
  console.log(`
===============================================
   Software Inc Mod Studio — Local Deploy
===============================================
   Server:  http://localhost:${PORT}
   Network: http://192.168.x.x:${PORT}
===============================================
   AI proxy active — no CORS issues
   Press Ctrl+C to stop
`);
});
