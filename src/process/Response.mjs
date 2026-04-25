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
import { $app, Console } from "@nsnanocat/util";
import { decryptBody, encryptBody } from "./Crypto.mjs";
import { HANDLERS } from "./handlers/index.mjs";
import { loadSettings, toInt } from "./Settings.mjs";
import { extractPath } from "./utils/url.mjs";

/**
 * 响应处理入口。
 * Response processing entry point.
 *
 * @param {object} $request - 原始请求对象 / Original request.
 * @param {object} $response - 原始响应对象 / Original response.
 * @returns {Promise<object>} 修改后的响应对象 / Modified response.
 */
export async function Response($request, $response) {
  if (!$request?.url || !$response) return $response;

  // 按 NSNanoCat/Template 标准做法读取二进制响应体：
  //   - Quantumult X: 通过 `$response.bodyBytes` 拿原始字节
  //   - Surge / Loon / Stash 等: `$response.body` 已经是 Uint8Array
  // Read binary response body the NSNanoCat-standard way:
  //   - Quantumult X exposes raw bytes via `$response.bodyBytes`
  //   - Surge / Loon / Stash already provide a Uint8Array on `$response.body`
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

    // 写回统一使用 `body`，由 `done()` 按 `$app` 自行分发到对应字段。
    // Always write to `body`; `done()` will route to the correct field per `$app`.
    return { ...$response, body: encryptBody(s) };
  } catch (e) {
    Console.error(`[WYY] 处理 ${path} 异常: ${e?.message || e}`);
    return $response;
  }
}
