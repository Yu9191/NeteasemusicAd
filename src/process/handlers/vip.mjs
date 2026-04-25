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
  fakeVip(s.data, ctx.vipLv);
}

/** VIP 中心浮层：伪造会员信息、清空收银/弹窗/浮提。 */
export function vipFloat(s, ctx) {
  const passthrough = passThroughIfDisabled(ctx);
  if (passthrough) return passthrough;

  if (s.data?.vipInfo) fakeVip(s.data.vipInfo, ctx.vipLv);
  if (s.data?.cashierData) {
    s.data.cashierData = { isNotify: false, link: "", cashierTab: null };
  }
  if (s.data?.popupData) s.data.popupData = null;
  if (s.data?.floatTip) s.data.floatTip = null;
}

/** VIP 卡片入口：等级与成长值。 */
export function vipCardEntry(s, ctx) {
  const passthrough = passThroughIfDisabled(ctx);
  if (passthrough) return passthrough;

  if (Array.isArray(s.data)) {
    for (const i of s.data) {
      if (i.type === "level") {
        i.level = ctx.vipLv;
        i.value = toInt(ctx.settings.GrowthValue, 99999);
      }
    }
  }
}

/** VIP 中心新版账户页。 */
export function vipNewCenter(s, ctx) {
  const passthrough = passThroughIfDisabled(ctx);
  if (passthrough) return passthrough;

  if (s.data?.mainTitle) {
    s.data.mainTitle.vipCurrLevel = ctx.vipLv;
    s.data.mainTitle.imgUrl = "";
    s.data.mainTitle.jumpUrl = "";
    s.data.mainTitle.reachMaxLevel = true;
  }
  if (s.data?.subTitle) s.data.subTitle.carousels = [];
  if (s.data) s.data.buttonTitle = {};
}
