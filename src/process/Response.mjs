/**
 * 响应路由分发。
 *
 * 提取 API 路径 → 解密 → 查 HANDLERS → 处理后重新加密。
 * Handler 返回对象时直接短路替换；返回 undefined 时按默认流程加密。
 */
import { $app, Console } from "@nsnanocat/util";
import database from "../database.mjs";
import { decryptBody, encryptBody } from "../function/Crypto.mjs";
import setENV, { toInt } from "../function/setENV.mjs";
import { extractPath } from "../function/url.mjs";
import { HANDLERS } from "./handlers/index.mjs";

export async function Response($request, $response) {
  if (!$request?.url || !$response) return $response;

  // QX 走 bodyBytes，其它平台 body 已是 Uint8Array
  const rawBody =
    $app === "Quantumult X"
      ? new Uint8Array($response.bodyBytes ?? [])
      : ($response.body ?? new Uint8Array());

  if (!rawBody.length) return $response;

  const path = extractPath($request.url);
  if (!path) return $response;

  const handler = HANDLERS[path];
  if (!handler) return $response;

  const s = decryptBody(rawBody);
  if (!s) {
    Console.error(`[WYY] 解密失败: ${path} | ${decryptBody.lastError ?? "无诊断信息"}`);
    return $response;
  }

  const Settings = setENV(database);
  const ctx = {
    settings: Settings,
    vipLv: toInt(Settings.VipLevel, 7),
    $request,
    $response
  };

  Console.debug(`[WYY] ${path}`);

  try {
    const shortCircuit = handler(s, ctx);
    if (shortCircuit) return shortCircuit;
    return { ...$response, body: encryptBody(s) };
  } catch (e) {
    Console.error(`[WYY] 处理 ${path} 异常: ${e?.message || e}`);
    return $response;
  }
}
