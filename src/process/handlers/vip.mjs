import { toInt } from "../../function/setENV.mjs";
import { fakeVip } from "../../function/vip.mjs";

/**
 * 内部辅助：当 VipEnabled=0 时短路返回原响应，避免对 VIP 字段做任何修改。
 * Internal helper: when VipEnabled=0, short-circuit and return the original response untouched.
 *
 * @param {object} ctx
 * @returns {object|undefined} 原 $response（短路）或 undefined（继续走默认加密）
 */
function passThroughIfDisabled(ctx) {
  if (ctx.settings.VipEnabled === 0) return ctx.$response;
}

/**
 * VIP 基础信息接口（客户端 / 前端两个变体）。
 * VIP basic info endpoints (client / front variants).
 *
 * @param {object} s
 * @param {object} ctx
 * @returns {object|undefined}
 */
export function vipInfo(s, ctx) {
  const passthrough = passThroughIfDisabled(ctx);
  if (passthrough) return passthrough;
  fakeVip(s.data, ctx.vipLv);
}

/**
 * VIP 中心浮层，包含弹窗与入口信息。
 * VIP center float overlay, popups and entry info.
 *
 * @param {object} s
 * @param {object} ctx
 * @returns {object|undefined}
 */
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

/**
 * VIP 卡片入口列表，包含成长值条目。
 * VIP card entry list containing the growth value item.
 *
 * @param {object} s
 * @param {object} ctx
 * @returns {object|undefined}
 */
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

/**
 * VIP 中心新版账户页。
 * VIP center new account page.
 *
 * @param {object} s
 * @param {object} ctx
 * @returns {object|undefined}
 */
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
