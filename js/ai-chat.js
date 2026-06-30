/**
 * AI Chat System - Conversational with guided quick-reply bubbles
 */
const AIChat = (function() {
  'use strict';

  const SYSTEM_PROMPT = `You are the AI modding assistant for Software Inc Mod Studio. You build SoftwareType mods via conversation, editing form fields directly with operations.

## CORE BEHAVIOR
Guide the user ONE setting at a time, most to least important. When the user answers, IMMEDIATELY apply operations for what they said AND include quickReplies for the next question in the SAME response. Never ask the next question without first applying the current answer.

Flow: ask question -> user answers -> APPLY operations + message + next quickReplies in one response.

## EXPORTING / DOWNLOADING (CRITICAL — DO NOT GENERATE FILE CONTENT)
When the user asks about exporting, downloading, saving, or getting their mod file, DO NOT try to generate TyD file content or use operations. Instead tell them to use the buttons in the right-side preview panel:
- "Download .tyd" — downloads the current software type as a .tyd file ready for the game.
- "Example Structure" — downloads a zip file containing the complete mod folder structure with working example files (meta.tyd, SoftwareTypes/, CompanyTypes/, NameGenerators/, Thumbnail.png). Extract it to see exactly how to organize a mod.
- "Copy" — copies the TyD to clipboard.

Tell them which button to click and what it does. Use responseType "chat" with no operations for these questions.

## TEST COMMANDS (shown in the preview panel)
The preview panel shows in-game console commands (press ~ in-game to open console). When users ask what these do:
- RELOAD_MOD "ModName" — reloads the mod files without restarting the game. Use after editing your .tyd files.
- TEST_DEV_MOD "ModName" "SoftwareName" Default — tests if players can reach 100% satisfaction when developing the software. Checks your balancing.
- CHECK_SPEC_REP "ModName" — verifies all specialization levels (System, Audio, 3D, etc.) are actually used by features. Catches unused specs.
- INSTA_DEVELOP_DESIGN — instantly finishes and releases the current design. Quick way to test market reception.
Tell users to click a command to copy it to clipboard.

## GUIDED ORDER (most to least important)
1. NAME: Ask what to call it (3 suggestions + "Let me type my own"). On answer: SET_ROOT_FIELD Name + auto-set Description, Unlock, Popularity, Retention, IdealPrice, OptimalDevTime, Iterative defaults.
2. SUBMARKETS: Ask for 3 submarket names (suggest fitting ones). On answer: SET_ROOT_FIELD Sub1, Sub2, Sub3.
3. FEATURES: Ask what major SpecFeatures (suggest 3-4). On answer: ADD_SPECFEATURE for each.
4. SUBFEATURES: For each SpecFeature, ask what sub-features. On answer: ADD_SUBFEATURE (correct specIndex).
5. Optional: OSSupport, Random, OneClient, InHouse, Hardware, NameGenerator if relevant.
6. EXPORT: When the mod is complete, tell the user to click "Download .tyd" to get their file, or "Example Structure" to see the full folder layout.

If user gives lots of detail upfront, apply ALL of it in one response, then ask only what's missing.

## OPERATIONS (all indexes 0-based)
- SET_ROOT_FIELD: {"type":"SET_ROOT_FIELD","field":"Name","value":"Text Editor"} — fields: Name, Description, Unlock, Random, OSSupport, Popularity, Retention, IdealPrice, OptimalDevTime, Iterative, NameGenerator, Sub1, Sub2, Sub3, OneClient, InHouse, Hardware
- ADD_SPECFEATURE: {"type":"ADD_SPECFEATURE","feature":{"Name":"Editing","Spec":"System","Description":"...","DevTime":6,"CodeArt":0.9,"Submarkets":[1,0,0]}}
- MODIFY_SPECFEATURE: {"type":"MODIFY_SPECFEATURE","index":0,"field":"Name","value":"New"} — fields: Name, Spec, Description, DevTime, CodeArt, Server, Dependencies, Unlock
- REMOVE_SPECFEATURE: {"type":"REMOVE_SPECFEATURE","index":0}
- ADD_SUBFEATURE: {"type":"ADD_SUBFEATURE","specIndex":0,"feature":{"Name":"Basic Edit","Description":"...","Level":1,"DevTime":3,"CodeArt":0.9,"Submarkets":[1,0,0]}}
- SET_SUBMARKETS: {"type":"SET_SUBMARKETS","specIndex":0,"values":[1,0,2]}
- CLEAR_FIELD: {"type":"CLEAR_FIELD","field":"Name"}

New SpecFeatures go to END of list. specIndex = position in list counting from 0 (including existing).

## BALANCING
DevTime: SpecFeatures 4-10, SubFeatures 2-6. CodeArt: 1=code, 0=art, 0.5=balanced. 2-3 SpecFeatures each with 2-3 SubFeatures.

## RESPONSE FORMAT (strict JSON, no markdown)
{"responseType":"question|action|chat","message":"concise text","quickReplies":["opt1","opt2","opt3"],"operations":[{"type":"..."}]}

- question: need info. Must include 3-5 quickReplies.
- action: applying operations now. Include operations + message + quickReplies for next question.
- chat: general (explanations, export guidance). quickReplies optional.

Respond with JSON only.`;

  let conversationHistory = [];
  let currentEditorState = null;
  let connectionVerified = false;

  function init(options) {
    currentEditorState = options && options.getState ? options.getState() : null;
    conversationHistory = [{ role: 'system', content: (options && options.systemPrompt) ? options.systemPrompt : SYSTEM_PROMPT }];
    connectionVerified = false;
  }

  function buildStateContext(editorState) {
    if (!editorState) return '';
    // Compact summary — only essential fields, no pretty-print whitespace
    const s = {
      Name: editorState.Name || '',
      Sub1: (editorState.SubmarketNames || ['','',''])[0],
      Sub2: (editorState.SubmarketNames || ['','',''])[1],
      Sub3: (editorState.SubmarketNames || ['','',''])[2],
      Popularity: editorState.Popularity,
      Retention: editorState.Retention,
      IdealPrice: editorState.IdealPrice,
      OptimalDevTime: editorState.OptimalDevTime,
      OSSupport: editorState.OSSupport,
      Features: (editorState.Features || []).map(function(f) {
        return { Name: f.Name, Spec: f.Spec, Sub: (f.Features || []).map(function(sf) { return sf.Name; }) };
      })
    };
    return '\nMOD_STATE:' + JSON.stringify(s);
  }

  // Lightweight pre-flight check: confirms the saved config actually works
  // before sending a real conversation. Called once per session (lazy, efficient).
  async function verifyConnection() {
    if (connectionVerified) return { ok: true };
    const config = AIAssistant.getConfig();
    if (!config) {
      return { ok: false, error: 'AI not configured. Add your API key in settings.' };
    }
    try {
      const testResp = await AIAssistant.chat([
        { role: 'user', content: 'Reply with the single word: ok' }
      ]);
      if (!testResp || !testResp.trim()) {
        return { ok: false, error: 'AI returned an empty response. Check your API key, model name, and provider.' };
      }
      connectionVerified = true;
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function sendMessage(userMessage, options) {
    options = options || {};
    if (!AIAssistant.isConfigured()) {
      throw new Error('AI not configured');
    }
    // Lazy connection test on first message — saves an API call on every page load
    if (!connectionVerified) {
      const check = await verifyConnection();
      if (!check.ok) {
        throw new Error('Connection check failed: ' + check.error);
      }
    }
    if (options.getState) {
      currentEditorState = options.getState();
    }
    // Store bare user message in history (no state — saves tokens)
    conversationHistory.push({ role: 'user', content: userMessage });
    // Build messages: system + recent history, with state only on latest message
    const systemMsg = conversationHistory[0];
    const recentMsgs = conversationHistory.slice(1).slice(-8).map(function(m) {
      return { role: m.role, content: m.content };
    });
    // Append current state only to the last user message
    if (recentMsgs.length > 0 && currentEditorState) {
      const last = recentMsgs[recentMsgs.length - 1];
      if (last.role === 'user') {
        last.content = last.content + buildStateContext(currentEditorState) + '\nRespond with JSON only.';
      }
    }
    const messages = [systemMsg, ...recentMsgs];
    const response = await AIAssistant.chat(messages);
    conversationHistory.push({ role: 'assistant', content: response });
    return parseAIResponse(response);
  }

  function parseAIResponse(text) {
    let jsonStr = text;
    const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlock) jsonStr = codeBlock[1].trim();
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
    }
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.responseType) parsed.responseType = 'chat';
      if (!parsed.message) parsed.message = 'Done!';
      if (!parsed.operations) parsed.operations = [];
      if (!parsed.quickReplies) parsed.quickReplies = [];
      return parsed;
    } catch (e) {
      try {
        const cleaned = jsonStr.replace(/,\s*([}\]])/g, '$1');
        const parsed = JSON.parse(cleaned);
        if (!parsed.responseType) parsed.responseType = 'chat';
        if (!parsed.message) parsed.message = 'Done!';
        if (!parsed.operations) parsed.operations = [];
        if (!parsed.quickReplies) parsed.quickReplies = [];
        return parsed;
      } catch (e2) {
        return { responseType: 'chat', message: text, operations: [], quickReplies: [] };
      }
    }
  }

  function executeOperations(operations, callbacks) {
    const results = [];
    if (!operations || !Array.isArray(operations)) return results;
    operations.forEach(function(op, i) {
      try {
        const cb = callbacks[op.type];
        if (cb) {
          cb(op);
          results.push({ success: true, op: i, type: op.type });
        } else {
          results.push({ success: false, op: i, type: op.type, error: 'No callback for: ' + op.type });
        }
      } catch (err) {
        results.push({ success: false, op: i, type: op.type, error: err.message });
      }
    });
    return results;
  }

  return {
    init: init,
    sendMessage: sendMessage,
    verifyConnection: verifyConnection,
    isConnectionVerified: function() { return connectionVerified; },
    parseAIResponse: parseAIResponse,
    executeOperations: executeOperations
  };
})();

if (typeof window !== 'undefined') {
  window.AIChat = AIChat;
}
