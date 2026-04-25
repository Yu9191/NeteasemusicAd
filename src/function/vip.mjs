/**
 * 伪 VIP 工具。
 */

/** 伪 VIP 统一过期时间（2099-09-09 毫秒）。 */
export const VIP_EXPIRE = 4092599349000;

/** 向 VIP 相关对象写入伪造的会员信息。 */
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
