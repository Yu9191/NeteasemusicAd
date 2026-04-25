import { fakeVip } from "../../function/vip.mjs";

/**
 * 批量接口处理 (`/batch`)。
 * Batch endpoint handler — combines multiple API responses in one body.
 *
 * 修改内容 / Modifications:
 * - 清空评论 tips、社交事件广告、`/api/ad/get` 广告位
 * - 若开启伪 VIP，伪造嵌套的 vip/info 数据
 * - 评论列表内的关注、VIP 标识、挂件等隐私信息清理
 * - 清空 feed 推荐、话题列表、付费下载入口
 *
 * @param {object} s - 解密后的响应对象 / Decrypted response.
 * @param {{settings: Record<string, unknown>, vipLv: number}} ctx
 * @returns {void}
 */
export function batch(s, { settings, vipLv }) {
  const clearData = (k, v = {}) => {
    if (s[k]?.data) s[k].data = v;
  };
  clearData("/api/comment/tips/v2/get", { count: 0, offset: 0, records: [] });
  clearData("/api/social/event/bff/ad/resources");
  clearData("/api/ad/get", { code: 200, ads: {} });

  const vipKey = "/api/music-vip-membership/client/vip/info";
  if (s[vipKey]?.data && settings.VipEnabled !== 0) fakeVip(s[vipKey].data, vipLv);

  for (const c of s["/api/v2/resource/comments"]?.data?.comments ?? []) {
    if (c.user?.followed === false) c.user.followed = true;
    if (c.user) {
      c.user.vipRights = null;
      c.user.avatarDetail = null;
    }
    c.userBizLevels = null;
    c.pendantData = null;
    if (c.tag) {
      c.tag.extDatas = [];
      c.tag.contentPicDatas = null;
    }
  }

  const insKey = "/api/comment/feed/inserted/resources";
  if (s[insKey]?.data) {
    s[insKey].data = {};
    if (s[insKey].trp?.rules) s[insKey].trp.rules = [];
  }

  const topicKey = "/api/event/rcmd/topic/list";
  if (s[topicKey]?.data?.topicList) s[topicKey].data.topicList = [];

  const orderKey = "/api/platform/song/bff/grading/song/order/entrance";
  if (s[orderKey]?.data?.songOrderEntrance) s[orderKey].data.songOrderEntrance = {};
}
