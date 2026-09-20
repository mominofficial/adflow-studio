/**
 * AdFlow Studio — 10-Second Ad Commercial & Google Flow Prompt Engine
 * Multi-modal Gemini API integration with ChatGPT Storyboard generation & Flow video prompting
 */

(function () {
  'use strict';

  // Auto-migrate legacy/deprecated models from local storage
  let savedModel = localStorage.getItem('adflow_gemini_model');
  if (!savedModel || savedModel === 'gemini-2.5-flash') {
    savedModel = 'gemini-3.6-flash';
    localStorage.setItem('adflow_gemini_model', 'gemini-3.6-flash');
  }

  // --- State ---
  const state = {
    apiKey: localStorage.getItem('adflow_gemini_api_key') || '',
    model: savedModel,
    brandFile: null,
    brandImageBase64: null,
    brandImageMime: null,
    storyboardPrompt: '',
    storyboardFile: null,
    storyboardImageBase64: null,
    storyboardImageMime: null,
    flowPrompt: '',
    soundDesign: '',
    currentStep: 1,
  };

  // --- DOM Elements ---
  const el = {
    // Header & Modals
    apiKeyModal: document.getElementById('apiKeyModal'),
    openApiKeyModalBtn: document.getElementById('openApiKeyModalBtn'),
    closeApiKeyModalBtn: document.getElementById('closeApiKeyModalBtn'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    toggleApiKeyVisibilityBtn: document.getElementById('toggleApiKeyVisibilityBtn'),
    eyeIcon: document.getElementById('eyeIcon'),
    geminiModelSelect: document.getElementById('geminiModelSelect'),
    customModelGroup: document.getElementById('customModelGroup'),
    customModelInput: document.getElementById('customModelInput'),
    testApiKeyBtn: document.getElementById('testApiKeyBtn'),
    saveApiKeyBtn: document.getElementById('saveApiKeyBtn'),
    apiTestFeedback: document.getElementById('apiTestFeedback'),
    apiKeyStatusDot: document.getElementById('apiKeyStatusDot'),
    apiKeyStatusText: document.getElementById('apiKeyStatusText'),
    demoModeBtn: document.getElementById('demoModeBtn'),
    toastContainer: document.getElementById('toastContainer'),

    // Stepper
    stepNode1: document.getElementById('stepNode1'),
    stepNode2: document.getElementById('stepNode2'),
    stepNode3: document.getElementById('stepNode3'),
    connector1: document.getElementById('connector1'),
    connector2: document.getElementById('connector2'),

    // Section 1: Brand Asset
    brandDropZone: document.getElementById('brandDropZone'),
    brandFileInput: document.getElementById('brandFileInput'),
    brandDropContent: document.getElementById('brandDropContent'),
    brandPreviewBox: document.getElementById('brandPreviewBox'),
    brandPreviewImg: document.getElementById('brandPreviewImg'),
    removeBrandFileBtn: document.getElementById('removeBrandFileBtn'),
    brandNameInput: document.getElementById('brandNameInput'),
    adVibeSelect: document.getElementById('adVibeSelect'),
    generateStoryboardPromptBtn: document.getElementById('generateStoryboardPromptBtn'),

    // Section 2: ChatGPT Storyboard Output
    storyboardLoader: document.getElementById('storyboardLoader'),
    storyboardEmptyState: document.getElementById('storyboardEmptyState'),
    storyboardOutputBox: document.getElementById('storyboardOutputBox'),
    storyboardPromptText: document.getElementById('storyboardPromptText'),
    copyStoryboardPromptBtn: document.getElementById('copyStoryboardPromptBtn'),
    frameBadges: document.getElementById('frameBadges'),

    // Section 3: Storyboard Upload
    storyboardDropZone: document.getElementById('storyboardDropZone'),
    storyboardFileInput: document.getElementById('storyboardFileInput'),
    storyboardDropContent: document.getElementById('storyboardDropContent'),
    storyboardPreviewBox: document.getElementById('storyboardPreviewBox'),
    storyboardPreviewImg: document.getElementById('storyboardPreviewImg'),
    removeStoryboardFileBtn: document.getElementById('removeStoryboardFileBtn'),
    generateFlowPromptBtn: document.getElementById('generateFlowPromptBtn'),

    // Section 4: Google Flow Output
    flowLoader: document.getElementById('flowLoader'),
    flowEmptyState: document.getElementById('flowEmptyState'),
    flowOutputBox: document.getElementById('flowOutputBox'),
    flowPromptText: document.getElementById('flowPromptText'),
    copyFlowPromptBtn: document.getElementById('copyFlowPromptBtn'),
    soundDesignContent: document.getElementById('soundDesignContent'),
    exportBriefBtn: document.getElementById('exportBriefBtn'),
    resetAllBtn: document.getElementById('resetAllBtn'),
  };

  // --- Initialization ---
  function init() {
    setupEventListeners();
    setModelSelection(state.model);
    updateApiKeyStatusUI();
    if (state.apiKey) {
      el.apiKeyInput.value = state.apiKey;
    }
  }

  // --- Event Listeners ---
  function setupEventListeners() {
    // API Key Modal
    el.openApiKeyModalBtn.addEventListener('click', openApiKeyModal);
    el.closeApiKeyModalBtn.addEventListener('click', closeApiKeyModal);
    el.apiKeyModal.addEventListener('click', (e) => {
      if (e.target === el.apiKeyModal) closeApiKeyModal();
    });
    el.toggleApiKeyVisibilityBtn.addEventListener('click', toggleApiKeyVisibility);
    el.testApiKeyBtn.addEventListener('click', testApiKeyConnection);
    el.saveApiKeyBtn.addEventListener('click', saveApiKeySettings);

    // Model select change listener
    el.geminiModelSelect.addEventListener('change', () => {
      if (el.geminiModelSelect.value === 'custom') {
        el.customModelGroup.classList.remove('hidden');
        el.customModelInput.focus();
      } else {
        el.customModelGroup.classList.add('hidden');
      }
    });

    // Dropzone 1: Brand Asset
    setupDropZone(
      el.brandDropZone,
      el.brandFileInput,
      handleBrandFileSelect,
      'dragover'
    );
    el.removeBrandFileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeBrandFile();
    });

    // Dropzone 2: Storyboard Asset
    setupDropZone(
      el.storyboardDropZone,
      el.storyboardFileInput,
      handleStoryboardFileSelect,
      'dragover-cyan'
    );
    el.removeStoryboardFileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeStoryboardFile();
    });

    // Action Buttons
    el.generateStoryboardPromptBtn.addEventListener('click', handleGenerateStoryboardPrompt);
    el.generateFlowPromptBtn.addEventListener('click', handleGenerateFlowPrompt);
    el.copyStoryboardPromptBtn.addEventListener('click', () => copyToClipboard(el.storyboardPromptText.value, 'ChatGPT Storyboard Prompt'));
    el.copyFlowPromptBtn.addEventListener('click', () => copyToClipboard(el.flowPromptText.value, 'Google Flow Prompt'));
    el.exportBriefBtn.addEventListener('click', exportAdBrief);
    el.resetAllBtn.addEventListener('click', resetAll);
    el.demoModeBtn.addEventListener('click', loadDemoPreset);
  }

  // --- Generic Dropzone Handler ---
  function setupDropZone(dropZone, fileInput, onFileSelected, dragoverClass) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add(dragoverClass);
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove(dragoverClass);
      }, false);
    });

    dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt.files && dt.files.length > 0) {
        onFileSelected(dt.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        onFileSelected(e.target.files[0]);
      }
    });
  }

  // --- File Handlers ---
  function handleBrandFileSelect(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Please upload a valid image file (PNG, JPG, WebP)', 'error');
      return;
    }
    state.brandFile = file;
    state.brandImageMime = file.type;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      state.brandImageBase64 = dataUrl.split(',')[1];
      el.brandPreviewImg.src = dataUrl;
      el.brandDropContent.classList.add('hidden');
      el.brandPreviewBox.classList.remove('hidden');
      showToast('Brand asset uploaded successfully', 'success');
    };
    reader.readAsDataURL(file);
  }

  function removeBrandFile() {
    state.brandFile = null;
    state.brandImageBase64 = null;
    state.brandImageMime = null;
    el.brandFileInput.value = '';
    el.brandPreviewImg.src = '';
    el.brandPreviewBox.classList.add('hidden');
    el.brandDropContent.classList.remove('hidden');
  }

  function handleStoryboardFileSelect(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Please upload a valid storyboard image file', 'error');
      return;
    }
    state.storyboardFile = file;
    state.storyboardImageMime = file.type;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      state.storyboardImageBase64 = dataUrl.split(',')[1];
      el.storyboardPreviewImg.src = dataUrl;
      el.storyboardDropContent.classList.add('hidden');
      el.storyboardPreviewBox.classList.remove('hidden');
      showToast('Storyboard asset loaded', 'success');
    };
    reader.readAsDataURL(file);
  }

  function removeStoryboardFile() {
    state.storyboardFile = null;
    state.storyboardImageBase64 = null;
    state.storyboardImageMime = null;
    el.storyboardFileInput.value = '';
    el.storyboardPreviewImg.src = '';
    el.storyboardPreviewBox.classList.add('hidden');
    el.storyboardDropContent.classList.remove('hidden');
  }

  // --- API Key Modal & Settings ---
  function openApiKeyModal() {
    el.apiKeyModal.classList.remove('hidden');
    el.apiTestFeedback.classList.add('hidden');
  }

  function closeApiKeyModal() {
    el.apiKeyModal.classList.add('hidden');
  }

  function toggleApiKeyVisibility() {
    const isPassword = el.apiKeyInput.type === 'password';
    el.apiKeyInput.type = isPassword ? 'text' : 'password';
    el.eyeIcon.innerHTML = isPassword
      ? `<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/>`
      : `<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>`;
  }

  function getSelectedModel() {
    const sel = el.geminiModelSelect.value;
    if (sel === 'custom') {
      return el.customModelInput.value.trim() || 'gemini-3.6-flash';
    }
    return sel;
  }

  function setModelSelection(modelName) {
    state.model = modelName;
    localStorage.setItem('adflow_gemini_model', modelName);

    const foundOption = Array.from(el.geminiModelSelect.options).find(o => o.value === modelName);
    if (foundOption) {
      el.geminiModelSelect.value = modelName;
      el.customModelGroup.classList.add('hidden');
    } else {
      el.geminiModelSelect.value = 'custom';
      el.customModelInput.value = modelName;
      el.customModelGroup.classList.remove('hidden');
    }
    updateApiKeyStatusUI();
  }

  async function testApiKeyConnection() {
    const key = el.apiKeyInput.value.trim();
    let model = getSelectedModel();

    if (!key) {
      showModalFeedback('Please enter a Gemini API Key to test.', 'error');
      return;
    }

    if (model === 'gemini-2.5-flash') {
      model = 'gemini-3.6-flash';
      setModelSelection('gemini-3.6-flash');
    }

    el.testApiKeyBtn.disabled = true;
    el.testApiKeyBtn.querySelector('.btn-text').textContent = 'Connecting...';
    showModalFeedback('Testing connection to Google Gemini API...', '');

    async function tryTest(testModel) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Respond with "Connection Successful".' }] }],
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        const errMsg = data.error?.message || 'API request failed';
        // Check if model is deprecated and Google suggested a new one
        if (errMsg.includes('no longer available') || errMsg.includes('models/')) {
          const match = errMsg.match(/models\/(gemini-[\w\.-]+)/g);
          let recModel = 'gemini-3.6-flash';
          if (match && match.length > 1) {
            recModel = match[1].replace('models/', '');
          } else if (match && match.length === 1 && !match[0].includes(testModel)) {
            recModel = match[0].replace('models/', '');
          }
          if (recModel && recModel !== testModel) {
            setModelSelection(recModel);
            showModalFeedback(`Notice: ${testModel} is deprecated. Upgraded to ${recModel}. Retrying...`, '');
            return await tryTest(recModel);
          }
        }
        throw new Error(errMsg);
      }
      return data;
    }

    try {
      await tryTest(model);
      showModalFeedback(`Connection Verified! Your Gemini API key is valid and connected to ${state.model}.`, 'success');
    } catch (err) {
      showModalFeedback(`Connection failed: ${err.message}`, 'error');
    } finally {
      el.testApiKeyBtn.disabled = false;
      el.testApiKeyBtn.querySelector('.btn-text').textContent = 'Test Connection';
    }
  }

  function saveApiKeySettings() {
    const key = el.apiKeyInput.value.trim();
    const model = getSelectedModel();

    state.apiKey = key;
    setModelSelection(model);
    localStorage.setItem('adflow_gemini_api_key', key);

    updateApiKeyStatusUI();
    closeApiKeyModal();
    showToast(key ? `Gemini API key saved (${state.model})` : 'Gemini API key cleared (Demo mode available)', 'success');
  }

  function updateApiKeyStatusUI() {
    if (state.apiKey) {
      el.apiKeyStatusDot.classList.add('active');
      el.apiKeyStatusText.textContent = `Connected (${state.model})`;
    } else {
      el.apiKeyStatusDot.classList.remove('active');
      el.apiKeyStatusText.textContent = 'Set Gemini API Key';
    }
  }

  function showModalFeedback(msg, type) {
    el.apiTestFeedback.textContent = msg;
    el.apiTestFeedback.className = `modal-feedback ${type}`;
    el.apiTestFeedback.classList.remove('hidden');
  }

  // --- Gemini API Call Wrapper ---
  async function callGemini(prompt, imageBase64 = null, imageMime = 'image/jpeg') {
    if (!state.apiKey) {
      openApiKeyModal();
      throw new Error('Please enter your Gemini API Key in the settings first, or click "Load Demo Preset" in the top bar.');
    }

    let modelToUse = state.model || 'gemini-3.6-flash';
    if (modelToUse === 'gemini-2.5-flash') {
      modelToUse = 'gemini-3.6-flash';
      setModelSelection('gemini-3.6-flash');
    }

    const parts = [];
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: imageMime,
          data: imageBase64,
        },
      });
    }
    parts.push({ text: prompt });

    async function executeRequest(model) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${state.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              temperature: 0.7,
              topP: 0.95,
            },
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        const errMsg = data.error?.message || 'Gemini API call failed';
        // Auto-detect model deprecation notice and migrate
        if (errMsg.includes('no longer available') || errMsg.includes('models/')) {
          const match = errMsg.match(/models\/(gemini-[\w\.-]+)/g);
          let recModel = 'gemini-3.6-flash';
          if (match && match.length > 1) {
            recModel = match[1].replace('models/', '');
          } else if (match && match.length === 1 && !match[0].includes(model)) {
            recModel = match[0].replace('models/', '');
          }
          if (recModel && recModel !== model) {
            console.log(`Auto-migrating model from ${model} to ${recModel}`);
            setModelSelection(recModel);
            showToast(`Auto-switching to recommended ${recModel}...`, 'info');
            return await executeRequest(recModel);
          }
        }
        throw new Error(errMsg);
      }

      const candidate = data.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('No content returned from Gemini model');
      }
      return text;
    }

    return await executeRequest(modelToUse);
  }

  // --- STAGE 1: Generate ChatGPT Storyboard Prompt ---
  async function handleGenerateStoryboardPrompt() {
    if (!state.brandImageBase64) {
      showToast('Please upload a brand/product image first', 'error');
      return;
    }

    const brandName = el.brandNameInput.value.trim() || 'the featured product / brand';
    const vibe = el.adVibeSelect.options[el.adVibeSelect.selectedIndex].text;

    // Show Loader UI
    el.storyboardEmptyState.classList.add('hidden');
    el.storyboardOutputBox.classList.add('hidden');
    el.storyboardLoader.classList.remove('hidden');
    el.generateStoryboardPromptBtn.disabled = true;

    const systemPrompt = `
You are an expert commercial advertising director and DALL-E / ChatGPT image prompt engineer.
Analyze the uploaded image representing ${brandName}. The style/mood requested is: "${vibe}".

Your task:
Craft an ultra-detailed, cinematic prompt intended for ChatGPT / DALL-E 3 to generate a 4-panel storyboard image (2x2 grid format) for a 10-SECOND COMMERCIAL ADVERTISEMENT.

STRICT CONSTRAINTS FOR THE 10-SECOND COMMERCIAL:
- Total length: Exactly 10 seconds.
- Frame 1 [00:00 - 00:02]: Visual Hook & Hero Reveal (Dynamic lighting, extreme macro or dramatic camera angle introducing the product).
- Frame 2 [00:02 - 00:05]: Product in Motion / High-Impact Feature (Action, liquid splash, energetic physics, or human interaction showing value).
- Frame 3 [00:05 - 00:08]: Peak Sensory Climax & Benefit (Transformation, premium aesthetic payoff, radiant atmosphere).
- Frame 4 [00:08 - 00:10]: Brand Outro & Logo Reveal (Polished, minimalist final frame with the brand logo/product centered cleanly on a premium background).

FORMAT INSTRUCTIONS:
Return ONLY the ready-to-copy prompt for ChatGPT inside a clean block, structured clearly so ChatGPT generates a single consolidated 4-panel storyboard image with photorealistic quality, 8k commercial cinematography, and consistent styling across all 4 frames.
`;

    try {
      const generatedText = await callGemini(systemPrompt, state.brandImageBase64, state.brandImageMime);
      state.storyboardPrompt = generatedText.trim();

      el.storyboardPromptText.value = state.storyboardPrompt;
      el.storyboardLoader.classList.add('hidden');
      el.storyboardOutputBox.classList.remove('hidden');

      // Update Stepper
      state.currentStep = 2;
      updateStepperUI();
      showToast('ChatGPT Storyboard Prompt generated! Copy and paste it into ChatGPT.', 'success');
    } catch (err) {
      el.storyboardLoader.classList.add('hidden');
      el.storyboardEmptyState.classList.remove('hidden');
      showToast(err.message, 'error');
    } finally {
      el.generateStoryboardPromptBtn.disabled = false;
    }
  }

  // --- STAGE 2: Generate Google Flow Prompt ---
  async function handleGenerateFlowPrompt() {
    if (!state.storyboardImageBase64) {
      showToast('Please upload the generated storyboard image first', 'error');
      return;
    }

    const brandName = el.brandNameInput.value.trim() || 'the brand in the image';
    const vibe = el.adVibeSelect.options[el.adVibeSelect.selectedIndex].text;

    // Show Loader UI
    el.flowEmptyState.classList.add('hidden');
    el.flowOutputBox.classList.add('hidden');
    el.flowLoader.classList.remove('hidden');
    el.generateFlowPromptBtn.disabled = true;

    const flowSystemPrompt = `
You are a senior AI video prompt engineer specializing in Google Flow (Veo / Video FX).
Analyze this uploaded multi-frame storyboard image representing a 10-second commercial for ${brandName} in "${vibe}" style.

STRICT COMMERCIAL CONSTRAINTS MANDATED BY CLIENT:
1. DURATION: Exactly 10 seconds total runtime.
2. NO VOICEOVER: Absolutely NO voiceover, spoken words, or narration.
3. SOUND/AUDIO: Pure sound design only! Specify rich atmospheric background music, tempo transitions, and crisp tactile foley sound effects (e.g. whoosh, clicks, deep bass drop, ambient synth pad).
4. NO ON-SCREEN TEXT during the narrative scenes (No floating subtitles or bullet points).
5. OUTRO: The final 1 to 2 seconds (08.0s to 10.0s) MUST be a dedicated, elegant brand outro reveal featuring the brand logo/product silhouette cleanly resolving with a subtle shimmer.

OUTPUT FORMAT:
Generate two distinct sections:
[GOOGLE_FLOW_PROMPT]
(The comprehensive, camera-directed prompt optimized for Google Flow text-to-video / image-to-video generator. Include exact camera motion: focal length, dolly speeds, frame rates, lighting transitions from scene 1 through scene 4, and the final 1-2s brand outro transition.)

[AUDIO_DESIGN_SPEC]
(Detailed sound effects, foley cues, and music rhythm breakdown with NO VOICEOVER.)
`;

    try {
      const result = await callGemini(flowSystemPrompt, state.storyboardImageBase64, state.storyboardImageMime);

      // Parse sections
      let flowPrompt = result;
      let soundSpec = 'Dynamic cinematic background music with swelling atmospheric synths and crisp tactile foley effects. No voiceover.';

      if (result.includes('[GOOGLE_FLOW_PROMPT]') && result.includes('[AUDIO_DESIGN_SPEC]')) {
        const parts = result.split('[AUDIO_DESIGN_SPEC]');
        flowPrompt = parts[0].replace('[GOOGLE_FLOW_PROMPT]', '').trim();
        soundSpec = parts[1].trim();
      }

      state.flowPrompt = flowPrompt;
      state.soundDesign = soundSpec;

      el.flowPromptText.value = flowPrompt;
      el.soundDesignContent.textContent = soundSpec;

      el.flowLoader.classList.add('hidden');
      el.flowOutputBox.classList.remove('hidden');

      // Update Stepper
      state.currentStep = 3;
      updateStepperUI();
      showToast('Google Flow video prompt created! Ready for generation.', 'success');
    } catch (err) {
      el.flowLoader.classList.add('hidden');
      el.flowEmptyState.classList.remove('hidden');
      showToast(err.message, 'error');
    } finally {
      el.generateFlowPromptBtn.disabled = false;
    }
  }

  // --- Stepper UI ---
  function updateStepperUI() {
    el.stepNode1.classList.remove('active', 'completed');
    el.stepNode2.classList.remove('active', 'completed');
    el.stepNode3.classList.remove('active', 'completed');
    el.connector1.classList.remove('active');
    el.connector2.classList.remove('active');

    if (state.currentStep >= 1) {
      el.stepNode1.classList.add(state.currentStep > 1 ? 'completed' : 'active');
    }
    if (state.currentStep >= 2) {
      el.connector1.classList.add('active');
      el.stepNode2.classList.add(state.currentStep > 2 ? 'completed' : 'active');
    }
    if (state.currentStep >= 3) {
      el.connector2.classList.add('active');
      el.stepNode3.classList.add('active');
    }
  }

  // --- Copy to Clipboard ---
  async function copyToClipboard(text, label) {
    if (!text) {
      showToast('Nothing to copy yet', 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied to clipboard!`, 'success');
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast(`${label} copied!`, 'success');
    }
  }

  // --- Export Full Ad Brief ---
  function exportAdBrief() {
    const brandName = el.brandNameInput.value.trim() || 'Commercial Ad Campaign';
    const vibe = el.adVibeSelect.options[el.adVibeSelect.selectedIndex].text;
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    const markdown = `# Commercial Production Brief: ${brandName}
**Generated via AdFlow Studio** | Date: ${dateStr}

---

## 1. Commercial Overview
- **Product / Brand**: ${brandName}
- **Vibe / Style**: ${vibe}
- **Total Duration**: 10 Seconds (Commercial format)
- **Voiceover**: NONE (Pure sound design and ambient score)
- **On-Screen Text**: None in narrative scenes
- **Outro**: 1 to 2 Second Brand Reveal (08.0s - 10.0s)

---

## 2. Stage 1: ChatGPT 10s Storyboard Prompt
Copy and paste this into ChatGPT (or DALL-E 3) to generate the 4-frame visual storyboard image:

\`\`\`
${el.storyboardPromptText.value || 'N/A'}
\`\`\`

---

## 3. Stage 2: Google Flow Video Generation Prompt
Paste this prompt along with your generated storyboard image into Google Flow / Veo:

\`\`\`
${el.flowPromptText.value || 'N/A'}
\`\`\`

---

## 4. Audio Design & Foley Spec
${el.soundDesignContent.textContent || 'Atmospheric cinematic soundscape with dynamic foley. No voiceover.'}

---

*Engineered with Google Gemini AI & AdFlow Studio*
`;

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${brandName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_10s_ad_brief.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Ad brief downloaded successfully!', 'success');
  }

  // --- Reset All ---
  function resetAll() {
    if (confirm('Start a new project? This will clear current uploads and generated prompts.')) {
      removeBrandFile();
      removeStoryboardFile();
      el.brandNameInput.value = '';
      el.storyboardPromptText.value = '';
      el.flowPromptText.value = '';
      el.soundDesignContent.textContent = '';
      el.storyboardOutputBox.classList.add('hidden');
      el.storyboardEmptyState.classList.remove('hidden');
      el.flowOutputBox.classList.add('hidden');
      el.flowEmptyState.classList.remove('hidden');
      state.currentStep = 1;
      updateStepperUI();
      showToast('New project started', 'success');
    }
  }

  // --- Demo Preset Loader ---
  function loadDemoPreset() {
    // 1. Create a simulated brand product canvas image
    const brandCanvas = document.createElement('canvas');
    brandCanvas.width = 600;
    brandCanvas.height = 600;
    const bCtx = brandCanvas.getContext('2d');

    // Luxurious gradient background
    const bgGrad = bCtx.createLinearGradient(0, 0, 600, 600);
    bgGrad.addColorStop(0, '#090b10');
    bgGrad.addColorStop(0.5, '#1e1b4b');
    bgGrad.addColorStop(1, '#0f172a');
    bCtx.fillStyle = bgGrad;
    bCtx.fillRect(0, 0, 600, 600);

    // Glowing circle
    const glowGrad = bCtx.createRadialGradient(300, 300, 20, 300, 300, 220);
    glowGrad.addColorStop(0, 'rgba(139, 92, 246, 0.5)');
    glowGrad.addColorStop(0.6, 'rgba(6, 182, 212, 0.2)');
    glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    bCtx.fillStyle = glowGrad;
    bCtx.beginPath();
    bCtx.arc(300, 300, 220, 0, Math.PI * 2);
    bCtx.fill();

    // Product Bottle Silhouette
    bCtx.fillStyle = '#f8fafc';
    bCtx.roundRect(240, 180, 120, 250, [20, 20, 10, 10]);
    bCtx.fill();

    // Bottle Cap
    bCtx.fillStyle = '#e2e8f0';
    bCtx.roundRect(265, 140, 70, 40, [8, 8, 2, 2]);
    bCtx.fill();

    // Brand Label
    bCtx.fillStyle = '#7c3aed';
    bCtx.font = 'bold 22px system-ui, sans-serif';
    bCtx.textAlign = 'center';
    bCtx.fillText('LUMINA', 300, 270);
    bCtx.fillStyle = '#64748b';
    bCtx.font = '500 13px system-ui, sans-serif';
    bCtx.fillText('AURIC ESSENCE', 300, 295);

    const brandDataUrl = brandCanvas.toDataURL('image/png');
    state.brandImageBase64 = brandDataUrl.split(',')[1];
    state.brandImageMime = 'image/png';
    el.brandPreviewImg.src = brandDataUrl;
    el.brandDropContent.classList.add('hidden');
    el.brandPreviewBox.classList.remove('hidden');
    el.brandNameInput.value = 'Lumina Auric Essence';
    el.adVibeSelect.value = 'cinematic-luxury';

    // 2. Load pre-crafted realistic ChatGPT Storyboard Prompt
    state.storyboardPrompt = `A 4-panel commercial storyboard (2x2 grid) for a 10-second high-end luxury advertisement of "Lumina Auric Essence". 8k commercial cinematography, photorealistic, Hasselblad medium format camera, volumetric studio backlighting:

Panel 1 [00:00 - 00:02: Visual Hook]: Extreme macro close-up of a single golden droplet suspended above a glowing obsidian glass surface. The droplet refracts iridescent violet and cyan light rays, radiating elegance.
Panel 2 [00:02 - 00:05: Feature in Action]: The sleek glass bottle of Lumina Auric Essence bursts upward through a fluid crystalline splash of pure luminous water, frozen in high-speed f/1.4 slow-motion.
Panel 3 [00:05 - 00:08: Sensory Payoff]: A radiant supermodel's cheekbone bathed in golden hour studio illumination, glowing skin texture, cinematic lens flare, product softly resting in the bokeh foreground.
Panel 4 [00:08 - 00:10: Brand Outro]: Minimalist, pure dark silk pedestal with the Lumina bottle centered in soft spotlight. The refined typography "LUMINA" shines in rose-gold foil with an ethereal lens glint.

Grid composition, unified color grading in deep violet, champagne gold, and obsidian.`;

    el.storyboardPromptText.value = state.storyboardPrompt;
    el.storyboardEmptyState.classList.add('hidden');
    el.storyboardOutputBox.classList.remove('hidden');

    // 3. Create a simulated 4-panel storyboard image canvas
    const storyCanvas = document.createElement('canvas');
    storyCanvas.width = 800;
    storyCanvas.height = 800;
    const sCtx = storyCanvas.getContext('2d');

    sCtx.fillStyle = '#06080c';
    sCtx.fillRect(0, 0, 800, 800);

    // 4 quadrants
    const panels = [
      { x: 10, y: 10, w: 385, h: 385, label: 'Frame 1: 00-02s (Hook)', grad1: '#2e1065', grad2: '#3b0764' },
      { x: 405, y: 10, w: 385, h: 385, label: 'Frame 2: 02-05s (Splash)', grad1: '#1e1b4b', grad2: '#0c4a6e' },
      { x: 10, y: 405, w: 385, h: 385, label: 'Frame 3: 05-08s (Glow)', grad1: '#431407', grad2: '#78350f' },
      { x: 405, y: 405, w: 385, h: 385, label: 'Frame 4: 08-10s (Outro)', grad1: '#090b10', grad2: '#1e1b4b' },
    ];

    panels.forEach(p => {
      const pGrad = sCtx.createLinearGradient(p.x, p.y, p.x + p.w, p.y + p.h);
      pGrad.addColorStop(0, p.grad1);
      pGrad.addColorStop(1, p.grad2);
      sCtx.fillStyle = pGrad;
      sCtx.roundRect(p.x, p.y, p.w, p.h, 12);
      sCtx.fill();

      // Border
      sCtx.strokeStyle = 'rgba(255,255,255,0.12)';
      sCtx.lineWidth = 2;
      sCtx.stroke();

      // Label
      sCtx.fillStyle = '#f8fafc';
      sCtx.font = 'bold 16px system-ui, sans-serif';
      sCtx.fillText(p.label, p.x + 20, p.y + 40);

      // Simple visual icon in each panel
      sCtx.fillStyle = 'rgba(255,255,255,0.7)';
      sCtx.beginPath();
      sCtx.arc(p.x + p.w / 2, p.y + p.h / 2, 45, 0, Math.PI * 2);
      sCtx.fill();
    });

    const storyDataUrl = storyCanvas.toDataURL('image/png');
    state.storyboardImageBase64 = storyDataUrl.split(',')[1];
    state.storyboardImageMime = 'image/png';
    el.storyboardPreviewImg.src = storyDataUrl;
    el.storyboardDropContent.classList.add('hidden');
    el.storyboardPreviewBox.classList.remove('hidden');

    // 4. Load pre-crafted realistic Google Flow Prompt with all client constraints
    state.flowPrompt = `[Commercial Prompt for Google Flow]
Length: Exactly 10.0 seconds | Aspect Ratio: 16:9 4K | Style: Cinematic High-End Commercial | Dialogue/Voiceover: NONE | On-Screen Text: NONE until final 2 seconds.

Camera & Scene Motion Choreography:
- [00:00 - 02.0s]: Slow camera dolly-in with extreme macro 90mm probe lens onto an amber-violet liquid droplet hovering above polished obsidian. Atmospheric shallow depth of field. Soft amber rim lighting illuminates micro-ripples.
- [02.0s - 05.0s]: Dynamic seamless speed ramp into a 60fps slow-motion upward fluid burst. The glass bottle of Lumina rises majestically as crystalline water droplets scatter symmetrically around the curved silhouette. Volumetric lighting streaks pass through the glass bottle.
- [05.0s - 08.0s]: Smooth orbiting camera glide at 45-degree angle. Warm, radiant golden-hour light sweeps across the product surface with optical anamorphic flares, capturing the sparkling clarity of the formula.
- [08.0s - 10.0s (MANDATORY BRAND OUTRO)]: Camera gently settles into a locked-off hero center shot. Background dims to a soft velvety dark vignette. In the final 1.5 seconds, the clean embossed rose-gold "LUMINA" brand logo illuminates with a delicate shimmer glint across the letters, holding still until the fade to black.`;

    state.soundDesign = `Audio Design Breakdown (NO VOICEOVER):
- 00:00 - 02.0s: Ambient warm drone with sub-bass resonance, subtle liquid droplet impact foley with rich reverb.
- 02.0s - 05.0s: Crisp high-definition water whoosh and glass resonance, rising rhythmic cinematic synth build.
- 05.0s - 08.0s: Euphoric shimmering synth swell, airy breath texture, high-frequency sparkle foley.
- 08.0s - 10.0s: Clean cinematic sub-bass resolve, gentle metallic chime on the logo reveal, smooth audio fade out.`;

    el.flowPromptText.value = state.flowPrompt;
    el.soundDesignContent.textContent = state.soundDesign;
    el.flowEmptyState.classList.add('hidden');
    el.flowOutputBox.classList.remove('hidden');

    state.currentStep = 3;
    updateStepperUI();
    showToast('Demo commercial preset loaded! Explore the complete workflow.', 'success');
  }

  // --- Toast Notifications ---
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const iconSvg = type === 'success'
      ? `<svg class="mini-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>`
      : `<svg class="mini-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    el.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 4000);
  }

  // Run on DOM ready
  document.addEventListener('DOMContentLoaded', init);
})();
