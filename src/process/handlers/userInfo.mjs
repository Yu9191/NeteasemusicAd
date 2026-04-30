/**
 * /api/v1/user/info 处理器。
 *
 * 字段含义：
 * - level: 用户等级（不动，由系统积分决定）
 * - viptype: VIP 位掩码 (11=SVIP黑胶, 15=SVIP+黑胶组合)
 * - expiretime / backupExpireTime: 顶级 VIP 到期时间
 * - fmConfig / ticketConfig: 我的页推荐位（私房推荐+票务），用户要求清除
 */

export function userInfo(s, ctx) {
  if (ctx.settings.VipEnabled === 0) return ctx.$response;

  // SVIP+黑胶组合位（保险起见高位都置上）
  s.viptype = 15;
  s.expiretime = ctx.vipExpire;
  s.backupExpireTime = ctx.vipExpire;

  // 推荐位：fm/ticket 都属"我的页"运营推广位
  s.fmConfig = null;
  s.ticketConfig = null;
}
