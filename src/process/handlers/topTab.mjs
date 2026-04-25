/**
 * 顶部 Tab 过滤。AIXG=1 才显示 AI 写歌；HDTAB=1 才显示活动 Tab；清空 adminList。
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
