/**
 * API 路径到处理器的路由表。
 * API path-to-handler routing table.
 *
 * 处理器签名 / Handler signature:
 *   `(s: object, ctx: { settings, vipLv, $request, $response }) => object | undefined`
 *
 * - 返回 `object` → 短路：该返回值直接作为最终响应（不再调用 `encryptBody(s)`）。
 * - Return `object` → short-circuit: that value is used as the final response (no re-encrypt).
 * - 返回 `undefined` → 默认流程：调用 `encryptBody(s)` 并替换 body。
 * - Return `undefined` → default flow: re-encrypt `s` and replace the body.
 */
import { batch } from "./batch.mjs";
import { bottomTab } from "./bottomTab.mjs";
import { cashier, myPageBar, followList, songMore } from "./misc.mjs";
import { commentFloor } from "./comment.mjs";
import { discovery, homepageBlock, rcmdRefresh, rcmdResource } from "./home.mjs";
import { topTab } from "./topTab.mjs";
import { vipCardEntry, vipFloat, vipInfo, vipNewCenter } from "./vip.mjs";

/**
 * @type {Record<string, (s: object, ctx: object) => (object|undefined)>}
 */
export const HANDLERS = {
  "/batch": batch,
  "/v2/resource/comment/floor/get": commentFloor,

  "/music-vip-membership/client/vip/info": vipInfo,
  "/music-vip-membership/front/vip/info": vipInfo,
  "/vip-center-bff/float/data": vipFloat,
  "/vip-center-bff/card/entry/list": vipCardEntry,
  "/vipnewcenter/app/resource/newaccountpage": vipNewCenter,

  "/vipactivity/app/cashier/setting/get": cashier,
  "/link/position/show/resource": myPageBar,
  "/user/follow/users/mixed/get/v2": followList,
  "/song/play/more/list/v2": songMore,

  "/link/home/framework/tab": bottomTab,
  "/link/home/framework/top/tab": topTab,
  "/homepage/block/page": homepageBlock,
  "/link/page/discovery/resource/show": discovery,
  "/link/page/rcmd/resource/show": rcmdResource,
  "/link/page/rcmd/block/resource/multi/refresh": rcmdRefresh
};
