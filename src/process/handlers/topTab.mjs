/**
 * 顶部 Tab 过滤 (`/link/home/framework/top/tab`)。
 * Top tab filter handler.
 *
 * 修改内容 / Modifications:
 * - `AIXG=1` 才显示「AI 写歌」
 * - `HDTAB=1` 才显示活动 Tab（`trp_type=musicTopTabIntervene`，例如 13 周年等运营位）
 * - 清空 `adminList`（否则会泄露网易内部员工真实姓名/工号）
 *
 * @param {object} s
 * @param {{settings: Record<string, unknown>}} ctx
 * @returns {void}
 */
export function topTab(s, { settings }) {
  if (s.data?.commonResourceList) {
    const showAIXG = settings.AIXG === 1;
    const showHDTAB = settings.HDTAB === 1;
    s.data.commonResourceList = s.data.commonResourceList.filter(i => {
      if (i.resCode === "ai-generate-song" && !showAIXG) return false;
      if (i.trp_type === "musicTopTabIntervene" && !showHDTAB) return false;
      return true;
    });
  }
  if (s.data?.adminList) s.data.adminList = [];
}
