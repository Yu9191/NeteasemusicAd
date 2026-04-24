/**
 * 请求 URL 与请求头相关的工具函数。
 * URL and request-header related utilities.
 */

/**
 * 从 eapi/api 请求 URL 中提取 API 路径。
 * Extract API path from an eapi/api request URL.
 *
 * @example
 *   extractPath("https://interface3.music.163.com/eapi/batch?e_r=true") === "/batch"
 *
 * @param {string} url
 * @returns {string|null}
 */
export function extractPath(url) {
  const m = url.match(/(?:^https?:\/\/[^\/]+)\/(?:e?api)(\/[a-z0-9-/]+)(\?.*)?/);
  return m ? m[1] : null;
}

/**
 * 判断请求是否为 aeapi 响应优化格式（请求头带 `x-aeapi: true`）。
 * Check whether the request opts in to the aeapi optimized response format.
 *
 * @param {object} $request
 * @returns {boolean}
 */
export function isAeapiRequest($request) {
  const h = $request.headers ?? {};
  return h["x-aeapi"] === "true" || h["X-Aeapi"] === "true";
}
