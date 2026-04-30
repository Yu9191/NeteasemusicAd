import { toInt } from "../../function/setENV.mjs";
import { fakeVip } from "../../function/vip.mjs";

/** VipEnabled=0 时短路返回原响应。 */
function passThroughIfDisabled(ctx) {
  if (ctx.settings.VipEnabled === 0) return ctx.$response;
}

/** VIP 基础信息（client / front 两个变体）。 */
export function vipInfo(s, ctx) {
  const passthrough = passThroughIfDisabled(ctx);
  if (passthrough) return passthrough;
  fakeVip(s.data, ctx.vipLv, ctx.vipExpire);
}

/** VIP 中心浮层：伪造会员信息、清空收银/弹窗/浮提。 */
export function vipFloat(s, ctx) {
  const passthrough = passThroughIfDisabled(ctx);
  if (passthrough) return passthrough;

  if (s.data?.vipInfo) fakeVip(s.data.vipInfo, ctx.vipLv, ctx.vipExpire);
  if (s.data?.cashierData) {
    s.data.cashierData = { isNotify: false, link: "", cashierTab: null };
  }
  if (s.data?.popupData) s.data.popupData = null;
  if (s.data?.floatTip) s.data.floatTip = null;
}

/** 高品质音效授权：/vip-center-bff/quality/auth/info。 */
export function vipQualityAuth(s, ctx) {
  const passthrough = passThroughIfDisabled(ctx);
  if (passthrough) return passthrough;

  if (s.data?.vipInfo) fakeVip(s.data.vipInfo, ctx.vipLv, ctx.vipExpire);
  // vipType: 11=SVIP黑胶、5=VIP黑胶、15=SVIP+黑胶、25=黑胶会员+听书
  if (typeof s.data?.vipType === "number") s.data.vipType = 15;
  // 让所有音质（sky/jymaster/jyeffect/vivid/dolby）可用
  for (const a of s.data?.authInfo ?? []) {
    if (a.authInfo) {
      a.authInfo.canUse = true;
      a.authInfo.canNotUseReasonCode = 0;
    }
    if (a.actionType !== undefined) a.actionType = "use";
    if (a.trial !== undefined) a.trial = false;
  }
}

/** VIP 卡片入口：等级与成长值。 */
export function vipCardEntry(s, ctx) {
  const passthrough = passThroughIfDisabled(ctx);
  if (passthrough) return passthrough;

  if (Array.isArray(s.data)) {
    const growth = toInt(ctx.settings.GrowthValue, 99999);
    for (const i of s.data) {
      // 兼容多种 type 命名："level"/"growth"/包含 vip|level 的
      const t = String(i.type || "").toLowerCase();
      if (t === "level" || t === "growth" || t.includes("vip")) {
        if (typeof i.level !== "undefined") i.level = ctx.vipLv;
        if (typeof i.value !== "undefined") i.value = growth;
        if (typeof i.score !== "undefined") i.score = growth;
      }
    }
  }
}

/** VIP 中心新版账户页 /vipnewcenter/app/resource/newaccountpage。 */
export function vipNewCenter(s, ctx) {
  const passthrough = passThroughIfDisabled(ctx);
  if (passthrough) return passthrough;

  const growth = toInt(ctx.settings.GrowthValue, 99999);
  if (s.data?.mainTitle) {
    const m = s.data.mainTitle;
    m.vipCurrLevel = ctx.vipLv;
    m.currScore = growth;
    m.nextLevel = ctx.vipLv;
    m.subPercent = ctx.vipLv >= 7 ? 0 : 1;
    m.reachMaxLevel = ctx.vipLv >= 7;
    // imgUrl / jumpUrl 保留原值，不再清空
  }
  if (s.data?.subTitle) s.data.subTitle.carousels = [];
}
