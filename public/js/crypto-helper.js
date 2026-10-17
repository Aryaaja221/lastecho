/**
 * LastEcho Client-Side Encryption Helper
 * Uses Web Crypto API (SubtleCrypto)
 * - AES-GCM 256-bit for data encryption
 * - PBKDF2 with SHA-256 (100,000 iterations) for key derivation from passphrase
 * - Server NEVER sees the raw plaintext or the encryption key (Zero-Knowledge Architecture)
 */

class LastEchoCrypto {
  /**
   * Derive AES key from user passphrase and salt
   */
  static async deriveKey(passphrase, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt message with a passphrase
   * Returns: { ciphertext, iv, salt } encoded in Base64
   */
  static async encrypt(plainText, passphrase) {
    const enc = new TextEncoder();
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await this.deriveKey(passphrase, salt);

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      enc.encode(plainText)
    );

    // Convert buffers to base64 for safe JSON storage
    return {
      ciphertext: this.buf2b64(encryptedBuffer),
      iv: this.buf2b64(iv),
      salt: this.buf2b64(salt),
      algorithm: 'AES-GCM-256-PBKDF2'
    };
  }

  /**
   * Decrypt ciphertext using passphrase, iv, salt
   */
  static async decrypt(encryptedPayload, passphrase) {
    try {
      const dec = new TextDecoder();
      const salt = this.b642buf(encryptedPayload.salt);
      const iv = this.b642buf(encryptedPayload.iv);
      const ciphertext = this.b642buf(encryptedPayload.ciphertext);

      const key = await this.deriveKey(passphrase, salt);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        ciphertext
      );

      return dec.decode(decryptedBuffer);
    } catch (err) {
      throw new Error('Gagal mendekripsi: Kunci sandi atau passphrase salah.');
    }
  }

  // Utilities for Base64 conversion
  static buf2b64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  static b642buf(base64) {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

window.LastEchoCrypto = LastEchoCrypto;
