import { Console } from "@nsnanocat/util";

/**
 * 底部 Tab 原始名称映射（设置键 → 中文 title）。
 * Bottom tab original title mapping (setting key to Chinese title).
 *
 * @type {Record<string, string>}
 */
const BOTTOM_TAB_NAMES = {
  MY: "漫游",
  DT: "笔记",
  FX: "发现",
  GZ: "关注",
  SOU: "搜索"
};

/**
 * 底部 Tab 过滤与改名 (`/link/home/framework/tab`)。
 * Bottom tab filter and rename handler.
 *
 * 修改内容 / Modifications:
 * - 根据 `MY/DT/FX/GZ/SOU`（值为 1）从底部隐藏对应 Tab
 * - 至少保留首页一个 Tab，避免 UI 崩溃
 * - 应用自定义 Tab 名称：`SY_NAME` / `WD_NAME` / `MY_NAME` / `DT_NAME` / `FX_NAME`
 * - 发现页子 Tab 移除"直播"
 *
 * @param {object} s
 * @param {{settings: Record<string, unknown>}} ctx
 * @returns {void}
 */
export function bottomTab(s, { settings }) {
  // 调试：打印当前生效的底部 Tab 设置 + API 返回的原始 title 列表
  // Debug: print effective bottom-tab settings and the raw titles from the API response
  Console.log(`[WYY/bottomTab] settings: ${JSON.stringify({
    FX: settings.FX, MY: settings.MY, DT: settings.DT, GZ: settings.GZ, SOU: settings.SOU,
    SY_NAME: settings.SY_NAME, WD_NAME: settings.WD_NAME,
    MY_NAME: settings.MY_NAME, DT_NAME: settings.DT_NAME, FX_NAME: settings.FX_NAME
  })}`);
  Console.log(`[WYY/bottomTab] titles: ${JSON.stringify((s.data?.commonResourceList ?? []).map(i => i.title))}`);

  const hideTabs = Object.keys(BOTTOM_TAB_NAMES)
    .filter(k => settings[k] === 1)
    .map(k => BOTTOM_TAB_NAMES[k]);

  if (!s.data?.commonResourceList) return;

  const filtered = s.data.commonResourceList.filter(i => !hideTabs.includes(i.title));
  s.data.commonResourceList = filtered.length > 0
    ? filtered
    : s.data.commonResourceList.slice(0, 1);

  for (const i of s.data.commonResourceList) {
    if (i.title === "首页" && settings.SY_NAME) i.title = settings.SY_NAME;
    if (i.title === "我的" && settings.WD_NAME) i.title = settings.WD_NAME;
    if (i.title === "漫游" && settings.MY_NAME) i.title = settings.MY_NAME;
    if (i.title === "笔记" && settings.DT_NAME) i.title = settings.DT_NAME;
    if (i.title === "发现") {
      if (settings.FX_NAME) i.title = settings.FX_NAME;
      if (i.subCommonResourceList) {
        i.subCommonResourceList = i.subCommonResourceList.filter(y => y.title !== "直播");
      }
    }
  }
}
