import { sortByOrder } from "../../function/order.mjs";

/** 顶部 Tab 的 resCode → 开关键（设置值为 1 才显示）。推荐（rcmd）恒保留，未登记的 Tab 不动。 */
const TAB_SWITCH = {
  fastPlay: "XD",
  music: "YY",
  podcast: "BK",
  vBook: "TS"
};

/** 顶部 Tab 的 resCode → 自定义名称键（非空则替换显示名）。 */
const TAB_NAME = {
  fastPlay: "XD_NAME",
  rcmd: "TJ_NAME",
  music: "YY_NAME",
  podcast: "BK_NAME",
  vBook: "TS_NAME"
};

/** 始终隐藏的 Tab：福利（激励广告入口）、AI写歌。 */
const ALWAYS_HIDDEN = new Set(["freeListen", "ai-generate-song"]);

/**
 * 顶部 Tab 过滤、排序与改名。XD/YY/BK/TS=1 才显示 心动/音乐/播客/听书；福利、AI写歌恒隐藏；
 * HDTAB=1 才显示活动 Tab；按 TOP_ORDER 排序；按 *_NAME 改名（TOP_ORDER 与 *_NAME 由 App 内设置页保存）；
 * 清空 adminList 与 Tab 上的引导气泡。
 */
export function topTab(s, { settings }) {
  if (s.data?.commonResourceList) {
    const shown = s.data.commonResourceList.filter(i => {
      if (ALWAYS_HIDDEN.has(i.resCode)) return false;
      const key = TAB_SWITCH[i.resCode];
      if (key && settings[key] !== 1) return false;
      if (i.trp_type === "musicTopTabIntervene" && settings.HDTAB !== 1) return false;
      return true;
    });
    s.data.commonResourceList = sortByOrder(shown, settings.TOP_ORDER, i => i.resCode);
    for (const i of s.data.commonResourceList) {
      const name = TAB_NAME[i.resCode] && settings[TAB_NAME[i.resCode]];
      if (name) i.title = name;
    }
  }
  if (s.data?.adminList) s.data.adminList = [];
  if (s.data?.guideInfo?.adminList) s.data.guideInfo.adminList = [];
}
