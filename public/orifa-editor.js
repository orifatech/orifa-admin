/**
 * Orifa In-Place Visual Content Editor (Client-side Snippet)
 * (c) Orifa Technologies
 * 
 * Usage on Client Website (Astro, Next.js, React):
 * <script src="https://admin.orifatech.com/orifa-editor.js" data-site="PROJECT_ID" data-token="EDITOR_TOKEN" defer></script>
 */

(function () {
  'use strict';

  // Prevent multiple injections
  if (window.__ORIFA_EDITOR_INITIALIZED__) return;
  window.__ORIFA_EDITOR_INITIALIZED__ = true;

  const currentScript = document.currentScript;
  const projectId = currentScript?.getAttribute('data-site');
  const editorToken = currentScript?.getAttribute('data-token');
  const apiEndpoint = currentScript?.getAttribute('data-api') || window.__ORIFA_API_ENDPOINT__ || '';

  // Determine if running inside the Orifa Admin Preview Iframe
  const isEmbeddedInIframe = window.self !== window.top;

  console.log('[Orifa Editor] Initializing visual editor runtime...', {
    projectId,
    embedded: isEmbeddedInIframe,
  });

  // Inject Styles for Highlighting & Toolbar
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .orifa-editable-highlight {
      outline: 2px dashed #3b82f6 !important;
      outline-offset: 3px !important;
      cursor: pointer !important;
      position: relative !important;
      transition: outline-color 0.2s ease, background-color 0.2s ease !important;
    }
    .orifa-editable-highlight:hover {
      outline-color: #2563eb !important;
      background-color: rgba(59, 130, 246, 0.08) !important;
    }
    .orifa-editable-editing {
      outline: 2px solid #10b981 !important;
      outline-offset: 3px !important;
      background-color: rgba(16, 185, 129, 0.05) !important;
    }
    #orifa-floating-toolbar {
      position: fixed;
      z-index: 999999;
      background: #18181b;
      color: #fafafa;
      padding: 6px 10px;
      border-radius: 8px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.2);
      display: none;
      align-items: center;
      gap: 6px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px;
      border: 1px solid #27272a;
    }
    #orifa-floating-toolbar button {
      background: #27272a;
      color: #f4f4f5;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: background 0.15s ease;
    }
    #orifa-floating-toolbar button:hover {
      background: #3f3f46;
    }
    #orifa-floating-toolbar button.orifa-btn-save {
      background: #059669;
      color: white;
    }
    #orifa-floating-toolbar button.orifa-btn-save:hover {
      background: #047857;
    }
    #orifa-floating-toolbar button.orifa-btn-cancel {
      background: transparent;
      color: #a1a1aa;
    }
    #orifa-floating-toolbar button.orifa-btn-cancel:hover {
      background: #27272a;
      color: #f4f4f5;
    }
    #orifa-floating-toolbar .orifa-badge {
      font-size: 11px;
      color: #a1a1aa;
      padding: 2px 6px;
      border-right: 1px solid #3f3f46;
      margin-right: 4px;
    }
  `;
  document.head.appendChild(styleEl);

  // Floating Toolbar Elements
  let activeElement = null;
  let originalHtml = '';
  let originalTargetFile = '';
  let originalContentKey = '';
  let originalContentType = 'text';

  const toolbar = document.createElement('div');
  toolbar.id = 'orifa-floating-toolbar';
  toolbar.innerHTML = `
    <span class="orifa-badge" id="orifa-toolbar-target">Editable</span>
    <button type="button" data-cmd="bold"><b>B</b></button>
    <button type="button" data-cmd="italic"><i>I</i></button>
    <button type="button" class="orifa-btn-save" id="orifa-save-btn">Stage Edit</button>
    <button type="button" class="orifa-btn-cancel" id="orifa-cancel-btn">Cancel</button>
  `;
  document.body.appendChild(toolbar);

  const toolbarTargetLabel = toolbar.querySelector('#orifa-toolbar-target');
  const saveBtn = toolbar.querySelector('#orifa-save-btn');
  const cancelBtn = toolbar.querySelector('#orifa-cancel-btn');

  // Parse data-cms attribute format:
  // Format 1: "src/content/home.json#hero.title"
  // Format 2: "home.json:hero.title"
  // Format 3: "hero.title" (defaults to contentRoot)
  function parseCmsTarget(attrValue) {
    if (!attrValue) return { targetFile: 'content.json', contentKey: 'unknown' };
    if (attrValue.includes('#')) {
      const parts = attrValue.split('#');
      return { targetFile: parts[0], contentKey: parts[1] };
    }
    if (attrValue.includes(':')) {
      const parts = attrValue.split(':');
      return { targetFile: parts[0], contentKey: parts[1] };
    }
    return { targetFile: 'content.json', contentKey: attrValue };
  }

  // Scan and mark all editable elements
  function attachEditableListeners() {
    const editables = document.querySelectorAll('[data-cms]');
    editables.forEach((el) => {
      if (el.__orifaBound) return;
      el.__orifaBound = true;
      el.classList.add('orifa-editable-highlight');

      el.addEventListener('click', (e) => {
        // Only trigger edit mode if shiftKey is held OR embedded in iframe
        if (isEmbeddedInIframe || e.altKey || e.metaKey || window.__ORIFA_EDIT_MODE__) {
          e.preventDefault();
          e.stopPropagation();
          startEditing(el);
        }
      });
    });
  }

  function positionToolbar(target) {
    const rect = target.getBoundingClientRect();
    toolbar.style.display = 'flex';
    const top = Math.max(10, rect.top - 46);
    const left = Math.max(10, Math.min(window.innerWidth - 300, rect.left));
    toolbar.style.top = `${top}px`;
    toolbar.style.left = `${left}px`;
  }

  function startEditing(el) {
    if (activeElement && activeElement !== el) {
      stopEditing(false);
    }

    activeElement = el;
    originalHtml = el.innerHTML;
    const { targetFile, contentKey } = parseCmsTarget(el.getAttribute('data-cms'));
    originalTargetFile = targetFile;
    originalContentKey = contentKey;
    originalContentType = el.tagName === 'IMG' ? 'image' : 'text';

    toolbarTargetLabel.textContent = contentKey;
    el.classList.add('orifa-editable-editing');

    if (el.tagName === 'IMG') {
      const newUrl = prompt('Enter new image URL or staged asset path:', el.src);
      if (newUrl && newUrl !== el.src) {
        dispatchStagedChange({
          targetFile,
          contentKey,
          contentType: 'image',
          originalValue: el.src,
          proposedValue: newUrl,
        });
        el.src = newUrl;
      }
      stopEditing(false);
      return;
    }

    el.setAttribute('contenteditable', 'true');
    el.focus();
    positionToolbar(el);
  }

  function stopEditing(save) {
    if (!activeElement) return;

    activeElement.removeAttribute('contenteditable');
    activeElement.classList.remove('orifa-editable-editing');
    toolbar.style.display = 'none';

    if (!save) {
      activeElement.innerHTML = originalHtml;
    }

    activeElement = null;
  }

  // Handle Save
  saveBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!activeElement) return;

    const proposedValue = activeElement.innerText.trim();
    const originalText = originalHtml.replace(/<[^>]+>/g, '').trim();

    dispatchStagedChange({
      targetFile: originalTargetFile,
      contentKey: originalContentKey,
      contentType: originalContentType,
      originalValue: originalText,
      proposedValue: proposedValue,
    });

    stopEditing(true);
  });

  // Handle Cancel
  cancelBtn.addEventListener('click', (e) => {
    e.preventDefault();
    stopEditing(false);
  });

  // Formatting actions
  toolbar.querySelectorAll('button[data-cmd]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const cmd = btn.getAttribute('data-cmd');
      document.execCommand(cmd, false, null);
    });
  });

  // Dispatch change to parent iframe or backend
  function dispatchStagedChange(change) {
    console.log('[Orifa Editor] Staging change:', change);

    if (isEmbeddedInIframe) {
      // Send message to parent Orifa Admin Dashboard
      window.parent.postMessage(
        {
          type: 'ORIFA_STAGE_CHANGE',
          payload: {
            ...change,
            projectId,
          },
        },
        '*'
      );
      return;
    }

    if (apiEndpoint && editorToken) {
      fetch(`${apiEndpoint}/api/editor/stage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${editorToken}`,
        },
        body: JSON.stringify({
          projectId,
          ...change,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log('[Orifa Editor] Change successfully staged:', data);
        })
        .catch((err) => {
          console.error('[Orifa Editor] Failed to stage change:', err);
        });
    }
  }

  // Listen for messages from parent window
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'ORIFA_TOGGLE_EDIT_MODE') {
      window.__ORIFA_EDIT_MODE__ = !!event.data.enabled;
      console.log('[Orifa Editor] Edit mode:', window.__ORIFA_EDIT_MODE__);
    }
  });

  // Run on initial load and DOM changes
  attachEditableListeners();
  const observer = new MutationObserver(() => attachEditableListeners());
  observer.observe(document.body, { childList: true, subtree: true });
})();
