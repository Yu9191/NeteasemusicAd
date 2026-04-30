/**
 * 网易云"免流量"相关接口。
 *
 * - /api/sp/flow/status/v2  : 流量包状态。原值 status=0/spType=-1 表示无包；
 *   伪造为已开通可避免播放/下载时弹流量提醒。
 * - /api/sp/flow/popup/query: 全国三大运营商免流推广弹窗（启动/播放/下载/视频/设置页），
 *   全部置空避免弹出。
 */

/** 流量包：伪造已开通。 */
export function flowStatus(s, ctx) {
  if (ctx.settings.VipEnabled === 0) return ctx.$response;
  if (!s.status) s.status = {};
  s.status.packageName = s.status.packageName || "网易云音乐流量包";
  s.status.expireTime = ctx.vipExpire;
  s.status.spType = 1;     // 1=移动 / 2=联通 / 3=电信；任选
  s.status.status = 1;     // 1=已开通
}

/** 免流推广弹窗：全清。 */
export function flowPopup(s) {
  if (s.data) s.data = {};
}
