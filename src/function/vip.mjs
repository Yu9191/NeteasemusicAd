/**
 * 伪 VIP 工具。
 *
 * 设计要点：
 * - 仅覆盖"到期时间 / 等级 / 自动续费状态"，保留原字段（vipCode / iconUrl / dynamicIconUrl）
 *   → 真实开通的用户不会丢图标，未开通的用户也不会拿到 null 图标
 * - 不再粗暴整体替换 redplus；不存在时才补一份空壳
 * - 不再强制 redVipAnnualCount=10；保留真实续费年数
 */

/** 默认伪 VIP 到期时间 (2099-09-09 23:59:59 UTC+8)。 */
export const VIP_EXPIRE_DEFAULT = 4092623999000;

const VIP_BUCKETS = [
  "musicPackage",   // 220 黑胶 VIP（音乐包）
  "associator",     // 100 黑胶 VIP（曲库）
  "redplus",        // 300 SVIP 黑胶
  "voiceBookVip",   // 500 听书 VIP
  "albumVip",       // 400 专辑 VIP
  "familyVip"       // 600 家庭账号
];

/** 覆盖单个 VIP 子对象的到期时间/等级/自动续费状态，保留其余字段。 */
function patchBucket(v, vipLv, vipExpire) {
  if (!v || typeof v !== "object") return;
  v.expireTime = vipExpire;
  v.vipLevel = vipLv;
  v.isSign = false;
  v.isSignIap = false;
  v.isSignDeduct = false;
  v.isSignIapDeduct = false;
}

/**
 * 向 VIP 容器对象写入伪造的会员信息。
 * @param {object} data    容器（如 vip/info 的 data；float/data 的 data.vipInfo）
 * @param {number} vipLv   VIP 等级 1-7
 * @param {number} vipExpire 到期毫秒时间戳
 */
export function fakeVip(data, vipLv, vipExpire = VIP_EXPIRE_DEFAULT) {
  if (!data || typeof data !== "object") return;

  for (const k of VIP_BUCKETS) {
    if (data[k]) patchBucket(data[k], vipLv, vipExpire);
  }

  // redplus 是 SVIP 核心字段，缺失则补壳，避免 UI 拿不到字段崩溃
  if (!data.redplus || typeof data.redplus !== "object") {
    data.redplus = {
      vipCode: 300,
      expireTime: vipExpire,
      iconUrl: null,
      dynamicIconUrl: null,
      vipLevel: vipLv,
      isSign: false,
      isSignIap: false,
      isSignDeduct: false,
      isSignIapDeduct: false
    };
  }

  if (data.redVipLevel !== undefined) data.redVipLevel = vipLv;
  if (data.redVipAnnualCount === undefined) data.redVipAnnualCount = 1;
}
