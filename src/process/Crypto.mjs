/**
 * 响应体加解密工具。
 * Response body encryption and decryption helpers.
 *
 * 模式 / Mode:
 * - 默认：AES-128-ECB(json_utf8)
 * - 优化模式：AES-128-ECB(gzip(json_utf8))，由请求头 `x-aeapi: true` 触发
 * - Default: AES-128-ECB(json_utf8)
 * - Optimized: AES-128-ECB(gzip(json_utf8)), enabled by `x-aeapi: true` header
 */
import CryptoJS from "crypto-js";
import pako from "pako";

const KEY = CryptoJS.enc.Utf8.parse("e82ckenh8dichen8");
const CFG = { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 };

/**
 * 将 Uint8Array 转换为 CryptoJS WordArray。
 * Convert a Uint8Array to a CryptoJS WordArray.
 *
 * @param {Uint8Array} u8 - 原始字节 / Raw bytes.
 * @returns {CryptoJS.lib.WordArray}
 */
function u8ToWA(u8) {
  const words = [];
  for (let i = 0; i < u8.length; i++) {
    words[i >>> 2] |= (u8[i] & 0xff) << (24 - (i % 4) * 8);
  }
  return CryptoJS.lib.WordArray.create(words, u8.length);
}

/**
 * 将 CryptoJS WordArray 转换为 Uint8Array。
 * Convert a CryptoJS WordArray to a Uint8Array.
 *
 * @param {CryptoJS.lib.WordArray} wa
 * @returns {Uint8Array}
 */
function waToU8(wa) {
  const u8 = new Uint8Array(wa.sigBytes);
  for (let i = 0; i < wa.sigBytes; i++) {
    u8[i] = (wa.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }
  return u8;
}

/**
 * gzip magic header 检测。
 * Detect gzip magic header.
 *
 * @param {Uint8Array} u8
 * @returns {boolean}
 */
function isGzipped(u8) {
  return u8.length >= 2 && u8[0] === 0x1f && u8[1] === 0x8b;
}

/**
 * 解密响应体并返回 JSON 对象。多策略 fallback。
 * Decrypt the response body and return parsed JSON, using a multi-strategy fallback.
 *
 * 步骤 / Steps:
 * 1. 归一化为 Uint8Array / Normalize to Uint8Array.
 * 2. 若开头是 gzip magic → 先解 HTTP 层 gzip（QX 不剥的情况）/
 *    Peel HTTP-level gzip if present (QX may not strip it).
 * 3. AES-128-ECB 解密 → 内层若是 gzip 则再解一次 → JSON / AES decrypt → optional inner gzip → JSON.
 * 4. 兜底：把原始字节当作明文 JSON / Fallback: try parsing the raw bytes as plain JSON.
 *
 * @param {Uint8Array|ArrayBuffer|string} body
 * @param {boolean} [_isAeapi] 旧参数，已忽略 / Legacy flag, ignored.
 * @returns {object|null}
 */
export function decryptBody(body, _isAeapi) {
  // 归一化为 Uint8Array
  // Normalize to Uint8Array
  let u8;
  if (body instanceof Uint8Array) u8 = body;
  else if (body instanceof ArrayBuffer) u8 = new Uint8Array(body);
  else if (typeof body === "string") {
    u8 = new Uint8Array(body.length);
    for (let i = 0; i < body.length; i++) u8[i] = body.charCodeAt(i) & 0xff;
  } else {
    return null;
  }
  if (!u8.length) return null;

  // 部分 QX 场景下 HTTP 层的 gzip 不会被自动剥离，提前解一层。
  // QX may leave HTTP-level gzip on the body; peel it first if present.
  if (isGzipped(u8)) {
    try {
      u8 = pako.ungzip(u8);
    } catch {
      /* 保留原始字节，下一步可能仍可解 */
    }
  }

  // 策略 1：AES 解密 → 可选内层 gzip → JSON
  // Strategy 1: AES decrypt → optional inner gzip → JSON
  try {
    const decrypted = CryptoJS.AES.decrypt(
      CryptoJS.lib.CipherParams.create({ ciphertext: u8ToWA(u8) }),
      KEY,
      CFG
    );
    const bytes = waToU8(decrypted);
    if (bytes.length > 0) {
      const json = isGzipped(bytes)
        ? new TextDecoder("utf-8").decode(pako.ungzip(bytes))
        : new TextDecoder("utf-8").decode(bytes);
      const obj = JSON.parse(json);
      if (obj && typeof obj === "object") return obj;
    }
  } catch {
    /* fall through */
  }

  // 策略 2：原始字节直接当 UTF-8 JSON（罕见的明文响应）。
  // Strategy 2: parse raw bytes as plain UTF-8 JSON (rare unencrypted responses).
  try {
    const json = new TextDecoder("utf-8").decode(u8);
    const obj = JSON.parse(json);
    if (obj && typeof obj === "object") return obj;
  } catch {
    /* fall through */
  }

  return null;
}

/**
 * 将 JSON 对象加密为 Uint8Array 响应体。
 * Encrypt a JSON object into a Uint8Array response body.
 *
 * @param {object} obj - 待加密对象 / Object to encrypt.
 * @returns {Uint8Array}
 */
export function encryptBody(obj) {
  const plaintext = JSON.stringify(obj);
  const encrypted = CryptoJS.AES.encrypt(plaintext, KEY, CFG);
  return waToU8(encrypted.ciphertext);
}
