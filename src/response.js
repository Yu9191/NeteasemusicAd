/**
 * 脚本入口（响应阶段 + App 内设置页的请求阶段）。
 * Script entry (response phase + request phase for the in-app settings page).
 *
 * 响应阶段：调用 {@link Response} 核心处理器，并把最终响应交回宿主环境。
 * 请求阶段（没有 $response）：由 {@link SettingsPage} 直接返回设置页，不访问网络。
 * Response phase: runs {@link Response} and hands the result back to the host.
 * Request phase (no $response): {@link SettingsPage} answers locally without hitting the network.
 */
import { $app, Console, done } from "@nsnanocat/util";
import { Response } from "./process/Response.mjs";
import { SettingsPage } from "./process/settingsPage.mjs";

// biome-ignore lint: $response is a host-injected global, undeclared in the request phase
const isRequestPhase = typeof $response === "undefined";

!(async () => {
  if (isRequestPhase) {
    const page = await SettingsPage($request);
    // 本地响应的格式：QX 直接是 {status, headers, body}，Surge / Loon 等包在 response 里
    return $app === "Quantumult X" ? page : { response: page };
  }
  // biome-ignore lint: $response is a host-injected global
  $response = await Response($request, $response);
  return $response;
})()
  .catch(e => {
    Console.error(`[WYY] 脚本异常: ${e?.message || e}`);
    // 响应阶段回落到原响应；请求阶段回落到空对象（放行请求）
    // biome-ignore lint: host-injected globals
    return isRequestPhase ? {} : $response;
  })
  .then(out => done(out ?? {}));
