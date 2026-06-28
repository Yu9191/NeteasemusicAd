/**
 * URL 工具。
 */

/** 从 eapi/api URL 提取 API 路径，例如 /eapi/batch → /batch。 */
export function extractPath(url) {
  const m = url.match(/(?:^https?:\/\/[^\/]+)\/(?:x?e?api)(\/[a-z0-9-/]+)(\?.*)?/);
  return m ? m[1] : null;
}

/** 是否为 aeapi 响应优化请求（带 x-aeapi: true 头）。 */
export function isAeapiRequest($request) {
  const h = $request.headers ?? {};
  for (const k of Object.keys(h)) {
    if (k.toLowerCase() === "x-aeapi" && String(h[k]).toLowerCase() === "true") return true;
  }
  return false;
}
