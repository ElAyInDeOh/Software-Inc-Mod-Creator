/**
 * AI Chat Page Widget — Shared across all modding pages in Software Inc Mod Studio.
 * Include this after ai-assistant.js and ai-chat.js.
 *
 * Usage:
 *   AIChatPage.init({
 *     getState: function() { return myEditorState; },
 *     systemPrompt: 'Optional custom prompt...',
 *     welcomeMessage: 'Optional welcome text...',
 *     starterReplies: ['Quick reply 1', 'Quick reply 2'],
 *     operationCallbacks: { OP_TYPE: function(op) { ... } },
 *     onUpdate: function() { updatePreview(); },
 *     scrollToChange: function(targetEl) { ... }
 *   });
 */
const AIChatPage = (function() {
  'use strict';

  /* Build variant gate: stub everything on the web build.
     See js/runtime.js for the LOCAL_BUILD check. */
  if (typeof window !== 'undefined' && !window.LOCAL_BUILD) {
    return {
      init: function () {},
      toggleChatWidget: function () {},
      updateAIChatStatus: function () {},
      handleStarterClick: function () {},
      handleQuickReply: function () {},
      scrollToChange: function () {},
      toggleChangesList: function () {},
      sendAIChatMessage: function () {},
      addPendingChange: function () {}
    };
  }

  let config = null;
  let chatInitialized = false;
  let pendingChanges = [];

  function init(userConfig) {
    if (!userConfig || typeof userConfig.getState !== 'function') {
      console.error('AIChatPage.init requires a getState function');
      return;
    }
    config = userConfig;
    chatInitialized = false;
    pendingChanges = [];

    const messagesContainer = document.getElementById('ai-chat-messages');
    if (messagesContainer) {
      messagesContainer.addEventListener('click', function(e) {
        const item = e.target.closest('.ai-change-item');
        if (!item) return;
        const sel = item.getAttribute('data-scroll-target');
        if (sel) scrollToChange(sel);
      });
    }

    updateAIChatStatus();
    window.updateAIStatus = updateAIChatStatus;
  }

  function toggleChatWidget() {
    const fab = document.getElementById('chat-fab');
    const win = document.getElementById('chat-window');
    const badge = document.getElementById('chat-fab-badge');
    if (!fab || !win) return;
    const isOpen = win.classList.toggle('open');
    fab.classList.toggle('open', isOpen);
    if (isOpen && badge) badge.classList.remove('show');

    if (isOpen) {
      const messagesContainer = document.getElementById('ai-chat-messages');
      if (!messagesContainer) return;

      if (!AIAssistant.isConfigured()) {
        messagesContainer.innerHTML = '<div class="ai-message ai-message-assistant" style="color:var(--amber);">' +
          '<strong>AI not connected.</strong> <a href="#" onclick="event.preventDefault(); Studio.openModal(\'ai-settings-modal\');" style="color:var(--blue); text-decoration:underline;">Configure your AI provider</a> to start chatting.' +
          '</div>';
      } else {
        if (!messagesContainer.querySelector('.ai-message-user') && !messagesContainer.querySelector('.ai-quickreply')) {
          messagesContainer.innerHTML = '<div class="ai-message ai-message-assistant">' +
            (config.welcomeMessage || 'Hi! I\'m your AI modding assistant. Ask me anything about this editor or let me help you create content.') +
            '</div>';
          if (config.starterReplies && config.starterReplies.length > 0) {
            const qrId = 'qr-' + Date.now();
            let qrHtml = '<div class="ai-quickreplies" id="' + qrId + '">';
            config.starterReplies.forEach(function(r) {
              qrHtml += '<div class="ai-quickreply" onclick="AIChatPage.handleStarterClick(this, \'' + qrId + '\')">' + r.replace(/</g, '&lt;') + '</div>';
            });
            qrHtml += '</div>';
            messagesContainer.insertAdjacentHTML('beforeend', qrHtml);
          }
        }
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
  }

  function updateAIChatStatus() {
    const badge = document.getElementById('chat-fab-badge');
    if (badge && AIAssistant.isConfigured()) badge.classList.add('show');
    else if (badge) badge.classList.remove('show');
  }

  function handleStarterClick(el, containerId) {
    const text = el.textContent;
    const container = document.getElementById(containerId);
    if (container) container.remove();
    sendAIChatMessage(text);
  }

  function handleQuickReply(el, containerId) {
    const text = el.textContent;
    const container = document.getElementById(containerId);
    if (container) container.remove();
    sendAIChatMessage(text);
  }

  function scrollToChange(selector) {
    if (!selector) return;
    const target = document.querySelector(selector);
    if (!target) return;
    if (typeof config.scrollToChange === 'function') {
      config.scrollToChange(target);
      return;
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.remove('ai-highlight');
    void target.offsetWidth;
    target.classList.add('ai-highlight');
    setTimeout(function() { target.classList.remove('ai-highlight'); }, 3200);
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      setTimeout(function() { target.focus(); }, 600);
    }
  }

  function toggleChangesList(headerEl) {
    const list = headerEl.nextElementSibling;
    const chevron = headerEl.querySelector('.ai-changes-chevron');
    if (list) list.classList.toggle('open');
    if (chevron) chevron.classList.toggle('open');
  }

  async function sendAIChatMessage(message) {
    const input = document.getElementById('ai-chat-input');
    const messagesContainer = document.getElementById('ai-chat-messages');
    if (message === undefined) { message = input ? input.value.trim() : ''; }
    if (!message) return;

    if (!AIAssistant.isConfigured()) {
      Studio.openModal('ai-settings-modal');
      Studio.toast('Please configure your AI provider first.', 'warning');
      return;
    }

    messagesContainer.innerHTML += '<div class="ai-message ai-message-user">' + message.replace(/</g, '&lt;') + '</div>';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    if (input) input.value = '';

    const loadingId = 'ai-loading-' + Date.now();
    messagesContainer.innerHTML += '<div class="ai-message ai-message-loading" id="' + loadingId + '"><span class="pulse">Thinking...</span></div>';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
      if (!chatInitialized) {
        AIChat.init({ getState: config.getState, systemPrompt: config.systemPrompt });
        chatInitialized = true;
      }
      if (!AIChat.isConnectionVerified()) {
        document.getElementById(loadingId).innerHTML = '<span class="pulse">Verifying connection...</span>';
        const check = await AIChat.verifyConnection();
        if (!check.ok) {
          document.getElementById(loadingId).remove();
          chatInitialized = false;
          messagesContainer.innerHTML += '<div class="ai-message ai-message-assistant" style="color:var(--red)"><strong>Connection check failed:</strong> ' + check.error.replace(/</g, '&lt;') + '<br><br><a href="#" onclick="event.preventDefault(); Studio.openModal(\'ai-settings-modal\');" style="color:var(--blue); text-decoration:underline;">Open AI settings</a> to fix your configuration.</div>';
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
          return;
        }
        document.getElementById(loadingId).innerHTML = '<span class="pulse">Thinking...</span>';
      }
      const response = await AIChat.sendMessage(message, { getState: config.getState });
      document.getElementById(loadingId).remove();
      messagesContainer.innerHTML += '<div class="ai-message ai-message-assistant">' + response.message.replace(/</g, '&lt;').replace(/\n/g, '<br>') + '</div>';

      if (response.operations && response.operations.length > 0 && config.operationCallbacks) {
        pendingChanges = [];
        const results = AIChat.executeOperations(response.operations, config.operationCallbacks);
        const successCount = results.filter(function(r) { return r.success; }).length;
        const failCount = results.length - successCount;
        if (successCount > 0) {
          let summary = 'Applied ' + successCount + ' change' + (successCount !== 1 ? 's' : '');
          if (failCount > 0) summary += ' (' + failCount + ' failed)';

          const changesId = 'changes-' + Date.now();
          let changesHtml = '<div class="ai-changes" id="' + changesId + '">';
          changesHtml += '<div class="ai-changes-header" onclick="AIChatPage.toggleChangesList(this)">';
          changesHtml += '&#10003; ' + summary;
          changesHtml += '<span class="ai-changes-chevron open">&#9660;</span>';
          changesHtml += '</div>';
          changesHtml += '<div class="ai-changes-list open">';
          pendingChanges.forEach(function(ch) {
            const escaped = ch.label.replace(/</g, '&lt;').replace(/"/g, '&quot;');
            if (ch.selector) {
              const safeSel = ch.selector.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
              changesHtml += '<div class="ai-change-item" data-scroll-target="' + safeSel + '">';
              changesHtml += escaped;
              changesHtml += '<span class="ai-change-item-arrow">&#8594;</span>';
              changesHtml += '</div>';
            } else {
              changesHtml += '<div class="ai-change-item" style="cursor:default; opacity:0.7;">' + escaped + '</div>';
            }
          });
          changesHtml += '</div></div>';
          messagesContainer.insertAdjacentHTML('beforeend', changesHtml);

          Studio.toast('Applied ' + successCount + ' changes. Click to view', 'success');
          if (typeof config.onUpdate === 'function') config.onUpdate();
          if (pendingChanges.length > 0 && pendingChanges[0].selector) {
            setTimeout(function() { scrollToChange(pendingChanges[0].selector); }, 400);
          }
        }
        results.filter(function(r) { return !r.success; }).forEach(function(r) {
          messagesContainer.innerHTML += '<div class="ai-message ai-message-assistant" style="color:var(--red); font-size:0.8125rem;">Could not apply "' + r.type + '": ' + r.error + '</div>';
        });
      }

      if (response.quickReplies && response.quickReplies.length > 0) {
        const qrId = 'qr-' + Date.now();
        const qrHtml = '<div class="ai-quickreplies" id="' + qrId + '">' +
          response.quickReplies.map(function(q) {
            return '<div class="ai-quickreply" onclick="AIChatPage.handleQuickReply(this, \'' + qrId + '\')">' + q.replace(/</g, '&lt;') + '</div>';
          }).join('') +
          '</div>';
        messagesContainer.insertAdjacentHTML('beforeend', qrHtml);
      }

      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (err) {
      const el = document.getElementById(loadingId);
      if (el) el.remove();
      console.error('[AIChat] sendAIChatMessage error:', err);
      var errHtml = '<div class="ai-message ai-message-assistant" style="color:var(--red);">';
      if (err.message && err.message.indexOf('connection') >= 0) {
        errHtml += '<strong>Connection issue.</strong> ' + err.message.replace(/</g, '&lt;') + '<br><br><a href="#" onclick="event.preventDefault(); Studio.openModal(\'ai-settings-modal\');" style="color:var(--blue); text-decoration:underline;">Open AI settings</a>';
      } else {
        errHtml += 'Sorry, I had trouble with that request. ' + err.message.replace(/</g, '&lt;');
      }
      errHtml += '</div>';
      messagesContainer.innerHTML += errHtml;
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  return {
    init: init,
    toggleChatWidget: toggleChatWidget,
    updateAIChatStatus: updateAIChatStatus,
    handleStarterClick: handleStarterClick,
    handleQuickReply: handleQuickReply,
    scrollToChange: scrollToChange,
    toggleChangesList: toggleChangesList,
    sendAIChatMessage: sendAIChatMessage,
    addPendingChange: function(change) { pendingChanges.push(change); }
  };
})();
