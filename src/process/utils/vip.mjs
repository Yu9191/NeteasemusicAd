/**
 * 伪造 VIP 信息相关辅助函数。
 * Helpers for fabricating VIP membership info.
 */

/**
 * 伪 VIP 统一过期时间（2099-09-09 毫秒时间戳）。
 * Fake VIP uniform expiration timestamp (epoch ms of 2099-09-09).
 *
 * @type {number}
 */
export const VIP_EXPIRE = 4092599349000;

/**
 * 向 VIP 相关对象写入伪造的会员信息。
 * Write fake membership info into VIP-related fields.
 *
 * @param {object} data - VIP 数据对象 / VIP data object.
 * @param {number} vipLv - 伪造等级 / Fake level.
 * @returns {void}
 */
export function fakeVip(data, vipLv) {
  if (!data) return;
  for (const k of ["musicPackage", "associator", "voiceBookVip", "albumVip", "familyVip"]) {
    if (data[k]) {
      data[k].expireTime = VIP_EXPIRE;
      data[k].vipLevel = vipLv;
    }
  }
  data.redplus = {
    vipCode: 300,
    expireTime: VIP_EXPIRE,
    iconUrl: null,
    dynamicIconUrl: null,
    vipLevel: vipLv,
    isSignDeduct: false,
    isSignIap: false,
    isSignIapDeduct: false,
    isSign: false
  };
  if (data.redVipLevel) data.redVipLevel = vipLv;
  if (data.redVipAnnualCount !== undefined) data.redVipAnnualCount = 10;
}
