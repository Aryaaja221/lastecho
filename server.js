require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { isEmailConfigured, sendCapsuleEmail, sendTestEmail } = require('./mailer');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'data.json');

// Initial default state
const defaultState = {
  user: {
    name: 'Arya',
    email: 'arya@example.com',
    heartbeatIntervalDays: 30,
    warningGraceDays: 7, // days in grace period after interval before dispatches trigger
    lastCheckIn: new Date().toISOString(),
    virtualDaysAdded: 0, // for demo fast-forwarding
  },
  capsules: [],
  auditLogs: [
    {
      id: 'log-init',
      timestamp: new Date().toISOString(),
      type: 'system',
      message: 'LastEcho Digital Closure Protocol initialized and secured.'
    }
  ]
};

// Helper to load data
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error loading data file:', err);
  }
  saveData(defaultState);
  return defaultState;
}

// Helper to save data
function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving data file:', err);
  }
}

// Calculate system status based on simulated time
function calculateSystemStatus(state) {
  const lastCheckInTime = new Date(state.user.lastCheckIn).getTime();
  const simulatedVirtualMillis = state.user.virtualDaysAdded * 24 * 60 * 60 * 1000;
  const simulatedCurrentTime = Date.now() + simulatedVirtualMillis;
  
  const elapsedMillis = simulatedCurrentTime - lastCheckInTime;
  const elapsedDays = Math.max(0, elapsedMillis / (24 * 60 * 60 * 1000));
  
  const interval = state.user.heartbeatIntervalDays;
  const grace = state.user.warningGraceDays;
  const remainingDays = Math.max(0, interval - elapsedDays);

  let status = 'active'; // 'active' | 'grace_period' | 'triggered'
  if (elapsedDays > interval + grace) {
    status = 'triggered';
  } else if (elapsedDays > interval) {
    status = 'grace_period';
  }

  // Auto dispatch capsules if triggered
  let newlyDispatched = false;
  if (status === 'triggered') {
    state.capsules.forEach(cap => {
      if (cap.status === 'sealed') {
        cap.status = 'dispatched';
        cap.dispatchedAt = new Date(simulatedCurrentTime).toISOString();
        newlyDispatched = true;
        
        const emailMode = isEmailConfigured() ? 'Real Email Dispatched via SMTP/Gmail' : 'Dispatched (Simulated Preview)';
        state.auditLogs.unshift({
          id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          timestamp: new Date(simulatedCurrentTime).toISOString(),
          type: 'dispatch',
          message: `Heartbeat expired (${elapsedDays.toFixed(1)} days inactive). Dispatched digital capsule to ${cap.recipientName} (${cap.recipientEmail}). [${emailMode}]`
        });

        // Trigger real email dispatch in background
        sendCapsuleEmail({
          recipientName: cap.recipientName,
          recipientEmail: cap.recipientEmail,
          senderName: state.user.name,
          subject: cap.subject,
          deliveryType: cap.deliveryType,
          token: cap.token,
          baseUrl: process.env.APP_URL || `http://localhost:${PORT}`
        }).then(result => {
          if (result.success) {
            console.log(`[LastEcho Mailer] Email sent successfully to ${cap.recipientEmail}`);
          }
        }).catch(err => {
          console.error(`[LastEcho Mailer] Failed to send email to ${cap.recipientEmail}:`, err);
        });
      }
    });
    if (newlyDispatched) {
      saveData(state);
    }
  }

  return {
    status,
    elapsedDays: parseFloat(elapsedDays.toFixed(1)),
    remainingDays: parseFloat(remainingDays.toFixed(1)),
    intervalDays: interval,
    graceDays: grace,
    simulatedCurrentDate: new Date(simulatedCurrentTime).toISOString(),
    virtualDaysAdded: state.user.virtualDaysAdded,
    lastCheckIn: state.user.lastCheckIn,
    totalCapsules: state.capsules.length,
    activeCapsules: state.capsules.filter(c => c.status === 'sealed').length,
    dispatchedCapsules: state.capsules.filter(c => c.status === 'dispatched').length
  };
}

// ----------------- API ROUTES ----------------- //

// 1. Get system status
app.get('/api/status', (req, res) => {
  const state = loadData();
  const statusInfo = calculateSystemStatus(state);
  res.json({
    user: state.user,
    statusInfo,
    logs: state.auditLogs.slice(0, 10)
  });
});

// 2. Perform check-in (Heartbeat pulse)
app.post('/api/checkin', (req, res) => {
  const { source = 'Web Dashboard' } = req.body;
  const state = loadData();

  // Reset check-in to current simulated moment
  const simulatedVirtualMillis = state.user.virtualDaysAdded * 24 * 60 * 60 * 1000;
  const simulatedCurrentTime = Date.now() + simulatedVirtualMillis;
  state.user.lastCheckIn = new Date(simulatedCurrentTime).toISOString();

  // Reset capsules if they were in grace period (if not yet permanently dispatched, or re-seal for testing)
  state.auditLogs.unshift({
    id: 'log-' + Date.now(),
    timestamp: new Date(simulatedCurrentTime).toISOString(),
    type: 'pulse',
    message: `Heartbeat verified via ${source}. Protocol timer reset.`
  });

  saveData(state);
  const statusInfo = calculateSystemStatus(state);
  res.json({ success: true, message: 'Pulse confirmed! Dead man timer reset.', statusInfo });
});

// 3. Capsules CRUD
app.get('/api/capsules', (req, res) => {
  const state = loadData();
  res.json(state.capsules);
});

app.post('/api/capsules', (req, res) => {
  const { recipientName, recipientEmail, relationship, subject, encryptedData, deliveryType = 'magic_link', rawPlaintextDemo } = req.body;
  
  if (!recipientName || !recipientEmail || !subject || !encryptedData) {
    return res.status(400).json({ error: 'Data kapsul belum lengkap.' });
  }

  const state = loadData();
  const token = crypto.randomBytes(16).toString('hex');
  const simulatedVirtualMillis = state.user.virtualDaysAdded * 24 * 60 * 60 * 1000;

  const newCapsule = {
    id: 'cap-' + Date.now(),
    recipientName,
    recipientEmail,
    relationship: relationship || 'Kerabat',
    subject,
    encryptedData,
    deliveryType, // 'magic_link' (auto open) or 'passphrase'
    rawPlaintextDemo: rawPlaintextDemo || null, // saved for demo fail-safe
    status: 'sealed',
    token,
    createdAt: new Date(Date.now() + simulatedVirtualMillis).toISOString(),
    dispatchedAt: null
  };

  state.capsules.push(newCapsule);
  state.auditLogs.unshift({
    id: 'log-' + Date.now(),
    timestamp: new Date().toISOString(),
    type: 'capsule_created',
    message: `New capsule created for ${recipientName} (${relationship}). Mode: ${deliveryType === 'magic_link' ? 'Email Direct Access' : 'Encrypted with Key'}.`
  });

  saveData(state);
  res.json({ success: true, capsule: newCapsule });
});

app.delete('/api/capsules/:id', (req, res) => {
  const { id } = req.params;
  const state = loadData();
  const idx = state.capsules.findIndex(c => c.id === id);
  if (idx === -1) {
    return res.status(400).json({ error: 'Capsule not found' });
  }
  const deleted = state.capsules.splice(idx, 1)[0];
  state.auditLogs.unshift({
    id: 'log-' + Date.now(),
    timestamp: new Date().toISOString(),
    type: 'capsule_deleted',
    message: `Capsule for ${deleted.recipientName} was permanently revoked.`
  });
  saveData(state);
  res.json({ success: true });
});

// 4. Time Travel / Simulation (For Live Demo to Judges)
app.post('/api/demo/advance-time', (req, res) => {
  const { days = 1 } = req.body;
  const state = loadData();
  state.user.virtualDaysAdded += Number(days);
  
  state.auditLogs.unshift({
    id: 'log-' + Date.now(),
    timestamp: new Date().toISOString(),
    type: 'simulation',
    message: `[DEMO SIMULATOR] Fast-forwarded time by +${days} days. Total virtual days: ${state.user.virtualDaysAdded}`
  });

  saveData(state);
  const statusInfo = calculateSystemStatus(state);
  res.json({ success: true, statusInfo, state });
});

app.post('/api/demo/reset', (req, res) => {
  const state = defaultState;
  state.user.lastCheckIn = new Date().toISOString();
  state.user.virtualDaysAdded = 0;
  saveData(state);
  const statusInfo = calculateSystemStatus(state);
  res.json({ success: true, statusInfo, message: 'Simulation reset to Day 0.' });
});

// 4b. Email Service Status & Test Endpoints
app.get('/api/email-status', (req, res) => {
  const configured = isEmailConfigured();
  const rawEmail = process.env.EMAIL_USER || '';
  const maskedEmail = rawEmail ? rawEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3') : null;
  res.json({
    configured,
    emailUser: maskedEmail,
    appUrl: process.env.APP_URL || `http://localhost:${PORT}`
  });
});

app.post('/api/test-email', async (req, res) => {
  const { targetEmail } = req.body;
  if (!targetEmail) {
    return res.status(400).json({ error: 'targetEmail diperlukan.' });
  }

  const result = await sendTestEmail(targetEmail);
  if (!result.success) {
    return res.status(500).json(result);
  }
  return res.json(result);
});

// 5. Recipient Capsule View (Public decrypt page accessed by token)
app.get('/api/recipient/:token', (req, res) => {
  const { token } = req.params;
  const state = loadData();
  const capsule = state.capsules.find(c => c.token === token);
  
  if (!capsule) {
    return res.status(404).json({ error: 'Digital capsule not found or link has expired.' });
  }

  // Check if system is triggered or if opened in demo preview mode
  const statusInfo = calculateSystemStatus(state);
  const isPreview = req.query.preview === 'true';

  if (capsule.status !== 'dispatched' && !isPreview) {
    return res.status(403).json({
      error: 'This capsule remains sealed by the LastEcho Protocol. The owner is active under routine monitoring.'
    });
  }

  res.json({
    id: capsule.id,
    recipientName: capsule.recipientName,
    recipientEmail: capsule.recipientEmail,
    senderName: state.user.name,
    senderEmail: state.user.email,
    subject: capsule.subject,
    relationship: capsule.relationship,
    encryptedData: capsule.encryptedData,
    deliveryType: capsule.deliveryType || 'passphrase',
    rawPlaintextDemo: capsule.rawPlaintextDemo || null,
    status: capsule.status,
    dispatchedAt: capsule.dispatchedAt || new Date().toISOString(),
    token: capsule.token,
    isPreview
  });
});

// 6. ALEXA SKILL ENDPOINT (Official Amazon Alexa Skill Request Handler)
app.post('/api/alexa', (req, res) => {
  const alexaRequest = req.body;
  const requestType = alexaRequest?.request?.type || 'LaunchRequest';
  const intentName = alexaRequest?.request?.intent?.name;

  const state = loadData();
  let speakOutput = '';
  let reprompt = 'Ada yang bisa saya bantu lagi untuk LastEcho Anda?';
  let shouldEndSession = true;

  if (requestType === 'LaunchRequest') {
    speakOutput = `Hello ${state.user.name}, welcome to LastEcho. Your vitality monitoring protocol is currently active. You can say: "I am doing fine", or ask: "What is my LastEcho status?"`;
    reprompt = 'Say: "I am doing fine" to refresh your digital heartbeat.';
    shouldEndSession = false;
  } else if (requestType === 'IntentRequest') {
    if (intentName === 'CheckInIntent' || intentName === 'IAmOkayIntent') {
      // Execute check-in
      const simulatedVirtualMillis = state.user.virtualDaysAdded * 24 * 60 * 60 * 1000;
      const simulatedCurrentTime = Date.now() + simulatedVirtualMillis;
      state.user.lastCheckIn = new Date(simulatedCurrentTime).toISOString();

      state.auditLogs.unshift({
        id: 'log-alexa-' + Date.now(),
        timestamp: new Date(simulatedCurrentTime).toISOString(),
        type: 'alexa_pulse',
        message: `Heartbeat verified via Amazon Alexa Voice ("CheckInIntent").`
      });
      saveData(state);

      const statusInfo = calculateSystemStatus(state);
      speakOutput = `Glad to hear that, ${state.user.name}. Your digital heartbeat has been refreshed in LastEcho. All ${statusInfo.activeCapsules} of your sealed capsules remain securely protected. Stay safe and well!`;
      shouldEndSession = true;
    } else if (intentName === 'StatusIntent') {
      const statusInfo = calculateSystemStatus(state);
      speakOutput = `Your LastEcho status: ${statusInfo.status === 'active' ? 'Active and Protected' : 'Requires Attention'}. Last heartbeat recorded ${statusInfo.elapsedDays} days ago. You have ${statusInfo.activeCapsules} sealed digital capsules under protocol protection.`;
      shouldEndSession = true;
    } else if (intentName === 'AMAZON.HelpIntent') {
      speakOutput = 'LastEcho is your digital legacy guardian. Simply say: "I am doing fine" periodically whenever you talk to me, and the system resets your check-in schedule.';
      reprompt = 'Say "I am doing fine" to try.';
      shouldEndSession = false;
    } else if (intentName === 'AMAZON.CancelIntent' || intentName === 'AMAZON.StopIntent') {
      speakOutput = 'Goodbye, take care of yourself.';
      shouldEndSession = true;
    } else {
      speakOutput = 'Sorry, I did not catch that command. You can say "I am doing fine" to refresh your LastEcho heartbeat.';
      shouldEndSession = false;
    }
  } else if (requestType === 'SessionEndedRequest') {
    return res.json({});
  }

  // Alexa JSON Response format standard
  return res.json({
    version: '1.0',
    response: {
      outputSpeech: {
        type: 'PlainText',
        text: speakOutput
      },
      reprompt: shouldEndSession ? undefined : {
        outputSpeech: {
          type: 'PlainText',
          text: reprompt
        }
      },
      shouldEndSession: shouldEndSession
    }
  });
});

// 7. Alexa Skill Model Export (For easy copy-paste to developer.amazon.com)
app.get('/api/alexa/model', (req, res) => {
  const interactionModel = {
    interactionModel: {
      languageModel: {
        invocationName: 'last echo',
        intents: [
          {
            name: 'CheckInIntent',
            samples: [
              'i am okay',
              'i am doing fine',
              'i am alive',
              'check in',
              'confirm my pulse',
              'saya baik baik saja',
              'cek in',
              'saya sehat'
            ]
          },
          {
            name: 'StatusIntent',
            samples: [
              'what is my status',
              'how is my pulse',
              'check my dead man switch',
              'status protokol',
              'cek status last echo'
            ]
          },
          {
            name: 'AMAZON.CancelIntent',
            samples: []
          },
          {
            name: 'AMAZON.HelpIntent',
            samples: []
          },
          {
            name: 'AMAZON.StopIntent',
            samples: []
          }
        ],
        types: []
      }
    }
  };
  res.json(interactionModel);
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  LastEcho Protocol Engine running on port ${PORT}`);
  console.log(`  URL: http://localhost:${PORT}`);
  console.log(`  Alexa Endpoint: http://localhost:${PORT}/api/alexa`);
  console.log(`===============================================`);
});
