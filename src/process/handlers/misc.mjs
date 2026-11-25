import { Console } from "@nsnanocat/util";
import { SETTINGS_ENTRY } from "../settingsPage.mjs";

/** 收银台广告弹窗清除。 */
export function cashier(s) {
  if (s.data?.cashierTabPopup) s.data.cashierTabPopup = {};
}

/** 我的页顶部横幅广告（原生版 MyPageBar；新版 RN 版 MyPageBarRN，即「我的页会员 Bar 条」）。 */
export function myPageBar(s) {
  if (s.data?.crossPlatformResource?.positionCode?.startsWith("MyPageBar")) {
    s.data.crossPlatformResource = {};
  }
}

/** 侧边栏里被改造成「去广告设置」入口的原 AI写歌项：只改显示名与跳转地址，code 等字段保持不变。 */
function repurposeAiEntry(o) {
  if (o.code !== "ai_songwriting" || typeof o.name !== "string") return false;
  o.name = SETTINGS_ENTRY.name;
  o.url = SETTINGS_ENTRY.url;
  return true;
}

/**
 * 递归替换所有 code=ai_songwriting 的入口。同一份入口在响应里有多份拷贝
 * （data.commonResourceList[].generalizedObject、data.commonResource.generalizedObject、
 * 各分组的 sideBarItemData3），App 实际读哪份不确定，所以不按固定路径改，见到就换。
 */
function replaceAiEntries(node, depth = 0) {
  if (!node || typeof node !== "object" || depth > 8) return 0;
  let n = repurposeAiEntry(node) ? 1 : 0;
  for (const v of Object.values(node)) n += replaceAiEntries(v, depth + 1);
  return n;
}

/** 侧边栏：把 AI写歌 入口换成 App 内设置页。 */
export function sideBar(s) {
  const replaced = replaceAiEntries(s.data);
  if (replaced) Console.debug(`[WYY] 侧边栏入口已替换 ${replaced} 处`);
}

/** /link/position/show/resource：按位置分别处理（我的页横幅、侧边栏）。 */
export function positionResource(s) {
  myPageBar(s);
  sideBar(s);
}

/** 关注列表中未回关用户的提示文案。 */
export function followList(s) {
  for (const r of s.data?.records ?? []) {
    if (r.mutualFollowDay === null) {
      r.showContent = {
        message: "💢他/她,未关注你",
        time: 1e12,
        active: true,
        boxContent: {}
      };
    }
  }
}

/** 歌曲播放菜单：把"音效"项移到最前。 */
export function songMore(s) {
  const nodes = s.data?.bottomItem?.itemNodeList?.[0];
  if (!Array.isArray(nodes)) return;
  const fx = nodes.find(n => n.type === "effect");
  const idx = fx ? nodes.indexOf(fx) : -1;
  if (idx !== -1) {
    nodes.splice(idx, 1);
    nodes.unshift(fx);
  }
}
