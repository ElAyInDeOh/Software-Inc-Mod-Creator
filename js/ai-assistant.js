/**
 * AI Assistant - BYOK LLM Integration for Software Inc. Mod Studio
 * Supports: OpenAI, Anthropic, Google Gemini, Ollama, OpenRouter, Custom
 * All API calls are made directly from the browser to the provider.
 */

const AIAssistant = (function() {
  'use strict';

  const STORAGE_KEY = 'simc_ai_config';

  const PROVIDERS = {
    openai: {
      name: 'OpenAI',
      url: 'https://api.openai.com/v1/chat/completions',
      authType: 'bearer',
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      defaultModel: 'gpt-4o-mini',
      headers: (key) => ({ 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }),
      body: (messages, model) => ({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000
      }),
      parse: (data) => data.choices?.[0]?.message?.content || ''
    },
    anthropic: {
      name: 'Anthropic',
      url: 'https://api.anthropic.com/v1/messages',
      authType: 'x-api-key',
      models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
      defaultModel: 'claude-3-5-sonnet-20241022',
      headers: (key) => ({ 'x-api-key': key, 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' }),
      body: (messages, model) => ({
        model,
        messages,
        max_tokens: 2000
      }),
      parse: (data) => data.content?.[0]?.text || ''
    },
    gemini: {
      name: 'Google Gemini',
      url: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
      authType: 'query',
      models: ['gemini-1.5-flash', 'gemini-1.5-pro'],
      defaultModel: 'gemini-1.5-flash',
      headers: () => ({ 'Content-Type': 'application/json' }),
      buildUrl: (url, model, key) => url.replace('{model}', model) + `?key=${key}`,
      body: (messages) => {
        // Convert OpenAI-style messages to Gemini format
        const contents = messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));
        return { contents };
      },
      parse: (data) => data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    },
    ollama: {
      name: 'Ollama (Local)',
      url: 'http://localhost:11434/api/generate',
      authType: 'none',
      models: ['llama3.1', 'llama3', 'mistral', 'codellama', 'phi3'],
      defaultModel: 'llama3.1',
      headers: () => ({ 'Content-Type': 'application/json' }),
      body: (messages, model) => {
        const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
        return { model, prompt, stream: false };
      },
      parse: (data) => data.response || ''
    },
    openrouter: {
      name: 'OpenRouter',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      authType: 'bearer',
      models: ['openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet', 'meta-llama/llama-3.1-70b-instruct'],
      defaultModel: 'openai/gpt-4o-mini',
      headers: (key) => ({ 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'HTTP-Referer': location.href, 'X-Title': 'Software Inc Mod Studio' }),
      body: (messages, model) => ({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000
      }),
      parse: (data) => data.choices?.[0]?.message?.content || ''
    },
    openaiCompatible: {
      name: 'OpenAI Compatible',
      url: '',
      authType: 'bearer',
      models: [],
      defaultModel: '',
      allowCustomModel: true,
      headers: (key) => ({ 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }),
      body: (messages, model) => ({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000
      }),
      parse: (data) => data.choices?.[0]?.message?.content || ''
    },
    custom: {
      name: 'Custom Endpoint',
      url: '',
      authType: 'bearer',
      models: ['custom'],
      defaultModel: 'custom',
      headers: (key) => ({ 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }),
      body: (messages, model) => ({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000
      }),
      parse: (data) => data.choices?.[0]?.message?.content || data.response || data.text || ''
    }
  };

  // ─── Config Management ───

  function getConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveConfig(config) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }

  function clearConfig() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function isConfigured() {
    const cfg = getConfig();
    return cfg && cfg.provider && cfg.apiKey && cfg.apiKey.length > 10;
  }

  // ─── API Calls ───

  async function chat(messages, options = {}) {
    const config = getConfig();
    if (!config) throw new Error('AI not configured. Please add your API key in settings.');

    const provider = PROVIDERS[config.provider];
    if (!provider) throw new Error(`Unknown provider: ${config.provider}`);

    const model = options.model || config.model || provider.defaultModel;
    let url = provider.url;
    let headers = provider.headers(config.apiKey);

    // Use custom URL for compatible/custom providers
    if ((config.provider === 'custom' || config.provider === 'openaiCompatible') && config.customUrl) {
      url = config.customUrl;
    }

    if (provider.authType === 'query' && provider.buildUrl) {
      url = provider.buildUrl(url, model, config.apiKey);
      headers = provider.headers();
    }

    const body = provider.body(messages, model);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status} from ${url}: ${errText.slice(0, 200)}`);
      }

      const data = await response.json();
      const content = provider.parse(data);
      if (!content) throw new Error('Empty response from AI.');
      return content;
    } catch (err) {
      // Provide much better diagnostics
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        throw new Error(
          `Connection failed to: ${url}\n\n` +
          `This is usually a CORS issue. Browsers block cross-origin requests unless the server sends CORS headers.\n\n` +
          `Solutions:\n` +
          `1. If using a local server (LM Studio, etc.), enable CORS in its settings\n` +
          `2. Use a browser extension to bypass CORS (for testing only)\n` +
          `3. Host this tool on the same domain as the API\n\n` +
          `If you see this with a cloud provider, check that the URL is correct and the service is running.`
        );
      }
      throw err;
    }
  }

  // ─── Fetch Models from OpenAI-compatible endpoint ───

  async function fetchModels(apiUrl, apiKey) {
    if (!apiUrl) throw new Error('Please enter an API URL first.');
    if (!apiKey) throw new Error('Please enter an API key first.');

    // Derive models endpoint from chat completions URL
    // e.g. https://api.example.com/v1/chat/completions -> https://api.example.com/v1/models
    let modelsUrl = apiUrl;
    if (apiUrl.endsWith('/chat/completions')) {
      modelsUrl = apiUrl.replace('/chat/completions', '/models');
    } else if (!apiUrl.endsWith('/models')) {
      // If URL doesn't end with /models or /chat/completions, try appending /models
      // But first check if it looks like a base URL
      modelsUrl = apiUrl.replace(/\/?$/, '') + '/models';
    }

    try {
      const response = await fetch(modelsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText.slice(0, 200)}`);
      }

      const data = await response.json();
      // OpenAI format: { data: [{ id: 'model-name', ... }, ...] }
      const models = data.data || data.models || data;
      if (!Array.isArray(models)) {
        throw new Error('Unexpected response format from models endpoint.');
      }

      return models.map(m => typeof m === 'string' ? m : (m.id || m.name || JSON.stringify(m)));
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        throw new Error(
          `Connection failed to: ${modelsUrl}\n\n` +
          `This is usually a CORS issue. Browsers block cross-origin requests unless the server sends CORS headers.\n\n` +
          `Solutions:\n` +
          `1. Enable CORS on your API server\n` +
          `2. Use a browser extension to bypass CORS (for testing only)\n` +
          `3. Check that the URL is correct`
        );
      }
      throw err;
    }
  }

  // ─── Prompt Templates ───

  const SYSTEM_PROMPT = `You are an expert modder for the game Software Inc. You create balanced, well-designed mods using the TyD file format.

Rules for generating content:
1. DevTime values should be balanced (SpecFeatures: 4-10, SubFeatures: 2-6)
2. Submarkets are arrays of 3 numbers that get normalized by the game
3. CodeArt: 1 = programmers only, 0 = artists only, 0.5 = balanced
4. Level 1 subfeatures require basic education, Level 2 requires advanced
5. Level 3 features don't satisfy submarkets and are for scripts only
6. Keep descriptions concise but flavorful (1-2 sentences)
7. Feature names should be clear and professional
8. Submarkets should reflect what the feature actually does

Always respond with valid JSON only. No markdown code blocks, no explanations outside the JSON.`;

  function buildMessages(userPrompt) {
    return [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ];
  }

  const Prompts = {
    generateSoftwareType: (idea, submarkets) => {
      return `Create a complete SoftwareType mod for Software Inc. based on this idea: "${idea}".
The submarkets are: [${(submarkets || ['Gameplay', 'Graphics', 'Story']).join(', ')}].

Return ONLY this JSON structure:
{
  "Name": "Name of the software",
  "Description": "1-2 sentence tooltip description",
  "Random": 0.0-1.0,
  "OSSupport": "True" or "False" or a specific OS category,
  "Popularity": 0.0-1.0,
  "Retention": number of months (18-84),
  "IdealPrice": number,
  "OptimalDevTime": number of employee-months (20-90),
  "SubmarketNames": ["Name1", "Name2", "Name3"],
  "Iterative": 0.0-1.0,
  "Features": [
    {
      "Name": "SpecFeature name",
      "Spec": "specialization tag (3D, Audio, System, 2D, Network, etc.)",
      "Description": "tooltip text",
      "DevTime": number,
      "CodeArt": 0.0-1.0,
      "Submarkets": [n, n, n],
      "Optional": false,
      "Features": [
        {
          "Name": "SubFeature name",
          "Description": "tooltip text",
          "Level": 1 or 2,
          "DevTime": number,
          "CodeArt": 0.0-1.0,
          "Submarkets": [n, n, n]
        }
      ]
    }
  ]
}

Generate 2-3 SpecFeatures, each with 2-3 SubFeatures. Make sure the submarket ratios make sense for the software type.`;
    },

    generateFeature: (softwareName, submarkets, specHint) => {
      return `Generate a SpecFeature (specialization feature) for a Software Inc. software type called "${softwareName}".
The submarkets are: [${submarkets.join(', ')}].
The specialization hint is: "${specHint || 'Create something fitting'}".

Return ONLY this JSON structure:
{
  "Name": "Feature display name",
  "Spec": "specialization tag",
  "Description": "tooltip description (1-2 sentences)",
  "DevTime": number (4-10),
  "CodeArt": 0.0-1.0,
  "Submarkets": [n, n, n],
  "Optional": false,
  "Features": [
    {
      "Name": "SubFeature name",
      "Description": "tooltip",
      "Level": 1 or 2,
      "DevTime": number (2-6),
      "CodeArt": 0.0-1.0,
      "Submarkets": [n, n, n]
    }
  ]
}

Generate 2-3 subfeatures with meaningful submarket distributions.`;
    },

    generateSubFeature: (parentName, parentSpec, submarkets, level) => {
      return `Generate a SubFeature for the "${parentName}" SpecFeature (${parentSpec} specialization) in Software Inc.
The submarkets are: [${submarkets.join(', ')}].
Target level: ${level || 1}.

Return ONLY this JSON structure:
{
  "Name": "SubFeature name",
  "Description": "tooltip description",
  "Level": ${level || 1},
  "DevTime": number (2-6),
  "CodeArt": 0.0-1.0,
  "Submarkets": [n, n, n]
}`;
    },

    generateCompanyType: (softwareTypes) => {
      const swList = softwareTypes.map(s => s.Name).join(', ');
      return `Create a CompanyType for Software Inc. that develops these software types: ${swList}.

Return ONLY this JSON structure:
{
  "Specialization": "Company specialization name",
  "PerYear": 0.2,
  "Min": number,
  "Max": number,
  "Frameworks": true or false,
  "Types": [
    { "Software": "Software Name", "Chance": 0.25-1.0, "Category": "", "Force": false }
  ],
  "Addons": [],
  "NameGen": ""
}

Min should be 2-4, Max should be 4-8. Chance values: 1 = full focus, 0.25 = quarter focus.`;
    },

    generateNameGenerator: (theme) => {
      return `Create a name generator for Software Inc. with the theme: "${theme || 'technology'}".

Return ONLY plain text in this exact format (no markdown, no code blocks):
-start(base)
-base(base2,end,stop)
${theme === 'fantasy' ? 'Shadow\nDragon\nMystic' : 'Cyber\nTech\nData\nNet'}
-base2(end,stop)
${theme === 'fantasy' ? 'Blade\nRealm\nQuest' : 'System\nWorks\nSoft\nWare'}
-end(stop)
${theme === 'fantasy' ? 'Online\nEternal\nUltimate' : 'Pro\nMax\nLite\nOS'}

Create at least 5 words per section, fitting the theme. The output should be a valid name generator file that can be used directly in Software Inc.`;
    },

    explainField: (fieldName, context) => {
      return `Explain the "${fieldName}" field in Software Inc. modding${context ? ` in the context of ${context}` : ''}.

Keep it concise (2-3 sentences) and include a concrete game example. Just return the explanation text, nothing else.`;
    },

    balanceCheck: (softwareTypeJson) => {
      return `Analyze this Software Inc. SoftwareType for balancing issues:
${softwareTypeJson}

Check:
1. Is total feature dev time reasonable compared to OptimalDevTime?
2. Do submarket distributions make sense?
3. Are there any obvious balance problems?

Return a brief analysis (3-5 bullet points). Be constructive.`;
    }
  };

  // ─── High-Level Actions ───

  async function generateSoftwareType(idea, submarkets) {
    const content = await chat(buildMessages(Prompts.generateSoftwareType(idea, submarkets)));
    return extractJson(content);
  }

  async function generateFeature(softwareName, submarkets, specHint) {
    const content = await chat(buildMessages(Prompts.generateFeature(softwareName, submarkets, specHint)));
    return extractJson(content);
  }

  async function generateSubFeature(parentName, parentSpec, submarkets, level) {
    const content = await chat(buildMessages(Prompts.generateSubFeature(parentName, parentSpec, submarkets, level)));
    return extractJson(content);
  }

  async function generateCompanyType(softwareTypes) {
    const content = await chat(buildMessages(Prompts.generateCompanyType(softwareTypes)));
    return extractJson(content);
  }

  async function generateNameGenerator(theme) {
    return await chat(buildMessages(Prompts.generateNameGenerator(theme)));
  }

  async function explainField(fieldName, context) {
    return await chat(buildMessages(Prompts.explainField(fieldName, context)));
  }

  async function balanceCheck(softwareTypeObj) {
    const json = JSON.stringify(softwareTypeObj, null, 2);
    return await chat(buildMessages(Prompts.balanceCheck(json)));
  }

  // ─── Helpers ───

  function extractJson(text) {
    // Try to extract JSON from markdown code blocks or raw text
    const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlock) text = codeBlock[1].trim();

    // Try to find JSON object
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonStr = text.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(jsonStr);
      } catch (e) {
        // Try to clean up common issues
        const cleaned = jsonStr
          .replace(/,\s*([}\]])/g, '$1') // trailing commas
          .replace(/\/\/.*$/gm, ''); // comments
        return JSON.parse(cleaned);
      }
    }

    // If it's plain text (like name generators), just return as-is
    return text;
  }

  function getProviderList() {
    return Object.entries(PROVIDERS).map(([id, p]) => ({
      id,
      name: p.name,
      models: p.models,
      defaultModel: p.defaultModel,
      allowCustomModel: p.allowCustomModel || false
    }));
  }

  // ─── UI Components ───

  function renderSettingsForm(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const config = getConfig() || {};
    const providers = getProviderList();

    container.innerHTML = `
      <div class="mb-4">
        <label class="studio-label">AI Provider</label>
        <select id="ai-provider" class="studio-select">
          ${providers.map(p => `<option value="${p.id}" ${config.provider === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
        </select>
      </div>
      <div class="mb-4">
        <label class="studio-label">API Key</label>
        <input type="password" id="ai-key" class="studio-input" placeholder="sk-..." value="${config.apiKey || ''}">
        <p class="studio-hint">Your key is stored only in your browser. Never shared with anyone.</p>
      </div>
      <div class="mb-4" id="ai-custom-url-container" style="display:none;">
        <label class="studio-label">API URL</label>
        <input type="url" id="ai-custom-url" class="studio-input" placeholder="https://api.example.com/v1/chat/completions" value="${config.customUrl || ''}">
        <p class="studio-hint">Full URL to the chat completions endpoint. Examples:</p>
        <ul class="studio-hint" style="margin: 0.25rem 0 0 1.25rem; list-style: disc;">
          <li>LM Studio: <code>http://localhost:1234/v1/chat/completions</code></li>
          <li>LocalAI: <code>http://localhost:8080/v1/chat/completions</code></li>
          <li>OpenCode Go: <code>https://opencode.ai/zen/go/v1/chat/completions</code></li>
        </ul>
        <div class="studio-alert studio-alert-warning mt-2" style="padding: 0.5rem 0.75rem; font-size: 0.8125rem;">
          <strong>Note:</strong> Browsers block cross-origin requests (CORS). If connecting to a local server, you must enable CORS in its settings, or use a browser extension to bypass CORS for testing.
        </div>
      </div>
      <div class="mb-4">
        <label class="studio-label">Model</label>
        <div id="ai-model-dropdown-container">
          <select id="ai-model" class="studio-select">
            ${providers.map(p => `<optgroup label="${p.name}" data-provider="${p.id}">
              ${p.models.map(m => `<option value="${m}" ${config.provider === p.id && config.model === m ? 'selected' : ''}>${m}</option>`).join('')}
            </optgroup>`).join('')}
          </select>
        </div>
        <div id="ai-model-text-container" style="display:none;">
          <div class="flex gap-2">
            <input type="text" id="ai-model-text" class="studio-input" placeholder="model-id" value="${config.model || ''}">
            <button type="button" id="ai-fetch-models-btn" class="studio-btn studio-btn-secondary studio-btn-sm">Fetch Models</button>
          </div>
          <div id="ai-models-result" class="mt-2" style="display:none;">
            <select id="ai-models-select" class="studio-select">
              <option value="">-- Select a model --</option>
            </select>
          </div>
        </div>
      </div>
      <div class="flex gap-2">
        <button type="button" id="ai-save-btn" class="studio-btn studio-btn-primary">Save & Test</button>
        <button type="button" id="ai-clear-btn" class="studio-btn studio-btn-secondary">Forget Key</button>
      </div>
      <div id="ai-test-result" class="mt-3"></div>
    `;

    // Provider change handler
    const providerSelect = container.querySelector('#ai-provider');
    const modelSelect = container.querySelector('#ai-model');
    const modelDropdownContainer = container.querySelector('#ai-model-dropdown-container');
    const modelTextContainer = container.querySelector('#ai-model-text-container');
    const customUrlContainer = container.querySelector('#ai-custom-url-container');

    function updateModelOptions() {
      const providerId = providerSelect.value;
      const provider = providers.find(p => p.id === providerId);
      
      // Show/hide custom URL
      const needsUrl = providerId === 'custom' || providerId === 'openaiCompatible';
      customUrlContainer.style.display = needsUrl ? 'block' : 'none';

      // Show/hide model input type
      const allowCustomModel = provider?.allowCustomModel || providerId === 'custom';
      if (allowCustomModel) {
        modelDropdownContainer.style.display = 'none';
        modelTextContainer.style.display = 'block';
      } else {
        modelDropdownContainer.style.display = 'block';
        modelTextContainer.style.display = 'none';
        
        // Show only relevant optgroups
        modelSelect.querySelectorAll('optgroup').forEach(og => {
          og.style.display = og.dataset.provider === providerId ? '' : 'none';
        });

        // Select default model for this provider
        const defaultOpt = modelSelect.querySelector(`optgroup[data-provider="${providerId}"] option:first-child`);
        if (defaultOpt) defaultOpt.selected = true;
      }
    }

    providerSelect.addEventListener('change', updateModelOptions);
    updateModelOptions();

    // Save handler
    container.querySelector('#ai-save-btn').addEventListener('click', async () => {
      const providerId = providerSelect.value;
      const provider = providers.find(p => p.id === providerId);
      const allowCustomModel = provider?.allowCustomModel || providerId === 'custom';
      
      const newConfig = {
        provider: providerId,
        apiKey: container.querySelector('#ai-key').value.trim(),
        model: allowCustomModel 
          ? container.querySelector('#ai-model-text').value.trim()
          : modelSelect.value,
        customUrl: container.querySelector('#ai-custom-url')?.value?.trim() || ''
      };

      if (!newConfig.apiKey && providerId !== 'ollama') {
        document.getElementById('ai-test-result').innerHTML = '<span style="color:var(--danger)">Please enter an API key.</span>';
        return;
      }

      if (!newConfig.model && allowCustomModel) {
        document.getElementById('ai-test-result').innerHTML = '<span style="color:var(--danger)">Please enter a model ID.</span>';
        return;
      }

      saveConfig(newConfig);
      document.getElementById('ai-test-result').innerHTML = '<span class="studio-pulse">Testing connection...</span>';

      try {
        const response = await chat(buildMessages('Say "Hello from Software Inc Mod Studio!" in exactly those words.'), { model: newConfig.model });
        document.getElementById('ai-test-result').innerHTML = `<span style="color:var(--success)">Connected! AI says: "${response.replace(/"/g, '&quot;').slice(0, 100)}"</span>`;
        Studio.toast('AI connection successful!', 'success');
      } catch (err) {
        const errorHtml = err.message.replace(/\n/g, '<br>');
        document.getElementById('ai-test-result').innerHTML = `<div style="color:var(--danger); font-size:0.875rem; line-height:1.5;"><strong>Connection failed:</strong><br>${errorHtml}</div>`;
        Studio.toast('AI connection failed. See details below.', 'danger');
      }
    });

    // Fetch models handler
    const fetchModelsBtn = container.querySelector('#ai-fetch-models-btn');
    if (fetchModelsBtn) {
      fetchModelsBtn.addEventListener('click', async () => {
        const apiUrl = container.querySelector('#ai-custom-url')?.value?.trim();
        const apiKey = container.querySelector('#ai-key')?.value?.trim();
        const modelsResult = container.querySelector('#ai-models-result');
        const modelsSelect = container.querySelector('#ai-models-select');
        const modelText = container.querySelector('#ai-model-text');

        modelsResult.style.display = 'none';
        fetchModelsBtn.disabled = true;
        fetchModelsBtn.textContent = 'Fetching...';

        try {
          const models = await fetchModels(apiUrl, apiKey);
          if (models.length === 0) {
            throw new Error('No models found at this endpoint.');
          }

          modelsSelect.innerHTML = '<option value="">-- Select a model --</option>' +
            models.map(m => `<option value="${m}">${m}</option>`).join('');

          modelsSelect.addEventListener('change', () => {
            if (modelsSelect.value) {
              modelText.value = modelsSelect.value;
            }
          });

          modelsResult.style.display = 'block';
          Studio.toast(`Found ${models.length} models!`, 'success');
        } catch (err) {
          Studio.toast('Fetch failed: ' + err.message, 'danger');
        } finally {
          fetchModelsBtn.disabled = false;
          fetchModelsBtn.textContent = 'Fetch Models';
        }
      });
    }

    // Clear handler
    container.querySelector('#ai-clear-btn').addEventListener('click', () => {
      clearConfig();
      container.querySelector('#ai-key').value = '';
      document.getElementById('ai-test-result').innerHTML = '';
      Studio.toast('AI key forgotten.', 'info');
    });
  }

  // ─── Public API ───

  return {
    getConfig,
    saveConfig,
    clearConfig,
    isConfigured,
    chat,
    fetchModels,
    generateSoftwareType,
    generateFeature,
    generateSubFeature,
    generateCompanyType,
    generateNameGenerator,
    explainField,
    balanceCheck,
    getProviderList,
    renderSettingsForm,
    PROVIDERS
  };
})();

if (typeof window !== 'undefined') {
  window.AIAssistant = AIAssistant;
}
