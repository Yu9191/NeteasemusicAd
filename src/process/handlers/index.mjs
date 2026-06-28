/**
 * API 路径 → 处理器路由表。
 *
 * 处理器签名：(s, ctx) => object | undefined
 * - 返回 object   → 短路：直接作为最终响应（不再加密）
 * - 返回 undefined → 默认：encryptBody(s) 后替换 body
 */
import { batch } from "./batch.mjs";
import { bottomTab } from "./bottomTab.mjs";
import { flowPopup } from "./flow.mjs";
import { cashier, myPageBar, followList, songMore } from "./misc.mjs";
import { commentFloor } from "./comment.mjs";
import { discovery, homepageBlock, rcmdRefresh, rcmdResource } from "./home.mjs";
import { topTab } from "./topTab.mjs";
import { userInfo } from "./userInfo.mjs";

export const HANDLERS = {
  "/batch": batch,
  "/v2/resource/comment/floor/get": commentFloor,

  "/v1/user/info": userInfo,
  "/sp/flow/popup/query": flowPopup,

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
