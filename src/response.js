/** 脚本入口：响应阶段走 Response；请求阶段（无 $response）返回设置页。 */
import { $app, Console, done } from "@nsnanocat/util";
import { Response } from "./process/Response.mjs";
import { SettingsPage } from "./process/settingsPage.mjs";

// biome-ignore lint: $response is a host-injected global, undeclared in the request phase
const isRequestPhase = typeof $response === "undefined";

!(async () => {
  if (isRequestPhase) {
    const page = await SettingsPage($request);
    // QX 直接返回 {status, headers, body}，其余平台包在 response 里
    return $app === "Quantumult X" ? page : { response: page };
  }
  // biome-ignore lint: $response is a host-injected global
  $response = await Response($request, $response);
  return $response;
})()
  .catch(e => {
    Console.error(`[WYY] 脚本异常: ${e?.message || e}`);
    // 失败时放行：响应阶段回落原响应，请求阶段回落 {}
    return isRequestPhase ? {} : $response;
  })
  .then(out => done(out ?? {}));
