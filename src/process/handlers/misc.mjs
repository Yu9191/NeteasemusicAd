import { Console } from "@nsnanocat/util";
import { SETTINGS_ENTRY } from "../settingsPage.mjs";

/** 收银台广告弹窗清除。 */
export function cashier(s) {
  if (s.data?.cashierTabPopup) s.data.cashierTabPopup = {};
}

/** 我的页顶部横幅（MyPageBar / MyPageBarRN）。 */
export function myPageBar(s) {
  if (s.data?.crossPlatformResource?.positionCode?.startsWith("MyPageBar")) {
    s.data.crossPlatformResource = {};
  }
}

const ENTRY_CODE = "wyy_settings";
/** 无 AI写歌 入口的用户用的图标（网易云 CDN）。 */
const FALLBACK_ICON =
  "https://p6.music.126.net/obj/wonDlsKUwrLClGjCm8Kx/77261925457/cb9e/1552/7fc8/6928643b1dd9b9b7ffd9d1edc9bc3b0e.png";

/** 要移除 / 去重的入口。 */
const isOurs = code => code === "ai_songwriting" || code === ENTRY_CODE;

/** 第一组入口数组：移除 AI写歌，在创作者中心后加入设置入口（以创作者中心为模板）。 */
function injectIntoEntries(arr) {
  const icon = arr.find(e => e.code === "ai_songwriting")?.icon ?? FALLBACK_ICON;
  for (let i = arr.length - 1; i >= 0; i--) if (isOurs(arr[i].code)) arr.splice(i, 1);
  const at = arr.findIndex(e => e.code === "creator") + 1 || arr.length; // 没有创作者中心就放最后
  const template = arr[at - 1] ?? {};
  arr.splice(at, 0, { ...template, code: ENTRY_CODE, s_cid: ENTRY_CODE, subTitle: "", name: SETTINGS_ENTRY.name, icon, url: SETTINGS_ENTRY.url });
}

/** 同上，针对 dataGroupResourceList。 */
function injectIntoGroups(groups) {
  const icon = groups.find(g => g.sideBarItemData3?.code === "ai_songwriting")?.sideBarItemData3.iconUrl ?? FALLBACK_ICON;
  for (let i = groups.length - 1; i >= 0; i--) if (isOurs(groups[i].sideBarItemData3?.code)) groups.splice(i, 1);
  const at = groups.findIndex(g => g.sideBarItemData3?.code === "creator") + 1 || groups.length;
  const template = groups[at - 1] ?? {};
  groups.splice(at, 0, {
    ...template,
    sideBarItemData3: { ...template.sideBarItemData3, code: ENTRY_CODE, name: SETTINGS_ENTRY.name, description: "", iconUrl: icon, url: SETTINGS_ENTRY.url }
  });
}

/** 递归处理侧边栏第一组（含「我的消息」）的各份拷贝；App 读哪份不确定，见到就处理。 */
function injectSettingsEntry(node, depth = 0) {
  if (!node || typeof node !== "object" || depth > 8) return 0;
  let n = 0;
  if (Array.isArray(node)) {
    if (node.some(e => e?.code === "msg_center")) {
      injectIntoEntries(node);
      n++;
    } else if (node.some(e => e?.sideBarItemData3?.code === "msg_center")) {
      injectIntoGroups(node);
      n++;
    }
  }
  for (const v of Object.values(node)) n += injectSettingsEntry(v, depth + 1);
  return n;
}

/** 侧边栏：隐藏 AI写歌，加入「去广告设置」入口。 */
export function sideBar(s) {
  const done = injectSettingsEntry(s.data);
  if (done) Console.debug(`[WYY] 侧边栏已加入设置入口，处理 ${done} 份`);
}

/** /link/position/show/resource：我的页横幅 + 侧边栏。 */
export function positionResource(s) {
  myPageBar(s);
  sideBar(s);
}

/** 关注列表：没回关的用户显示提示（FOLLOW_TIP 开关，FOLLOW_TEXT 文字，空=默认）。 */
export function followList(s, { settings }) {
  if (settings.FOLLOW_TIP !== 1) return;
  const message = settings.FOLLOW_TEXT || "这人没关注你哦";
  for (const r of s.data?.records ?? []) {
    if (r.mutualFollowDay === null) {
      r.showContent = {
        message,
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
