/**
 * AI Chat System
 */
const AIChat = (function() {
  ''use strict'';

  const SYSTEM_PROMPT = `You are the AI assistant for Software Inc Mod Studio.`;

  let conversationHistory = [];
  let currentEditorState = null;

  function init(options) {
    currentEditorState = options && options.getState ? options.getState() : null;
    conversationHistory = [{ role: ''system'', content: SYSTEM_PROMPT }];
  }

  function buildUserPrompt(userMessage, editorState) {
    let context = '''';
    if (editorState) {
      context = ''\n\nCURRENT MOD STATE:\n'' + JSON.stringify(editorState, null, 2);
      if (editorState._validation) {
        context += ''\n\nVALIDATION ISSUES:\n'' + JSON.stringify(editorState._validation, null, 2);
      }
    }
    return ''User: "'' + userMessage + ''"'' + context + ''\n\nRespond with JSON.'';
  }

  async function sendMessage(userMessage, options) {
    options = options || {};
    if (!AIAssistant.isConfigured()) {
      throw new Error(''AI not configured'');
    }
    if (options.getState) {
      currentEditorState = options.getState();
    }
    const prompt = buildUserPrompt(userMessage, currentEditorState);
    conversationHistory.push({ role: ''user'', content: prompt });
    const messages = conversationHistory.slice(-10);
    const response = await AIAssistant.chat(messages);
    conversationHistory.push({ role: ''assistant'', content: response });
    return parseAIResponse(response);
  }

  function parseAIResponse(text) {
    let jsonStr = text;
    const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlock) jsonStr = codeBlock[1].trim();
    const firstBrace = jsonStr.indexOf(''{");
    const lastBrace = jsonStr.lastIndexOf(''}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
    }
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.responseType) parsed.responseType = ''chat'';
      if (!parsed.message) parsed.message = ''Done!'';
      if (!parsed.operations) parsed.operations = [];
      return parsed;
    } catch (e) {
      try {
        const cleaned = jsonStr.replace(/,\s*([}\]])/g, ''$1'');
        const parsed = JSON.parse(cleaned);
        if (!parsed.responseType) parsed.responseType = ''chat'';
        if (!parsed.message) parsed.message = ''Done!'';
        if (!parsed.operations) parsed.operations = [];
        return parsed;
      } catch (e2) {
        return { responseType: ''chat'', message: text, operations: [] };
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
          results.push({ success: false, op: i, type: op.type, error: ''No callback'' });
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
    parseAIResponse: parseAIResponse,
    executeOperations: executeOperations
  };
})();

if (typeof window !== ''undefined'') {
  window.AIChat = AIChat;
}
