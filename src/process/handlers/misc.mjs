/**
 * 收银台广告弹窗清除 (`/vipactivity/app/cashier/setting/get`)。
 * Cashier ad popup cleanup.
 *
 * @param {object} s
 * @returns {void}
 */
export function cashier(s) {
  if (s.data?.cashierTabPopup) s.data.cashierTabPopup = {};
}

/**
 * 我的页顶部横幅广告 (`/link/position/show/resource`)。
 * "My page" top banner ad.
 *
 * @param {object} s
 * @returns {void}
 */
export function myPageBar(s) {
  if (s.data?.crossPlatformResource?.positionCode === "MyPageBar") {
    s.data.crossPlatformResource = {};
  }
}

/**
 * 关注列表中未回关用户的提示文案 (`/user/follow/users/mixed/get/v2`)。
 * Follow list prompt for users who have not followed back.
 *
 * @param {object} s
 * @returns {void}
 */
export function followList(s) {
  for (const r of s.data?.records ?? []) {
    if (r.mutualFollowDay === null) {
      r.showContent = {
        message: "💢他/她,未关注你",
        time: 1e12,
        active: true,
        boxContent: {}
      };
    }
  }
}

/**
 * 歌曲播放菜单，把"音效"项移到最前 (`/song/play/more/list/v2`)。
 * Song play menu, pull the "effect" node to the front.
 *
 * @param {object} s
 * @returns {void}
 */
export function songMore(s) {
  const nodes = s.data?.bottomItem?.itemNodeList?.[0];
  if (!Array.isArray(nodes)) return;
  const fx = nodes.find(n => n.type === "effect");
  const idx = fx ? nodes.indexOf(fx) : -1;
  if (idx !== -1) {
    nodes.splice(idx, 1);
    nodes.unshift(fx);
  }
}
