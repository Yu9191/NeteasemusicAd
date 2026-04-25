import { Console } from "@nsnanocat/util";

const BOTTOM_TAB_NAMES = {
  MY: "漫游",
  DT: "笔记",
  FX: "发现",
  GZ: "关注",
  SOU: "搜索"
};

/**
 * 底部 Tab 过滤与改名。隐藏 MY/DT/FX/GZ/SOU、应用自定义 Tab 名、发现页移除"直播"。
 */
export function bottomTab(s, { settings }) {
  Console.debug(`[WYY/bottomTab] settings: ${JSON.stringify({
    FX: settings.FX, MY: settings.MY, DT: settings.DT, GZ: settings.GZ, SOU: settings.SOU,
    SY_NAME: settings.SY_NAME, WD_NAME: settings.WD_NAME,
    MY_NAME: settings.MY_NAME, DT_NAME: settings.DT_NAME, FX_NAME: settings.FX_NAME
  })}`);
  Console.debug(`[WYY/bottomTab] titles: ${JSON.stringify((s.data?.commonResourceList ?? []).map(i => i.title))}`);

  const hideTabs = Object.keys(BOTTOM_TAB_NAMES)
    .filter(k => settings[k] === 1)
    .map(k => BOTTOM_TAB_NAMES[k]);

  if (!s.data?.commonResourceList) return;

  // 至少保留 1 个 Tab，避免 UI 崩溃
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
