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
 * 解密响应体并返回 JSON 对象。
 * Decrypt the response body and return the parsed JSON object.
 *
 * @param {Uint8Array|ArrayBuffer|string} body - 原始响应体 / Raw response body.
 * @param {boolean} isAeapi - 是否为 aeapi 格式（需额外 gzip 解压）/ Whether the body is aeapi format (requires extra gzip inflate).
 * @returns {object|null} 解析成功返回对象，失败返回 null / Parsed object on success, null on failure.
 */
export function decryptBody(body, isAeapi) {
  try {
    let u8;
    if (body instanceof Uint8Array) u8 = body;
    else if (body instanceof ArrayBuffer) u8 = new Uint8Array(body);
    else if (typeof body === "string") {
      u8 = new Uint8Array(body.length);
      for (let i = 0; i < body.length; i++) u8[i] = body.charCodeAt(i) & 0xff;
    } else {
      return null;
    }

    const decrypted = CryptoJS.AES.decrypt(
      CryptoJS.lib.CipherParams.create({ ciphertext: u8ToWA(u8) }),
      KEY,
      CFG
    );

    if (isAeapi) {
      const bytes = waToU8(decrypted);
      const json = new TextDecoder("utf-8").decode(pako.ungzip(bytes));
      return JSON.parse(json);
    }
    return JSON.parse(CryptoJS.enc.Utf8.stringify(decrypted));
  } catch {
    return null;
  }
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
