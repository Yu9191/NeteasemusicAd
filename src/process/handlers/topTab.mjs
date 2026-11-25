import { sortByOrder } from "../../function/order.mjs";

/** resCode → 开关键（1 才显示）；推荐恒保留。 */
const TAB_SWITCH = {
  fastPlay: "XD",
  music: "YY",
  podcast: "BK",
  vBook: "TS"
};

/** resCode → 自定义名称键。 */
const TAB_NAME = {
  fastPlay: "XD_NAME",
  rcmd: "TJ_NAME",
  music: "YY_NAME",
  podcast: "BK_NAME",
  vBook: "TS_NAME"
};

/** 始终隐藏：福利、AI写歌。 */
const ALWAYS_HIDDEN = new Set(["freeListen", "ai-generate-song"]);

/** 顶部 Tab：过滤、按 TOP_ORDER 排序、按 *_NAME 改名；清空 adminList 与引导气泡。 */
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
