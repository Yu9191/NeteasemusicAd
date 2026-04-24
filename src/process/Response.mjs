/**
 * 网易云音乐响应处理核心 - 路由分发器。
 * NetEase Cloud Music response router.
 *
 * 流程 / Pipeline:
 * 1. 提取 API 路径 / Extract API path from URL.
 * 2. 解密响应体 / Decrypt response body (eapi / aeapi).
 * 3. 从 {@link HANDLERS} 路由表查找处理器并执行 / Look up handler in {@link HANDLERS} and run it.
 * 4. 处理器返回 `undefined` 时把修改后的对象重新加密为响应体；返回响应对象则直接短路。
 *    If handler returns `undefined`, re-encrypt the mutated object as response body;
 *    if it returns a response object, short-circuit and use it directly.
 */
import { Console } from "@nsnanocat/util";
import { decryptBody, encryptBody } from "./Crypto.mjs";
import { HANDLERS } from "./handlers/index.mjs";
import { loadSettings, toInt } from "./Settings.mjs";
import { extractPath, isAeapiRequest } from "./utils/url.mjs";

/**
 * 响应处理入口。
 * Response processing entry point.
 *
 * @param {object} $request - 原始请求对象 / Original request.
 * @param {object} $response - 原始响应对象 / Original response.
 * @returns {Promise<object>} 修改后的响应对象 / Modified response.
 */
export async function Response($request, $response) {
  if (!$request?.url || !$response?.body) return $response;

  const path = extractPath($request.url);
  if (!path) return $response;

  const handler = HANDLERS[path];
  if (!handler) return $response;

  const s = decryptBody($response.body, isAeapiRequest($request));
  if (!s) {
    Console.error(`[WYY] 解密失败: ${path}`);
    return $response;
  }

  const settings = loadSettings();
  const ctx = {
    settings,
    vipLv: toInt(settings.VipLevel, 7),
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
