# LastEcho

A zero-knowledge dead man's switch and digital closure protocol powered by Amazon Alexa voice check-ins.

LastEcho monitors a digital heartbeat interval. Users reset their timer naturally through daily Alexa voice interactions. If a user becomes inactive past their designated interval and grace period, the system dispatches pre-encrypted digital capsules to their designated recipients via email.

---

## Architecture Overview

- **Voice Interface**: Amazon Alexa Custom Skill with conversational check-in intents (`CheckInIntent`, `IAmOkayIntent`).
- **Client-Side Cryptography**: In-browser **AES-GCM 256-bit** encryption via the native Web Crypto API. Private messages are encrypted on the client before reaching the server.
- **Backend Service**: Node.js and Express handling protocol state transitions, heartbeat intervals, and audit logs.
- **Automated Dispatcher**: Nodemailer integration delivering secure notification links to recipient Gmail/SMTP inboxes upon switch trigger.
- **Demo Sandbox**: Built-in timeline simulator to test state transitions (+7, +14, +31, +40 days) without waiting in real-time.

---

## Quick Start

### Prerequisites
- Node.js (v18+)
- npm

### Installation
1. Clone the repository and enter the directory:
   ```bash
   git clone <your-repo-url>
   cd lastecho
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. (Optional) Set up email credentials for real Gmail dispatch:
   ```bash
   cp .env.example .env
   ```
   Add your Gmail address and 16-character App Password to `.env`. If skipped, LastEcho runs in local UI simulation mode automatically.
4. Start the server:
   ```bash
   npm start
   ```
5. Open your browser at `http://localhost:5000`.

---

## Alexa Skill Setup

To link LastEcho to your Amazon Alexa Developer account:

1. Log in to the [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask).
2. Create a new skill named `LastEcho` (Custom model, Alexa-hosted Node.js).
3. In **Build > Interaction Model > JSON Editor**, paste the contents of `interaction-model.json` and click **Build Model**.
4. In the **Code** tab, replace `index.js` with `alexa-skill-lambda.js` and click **Deploy**.
5. In the **Test** tab, enable testing in **Development** mode and test with phrases like:
   - *"Alexa, tell LastEcho I am doing fine"*
   - *"Alexa, open Last Echo"*

---

## Tech Stack

- **Runtime**: Node.js, Express.js
- **Voice**: Alexa Skills Kit (ASK SDK), AWS Lambda
- **Security**: Web Crypto API (AES-GCM-256, PBKDF2)
- **Delivery**: Nodemailer (SMTP / Gmail)
- **Frontend**: HTML5, Vanilla CSS, JavaScript (ES6+)

---

## Author & Copyright

Created by **Arya** for the Amazon Alexa Hackathon.  
Copyright © 2026 Arya. All rights reserved.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
