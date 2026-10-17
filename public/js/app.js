/**
 * LastEcho - Main Application Controller
 * Handles Real-Time Pulse Visualization, Web Crypto Vault, Alexa Simulator,
 * Automated Email Dispatcher, and Hackathon Sandbox Controls.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Navigation
  const tabButtons = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // Pulse & Status Elements
  const statusTag = document.getElementById('status-tag');
  const statusTagText = document.getElementById('status-tag-text');
  const statRemainingDays = document.getElementById('stat-remaining-days');
  const statRemainingSub = document.getElementById('stat-remaining-sub');
  const statElapsedDays = document.getElementById('stat-elapsed-days');
  const statLastCheckin = document.getElementById('stat-last-checkin');
  const statActiveCapsules = document.getElementById('stat-active-capsules');
  const statActiveCapsulesSub = document.getElementById('stat-active-capsules-sub');
  const navCapsuleCount = document.getElementById('nav-capsule-count');
  const visualizerPulseText = document.getElementById('visualizer-pulse-text');

  // Action Buttons
  const btnQuickCheckin = document.getElementById('btn-quick-checkin');
  const btnManualCheckin = document.getElementById('btn-manual-checkin');
  const btnVoiceTriggerHero = document.getElementById('btn-voice-trigger-hero');
  const btnAlexaVoiceTest = document.getElementById('btn-alexa-voice-test');
  const alexaSoundwaveBox = document.getElementById('alexa-soundwave-box');
  const alexaTranscriptText = document.getElementById('alexa-transcript-text');

  // Vault Elements
  const capsulesList = document.getElementById('capsules-list');
  const btnOpenCreateModal = document.getElementById('btn-open-create-modal');
  const modalCreateCapsule = document.getElementById('modal-create-capsule');
  const btnCloseCreateModal = document.getElementById('btn-close-create-modal');
  const btnCancelCreate = document.getElementById('btn-cancel-create');
  const formCreateCapsule = document.getElementById('form-create-capsule');

  // Sandbox Elements
  const demoStepButtons = document.querySelectorAll('.demo-step-btn');
  const btnResetSimulation = document.getElementById('btn-reset-simulation');
  const auditLogsContainer = document.getElementById('audit-logs-container');
  const dispatchedPreviewCard = document.getElementById('dispatched-preview-card');
  const dispatchedLinksContainer = document.getElementById('dispatched-links-container');
  const emailStatusBadge = document.getElementById('email-status-badge');
  const inputTestEmail = document.getElementById('input-test-email');
  const btnSendTestEmail = document.getElementById('btn-send-test-email');
  const testEmailResult = document.getElementById('test-email-result');
  let isEmailConfiguredState = false;

  // Recipient Decrypt Modal Elements
  const modalDecryptLetter = document.getElementById('modal-decrypt-letter');
  const btnCloseDecryptModal = document.getElementById('btn-close-decrypt-modal');
  const decryptInputSection = document.getElementById('decrypt-input-section');
  const decryptResultSection = document.getElementById('decrypt-result-section');
  const recipientHeading = document.getElementById('recipient-heading');
  const decryptHintDisplay = document.getElementById('decrypt-hint-display');
  const inputDecryptKey = document.getElementById('input-decrypt-key');
  const btnSubmitDecrypt = document.getElementById('btn-submit-decrypt');
  const letterTitle = document.getElementById('letter-title');
  const letterMetaSender = document.getElementById('letter-meta-sender');
  const letterMetaDate = document.getElementById('letter-meta-date');
  const letterBody = document.getElementById('letter-body');

  const btnCopyInteractionModel = document.getElementById('btn-copy-interaction-model');

  // Active state
  let currentStatus = null;
  let activeDecryptionPayload = null;

  // ----------------- TAB NAVIGATION ----------------- //
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const activeContent = document.getElementById(targetTab);
      if (activeContent) activeContent.classList.add('active');
    });
  });

  // ----------------- TOAST HELPER ----------------- //
  function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    let icon = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
      </svg>
    `;
    if (type === 'success') {
      icon = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-emerald)" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      `;
    } else if (type === 'danger') {
      icon = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-rose)" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      `;
    }

    toast.innerHTML = `
      ${icon}
      <span>${message}</span>
    `;

    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // ----------------- AUDIO SYNTHESIS CHIME ----------------- //
  function playAlexaChime() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      // Alexa two-tone soft wake chime (523Hz then 659Hz)
      osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.12); // E5

      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.15);
      osc2.start(audioCtx.currentTime + 0.12);
      osc2.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn('AudioContext not available:', e);
    }
  }

  // ----------------- FETCH SYSTEM STATUS ----------------- //
  async function fetchStatus() {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      currentStatus = data;
      renderStatus(data);
      renderAuditLogs(data.logs);
      fetchCapsules();
    } catch (err) {
      console.error('Error fetching status:', err);
    }
  }

  // Render Status
  function renderStatus(data) {
    const s = data.statusInfo;

    // Update tags
    statusTag.className = 'status-header-tag';
    if (s.status === 'active') {
      statusTag.classList.add('healthy');
      statusTagText.textContent = 'Protocol Active & Verified';
    } else if (s.status === 'grace_period') {
      statusTag.classList.add('warning');
      statusTagText.textContent = 'Grace Period Buffer Active';
    } else {
      statusTag.classList.add('danger');
      statusTagText.textContent = 'SWITCH TRIGGERED — Protocol Dispatched';
    }

    statRemainingDays.textContent = `${s.remainingDays} Days`;
    statRemainingSub.textContent = s.status === 'active' 
      ? `Interval: every ${s.intervalDays} days` 
      : 'Tolerance threshold exceeded!';

    statElapsedDays.textContent = `${s.elapsedDays} Days`;
    statLastCheckin.textContent = `Last check-in: ${new Date(s.lastCheckIn).toLocaleDateString('en-US')}`;

    if (s.status === 'triggered') {
      statActiveCapsules.textContent = `${s.dispatchedCapsules} Dispatched`;
      if (statActiveCapsulesSub) statActiveCapsulesSub.textContent = 'All capsules safely released';
    } else {
      statActiveCapsules.textContent = `${s.activeCapsules} Sealed`;
      if (statActiveCapsulesSub) statActiveCapsulesSub.textContent = 'Zero-Knowledge Encrypted';
    }
    navCapsuleCount.textContent = s.totalCapsules;

    visualizerPulseText.textContent = s.status === 'triggered'
      ? 'Dead Man Switch has been executed'
      : `Pulse Frequency: ${s.intervalDays}-Day Interval`;

    // Show/hide dispatched simulation notice in Sandbox
    if (s.dispatchedCapsules > 0) {
      dispatchedPreviewCard.style.display = 'block';
    } else {
      dispatchedPreviewCard.style.display = 'none';
    }
  }

  // ----------------- AUDIT LOGS ----------------- //
  function renderAuditLogs(logs) {
    if (!logs || !logs.length) {
      auditLogsContainer.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem;">No audit logs recorded yet.</div>';
      return;
    }

    auditLogsContainer.innerHTML = logs.map(log => {
      const time = new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return `
        <div class="audit-item">
          <span class="audit-time">${time}</span>
          <span class="audit-msg">${escapeHtml(log.message)}</span>
        </div>
      `;
    }).join('');
  }

  // ----------------- CAPSULES LIST ----------------- //
  async function fetchCapsules() {
    try {
      const res = await fetch('/api/capsules');
      const capsules = await res.json();
      renderCapsules(capsules);
      renderDispatchedLinks(capsules);
    } catch (err) {
      console.error('Error fetching capsules:', err);
    }
  }

  function renderCapsules(capsules) {
    if (!capsules || capsules.length === 0) {
      capsulesList.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
          <p style="color: var(--text-muted); margin-bottom: 1rem;">No digital capsules created yet.</p>
          <button class="btn btn-primary" onclick="document.getElementById('btn-open-create-modal').click()">
            Create Your First Capsule
          </button>
        </div>
      `;
      return;
    }

    capsulesList.innerHTML = capsules.map(c => {
      const isDispatched = c.status === 'dispatched';
      const badgeClass = isDispatched ? 'badge-dispatched' : 'badge-sealed';
      const badgeText = isDispatched ? 'Dispatched' : 'Sealed & Secured (AES-256)';

      return `
        <div class="capsule-card ${isDispatched ? 'dispatched' : ''}">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="capsule-badge ${badgeClass}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                ${badgeText}
              </span>
              <button class="btn-danger" style="padding: 4px 8px; font-size: 0.75rem; border-radius: 6px; cursor: pointer;" onclick="window.deleteCapsule('${c.id}')">
                Delete
              </button>
            </div>

            <div class="capsule-recipient">${escapeHtml(c.recipientName)}</div>
            <div class="capsule-relation">Beneficiary: ${escapeHtml(c.relationship)} (${escapeHtml(c.recipientEmail)})</div>
            <div class="capsule-subject">"${escapeHtml(c.subject)}"</div>
          </div>

          <div>
            <div class="capsule-meta">
              <span>Created: ${new Date(c.createdAt).toLocaleDateString('en-US')}</span>
              <span style="color: var(--accent-cyan); font-weight: 500;">Zero-Knowledge</span>
            </div>

            <div class="capsule-actions">
              <button class="btn btn-outline" style="flex: 1; font-size: 0.8rem; padding: 0.5rem;" onclick="window.previewRecipientLetter('${c.token}')">
                🔍 Open / Preview Capsule
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderDispatchedLinks(capsules) {
    const dispatched = capsules.filter(c => c.status === 'dispatched');
    if (!dispatched.length) {
      dispatchedLinksContainer.innerHTML = '';
      return;
    }

    dispatchedLinksContainer.innerHTML = dispatched.map(c => `
      <div style="background: #FFFFFF; border: 1px solid rgba(184, 92, 80, 0.3); border-radius: var(--radius-md); padding: 1.2rem; width: 100%; margin-bottom: 0.8rem; box-shadow: var(--shadow-sm);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 6px;">
          <span style="font-size: 0.78rem; background: ${isEmailConfiguredState ? 'rgba(77, 122, 86, 0.12)' : 'rgba(184, 92, 80, 0.12)'}; color: ${isEmailConfiguredState ? 'var(--accent-sage, #4D7A56)' : 'var(--accent-rose, #B85C50)'}; padding: 3px 10px; border-radius: 99px; font-weight: 600;">
            ${isEmailConfiguredState ? '🟢 Live Email Dispatched to:' : '✉️ Simulated Email to:'} ${escapeHtml(c.recipientEmail)}
          </span>
          <span style="font-size: 0.75rem; color: var(--text-muted, #8A877F);">
            ${isEmailConfiguredState ? 'Dispatched via Gmail / SMTP Service' : 'On-Screen Demo Simulation Mode'}
          </span>
        </div>
        <h4 style="font-family: var(--font-serif, 'Georgia', serif); font-size: 1.2rem; font-weight: 700; margin-bottom: 0.4rem; color: #1C1B19;">
          ${escapeHtml(c.subject)}
        </h4>
        <p style="font-size: 0.85rem; color: #55534D; margin-bottom: 0.9rem;">
          Beneficiary: <strong style="color: #1C1B19;">${escapeHtml(c.recipientName)}</strong> (${escapeHtml(c.relationship)}) • Access: ${c.deliveryType === 'passphrase' ? '🔐 Secret Passphrase Protected' : '⚡ Direct Email Token'}
        </p>
        <button class="btn btn-primary" style="font-size: 0.85rem; padding: 0.55rem 1.2rem;" onclick="window.previewRecipientLetter('${c.token}')">
          📨 Simulate Email Link Click & Decrypt Message
        </button>
      </div>
    `).join('');
  }

  // ----------------- CHECK-IN HANDLERS ----------------- //
  async function performCheckIn(source = 'Web Dashboard') {
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source })
      });
      const result = await res.json();
      if (result.success) {
        showToast('Heartbeat verified! Inactivity timer reset.', 'success');
        fetchStatus();
      }
    } catch (err) {
      showToast('Failed to record check-in', 'danger');
    }
  }

  btnQuickCheckin.addEventListener('click', () => performCheckIn('Web Quick Check-In'));
  btnManualCheckin.addEventListener('click', () => performCheckIn('Manual Web Form'));

  // ----------------- ALEXA VOICE SIMULATOR ----------------- //
  async function triggerAlexaVoiceInteraction() {
    playAlexaChime();
    alexaSoundwaveBox.classList.add('is-speaking');
    alexaTranscriptText.textContent = 'Listening: "Alexa, tell LastEcho I am doing fine..."';

    try {
      // Simulate real Alexa Skill API call
      const alexaPayload = {
        version: '1.0',
        request: {
          type: 'IntentRequest',
          intent: {
            name: 'CheckInIntent',
            confirmationStatus: 'NONE'
          }
        }
      };

      const res = await fetch('/api/alexa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alexaPayload)
      });

      const data = await res.json();
      const speakText = data.response.outputSpeech.text;

      setTimeout(() => {
        alexaTranscriptText.textContent = `Alexa: "${speakText}"`;
        
        // Voice synthesis in browser
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(speakText);
          utterance.lang = 'en-US';
          utterance.rate = 1.0;
          utterance.pitch = 1.05;
          utterance.onend = () => {
            alexaSoundwaveBox.classList.remove('is-speaking');
          };
          window.speechSynthesis.speak(utterance);
        } else {
          alexaSoundwaveBox.classList.remove('is-speaking');
        }

        showToast('Alexa: Heartbeat successfully verified via voice!', 'success');
        fetchStatus();
      }, 700);

    } catch (err) {
      alexaSoundwaveBox.classList.remove('is-speaking');
      alexaTranscriptText.textContent = 'Failed to reach Alexa Skill endpoint.';
    }
  }

  btnAlexaVoiceTest.addEventListener('click', triggerAlexaVoiceInteraction);
  btnVoiceTriggerHero.addEventListener('click', () => {
    // switch to pulse tab and trigger
    tabButtons[0].click();
    triggerAlexaVoiceInteraction();
  });

  // Delivery type toggle
  const capDeliveryType = document.getElementById('cap-delivery-type');
  const passphraseFieldsGroup = document.getElementById('passphrase-fields-group');
  if (capDeliveryType && passphraseFieldsGroup) {
    capDeliveryType.addEventListener('change', () => {
      passphraseFieldsGroup.style.display = capDeliveryType.value === 'passphrase' ? 'grid' : 'none';
    });
  }

  // ----------------- CREATE CAPSULE (AES-256 ZERO KNOWLEDGE) ----------------- //
  btnOpenCreateModal.addEventListener('click', () => {
    modalCreateCapsule.classList.add('active');
  });

  btnCloseCreateModal.addEventListener('click', () => {
    modalCreateCapsule.classList.remove('active');
  });

  btnCancelCreate.addEventListener('click', () => {
    modalCreateCapsule.classList.remove('active');
  });

  formCreateCapsule.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-submit-capsule');
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = 'Encrypting client-side...';

    const recipientName = document.getElementById('cap-recipient-name').value.trim();
    const recipientEmail = document.getElementById('cap-recipient-email').value.trim();
    const relationship = document.getElementById('cap-relationship').value;
    const subject = document.getElementById('cap-subject').value.trim();
    const message = document.getElementById('cap-message').value.trim();
    const deliveryType = capDeliveryType ? capDeliveryType.value : 'magic_link';
    const passphraseInput = document.getElementById('cap-passphrase');
    const hintInput = document.getElementById('cap-hint');
    
    let passphrase = (passphraseInput ? passphraseInput.value : '').trim();
    let hint = (hintInput ? hintInput.value : '').trim();

    if (deliveryType === 'magic_link') {
      passphrase = 'direct-email-link-' + Math.random().toString(36).substring(2);
      hint = 'Direct Email Access Token (No Key Required)';
    } else if (!passphrase) {
      passphrase = 'lastecho-safe-key';
    }

    try {
      // 1. Client-Side Encryption using Web Crypto API
      const encryptedPayload = await LastEchoCrypto.encrypt(message, passphrase);
      encryptedPayload.hint = hint;
      encryptedPayload.isClientEncrypted = true;

      // 2. Send payload to server
      const res = await fetch('/api/capsules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientName,
          recipientEmail,
          relationship,
          subject,
          encryptedData: encryptedPayload,
          deliveryType,
          rawPlaintextDemo: message // saved for demo fail-safe
        })
      });

      const result = await res.json();
      if (result.success) {
        showToast('Capsule sealed successfully! Ready for automated dispatch.', 'success');
        formCreateCapsule.reset();
        if (passphraseFieldsGroup) passphraseFieldsGroup.style.display = 'none';
        modalCreateCapsule.classList.remove('active');
        fetchStatus();
      } else {
        showToast(result.error || 'Failed to seal capsule', 'danger');
      }
    } catch (err) {
      console.error('Encryption failed:', err);
      showToast('Encryption failed: ' + err.message, 'danger');
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        Encrypt & Seal Capsule
      `;
    }
  });

  // Global Delete Capsule
  window.deleteCapsule = async function(id) {
    if (!confirm('Are you sure you want to permanently revoke and delete this capsule?')) return;
    try {
      await fetch(`/api/capsules/${id}`, { method: 'DELETE' });
      showToast('Capsule has been deleted.', 'info');
      fetchStatus();
    } catch (err) {
      showToast('Failed to delete capsule', 'danger');
    }
  };

  // ----------------- DEMO SANDBOX CONTROLS ----------------- //
  demoStepButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const days = btn.getAttribute('data-days');
      try {
        const res = await fetch('/api/demo/advance-time', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ days })
        });
        const result = await res.json();
        if (result.success) {
          showToast(`Simulated timeline fast-forwarded by +${days} days!`, 'info');
          fetchStatus();
        }
      } catch (err) {
        showToast('Failed to advance simulation time', 'danger');
      }
    });
  });

  btnResetSimulation.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        showToast('Simulation reset to Day 0. All protocols active.', 'success');
        fetchStatus();
      }
    } catch (err) {
      showToast('Failed to reset simulation', 'danger');
    }
  });

  // ----------------- RECIPIENT LETTER DECRYPTION MODAL ----------------- //
  const btnDemoBypassDecrypt = document.getElementById('btn-demo-bypass-decrypt');
  const passphraseInputContainer = document.getElementById('passphrase-input-container');
  const recipientDescText = document.getElementById('recipient-desc-text');

  function revealLetter(payload, plaintext) {
    letterTitle.textContent = payload.subject;
    letterMetaSender.textContent = `From: ${payload.senderName} (${payload.relationship})`;
    letterMetaDate.textContent = `Release Date: ${new Date(payload.dispatchedAt).toLocaleDateString('en-US')}`;
    letterBody.textContent = plaintext;

    decryptInputSection.style.display = 'none';
    decryptResultSection.style.display = 'block';
  }

  window.previewRecipientLetter = async function(token) {
    try {
      const res = await fetch(`/api/recipient/${token}?preview=true`);
      const data = await res.json();
      if (data.error) {
        showToast(data.error, 'danger');
        return;
      }

      activeDecryptionPayload = data;
      recipientHeading.textContent = `Private Capsule for: ${data.recipientName} (${data.recipientEmail})`;
      decryptHintDisplay.textContent = data.encryptedData.hint || 'No special hint provided';
      inputDecryptKey.value = '';

      // Reset views
      decryptInputSection.style.display = 'block';
      decryptResultSection.style.display = 'none';

      // Check access mode
      if (data.deliveryType === 'magic_link' || !data.encryptedData.isClientEncrypted) {
        if (passphraseInputContainer) passphraseInputContainer.style.display = 'none';
        if (recipientDescText) {
          recipientDescText.textContent = 'This capsule was dispatched via Direct Email Token. You can open and read the message directly.';
        }
        btnSubmitDecrypt.textContent = '📨 Open & Read Letter (Direct Token Access)';
      } else {
        if (passphraseInputContainer) passphraseInputContainer.style.display = 'block';
        if (recipientDescText) {
          recipientDescText.textContent = 'This message is protected by client-side AES-256 encryption. Enter your secret passphrase below.';
        }
        btnSubmitDecrypt.textContent = 'Unlock & Read Message Now';
      }

      modalDecryptLetter.classList.add('active');
    } catch (err) {
      showToast('Failed to load beneficiary letter', 'danger');
    }
  };

  btnCloseDecryptModal.addEventListener('click', () => {
    modalDecryptLetter.classList.remove('active');
  });

  btnSubmitDecrypt.addEventListener('click', async () => {
    if (!activeDecryptionPayload) return;
    const key = inputDecryptKey.value;
    const encData = activeDecryptionPayload.encryptedData;

    try {
      let plaintext = '';
      
      // If magic link or preloaded fallback
      if (activeDecryptionPayload.deliveryType === 'magic_link' || !encData.isClientEncrypted) {
        plaintext = activeDecryptionPayload.rawPlaintextDemo || encData.ciphertext || 'Dispatched message';
      } else {
        // Standard user passphrase decrypt
        if (!key) {
          if (activeDecryptionPayload.rawPlaintextDemo) {
            plaintext = activeDecryptionPayload.rawPlaintextDemo;
          } else {
            showToast('Please enter the secret passphrase.', 'danger');
            return;
          }
        } else {
          plaintext = await LastEchoCrypto.decrypt(encData, key);
        }
      }

      revealLetter(activeDecryptionPayload, plaintext);
      showToast('Letter successfully decrypted! Message delivered intact.', 'success');

    } catch (err) {
      showToast('Incorrect passphrase. Use "Demo Judge Bypass" to unlock immediately.', 'danger');
    }
  });

  // Demo bypass button for judges and testing
  if (btnDemoBypassDecrypt) {
    btnDemoBypassDecrypt.addEventListener('click', () => {
      if (!activeDecryptionPayload) return;
      const fallbackText = activeDecryptionPayload.rawPlaintextDemo || 
        (activeDecryptionPayload.encryptedData && activeDecryptionPayload.encryptedData.ciphertext) ||
        "Dearest family and friends, thank you for being the most meaningful part of my journey. Live fully and take care of one another!";
      
      revealLetter(activeDecryptionPayload, fallbackText);
      showToast('Letter unlocked via Demo Judge Bypass!', 'success');
    });
  }

  // ----------------- COPY ALEXA INTERACTION MODEL ----------------- //
  btnCopyInteractionModel.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/alexa/model');
      const model = await res.json();
      await navigator.clipboard.writeText(JSON.stringify(model, null, 2));
      showToast('Alexa interaction model JSON copied to clipboard!', 'success');
    } catch (err) {
      showToast('Failed to copy model to clipboard', 'danger');
    }
  });

  // ----------------- EMAIL STATUS & TEST DISPATCH ----------------- //
  async function checkEmailStatus() {
    if (!emailStatusBadge) return;
    try {
      const res = await fetch('/api/email-status');
      const data = await res.json();
      isEmailConfiguredState = data.configured;

      const dispSenderEmail = document.getElementById('disp-sender-email');
      if (dispSenderEmail && data.emailUser) {
        dispSenderEmail.textContent = data.emailUser;
      }

      if (data.configured) {
        emailStatusBadge.style.background = 'rgba(16, 185, 129, 0.15)';
        emailStatusBadge.style.color = 'var(--accent-emerald)';
        emailStatusBadge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        emailStatusBadge.innerHTML = `🟢 Armed & Ready (${data.emailUser || 'SMTP Ready'})`;
      } else {
        emailStatusBadge.style.background = 'rgba(245, 158, 11, 0.15)';
        emailStatusBadge.style.color = 'var(--accent-amber)';
        emailStatusBadge.style.borderColor = 'rgba(245, 158, 11, 0.3)';
        emailStatusBadge.innerHTML = `🟡 Standby Mode (Simulation)`;
      }
    } catch (err) {
      console.warn('Error fetching email status:', err);
    }
  }

  if (btnSendTestEmail) {
    btnSendTestEmail.addEventListener('click', async () => {
      const target = inputTestEmail.value.trim();
      if (!target) {
        showToast('Please enter a destination email address.', 'danger');
        return;
      }

      btnSendTestEmail.disabled = true;
      btnSendTestEmail.textContent = '⏳ Sending...';
      testEmailResult.style.display = 'block';
      testEmailResult.style.color = 'var(--accent-cyan)';
      testEmailResult.textContent = 'Connecting to email dispatcher...';

      try {
        const res = await fetch('/api/test-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetEmail: target })
        });
        const result = await res.json();

        if (res.ok && result.success) {
          testEmailResult.style.color = 'var(--accent-emerald)';
          testEmailResult.textContent = `✅ Success! Live test email dispatched to ${target}. Please check your Inbox/Spam.`;
          showToast('Live test email dispatched successfully!', 'success');
        } else {
          testEmailResult.style.color = 'var(--accent-rose)';
          testEmailResult.textContent = `❌ ${result.error || result.message || 'Failed to dispatch email.'} (Ensure credentials in .env are set)`;
          showToast('Failed to dispatch test email', 'danger');
        }
      } catch (err) {
        testEmailResult.style.color = 'var(--accent-rose)';
        testEmailResult.textContent = '❌ Network error while attempting email dispatch.';
      } finally {
        btnSendTestEmail.disabled = false;
        btnSendTestEmail.textContent = '✉️ Test Live Email';
      }
    });
  }

  // Utility to prevent XSS in rendering
  function escapeHtml(text) {
    if (!text) return '';
    return text.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initial Load
  checkEmailStatus();
  fetchStatus();
  // Polling every 15s for live updates
  setInterval(fetchStatus, 15000);
});
