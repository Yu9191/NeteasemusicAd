/**
 * 网易云音乐 eapi 响应体加解密。AES-128-ECB(Pkcs7) + 可选 gzip。
 */
import { Console } from "@nsnanocat/util";
import CryptoJS from "crypto-js";
import pako from "pako";

const KEY = CryptoJS.enc.Utf8.parse("e82ckenh8dichen8");
const CFG = { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 };

function u8ToWA(u8) {
  const words = [];
  for (let i = 0; i < u8.length; i++) {
    words[i >>> 2] |= (u8[i] & 0xff) << (24 - (i % 4) * 8);
  }
  return CryptoJS.lib.WordArray.create(words, u8.length);
}

function waToU8(wa) {
  const u8 = new Uint8Array(wa.sigBytes);
  for (let i = 0; i < wa.sigBytes; i++) {
    u8[i] = (wa.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }
  return u8;
}

function isGzipped(u8) {
  return u8.length >= 2 && u8[0] === 0x1f && u8[1] === 0x8b;
}

function hexHead(u8, n = 16) {
  const len = Math.min(u8.length, n);
  let s = "";
  for (let i = 0; i < len; i++) {
    s += u8[i].toString(16).padStart(2, "0");
    if (i < len - 1) s += " ";
  }
  return s;
}

/**
 * 解密响应体为 JSON。多策略 fallback：HTTP gzip 剥离 → AES → 内层 gzip → JSON；失败时按明文 JSON 兜底。
 */
export function decryptBody(body) {
  let u8;
  let bodyKind;
  if (body instanceof Uint8Array) {
    u8 = body;
    bodyKind = "Uint8Array";
  } else if (body instanceof ArrayBuffer) {
    u8 = new Uint8Array(body);
    bodyKind = "ArrayBuffer";
  } else if (typeof body === "string") {
    u8 = new Uint8Array(body.length);
    for (let i = 0; i < body.length; i++) u8[i] = body.charCodeAt(i) & 0xff;
    bodyKind = "string";
  } else {
    Console.error(`[WYY/Crypto] body 类型未知: ${typeof body}`);
    return null;
  }
  if (!u8.length) {
    Console.error("[WYY/Crypto] body 为空");
    return null;
  }

  const errors = [];
  const originalHead = hexHead(u8);

  // QX 不会自动剥 HTTP 层 gzip
  let httpUngzipped = false;
  if (isGzipped(u8)) {
    try {
      u8 = pako.ungzip(u8);
      httpUngzipped = true;
    } catch (e) {
      errors.push(`http-ungzip: ${e?.message || e}`);
    }
  }

  // 策略 1: AES → 内层 gzip → JSON
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
      errors.push("aes: 解出非对象");
    } else {
      errors.push("aes: 解出空字节");
    }
  } catch (e) {
    errors.push(`aes: ${e?.message || e}`);
  }

  // 策略 2: 明文 JSON 兜底
  try {
    const json = new TextDecoder("utf-8").decode(u8);
    const obj = JSON.parse(json);
    if (obj && typeof obj === "object") return obj;
    errors.push("plain: 解出非对象");
  } catch (e) {
    errors.push(`plain: ${e?.message || e}`);
  }

  decryptBody.lastError =
    `kind=${bodyKind} len=${u8.length} httpUngzip=${httpUngzipped} head=[${originalHead}] | ${errors.join(" | ")}`;
  Console.error(`[WYY/Crypto] 解密失败 ${decryptBody.lastError}`);
  return null;
}

/** 加密 JSON 对象为 Uint8Array 响应体。 */
export function encryptBody(obj) {
  const plaintext = JSON.stringify(obj);
  const encrypted = CryptoJS.AES.encrypt(plaintext, KEY, CFG);
  return waToU8(encrypted.ciphertext);
}
