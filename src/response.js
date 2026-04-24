/**
 * 响应脚本入口。
 * Response script entry.
 *
 * 调用 {@link Response} 核心处理器，并把最终响应交回宿主环境。
 * Invokes {@link Response} core processor and hands the final response back to the host runtime.
 */
import { Console, done } from "@nsnanocat/util";
import { Response } from "./process/Response.mjs";

!(async () => {
  // biome-ignore lint: $response is a host-injected global
  $response = await Response($request, $response);
})()
  .catch(e => Console.error(`[WYY] 脚本异常: ${e?.message || e}`))
  .finally(() => {
    // biome-ignore lint: host-injected globals
    done($response ?? {});
  });
