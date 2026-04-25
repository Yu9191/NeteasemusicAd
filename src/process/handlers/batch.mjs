import { fakeVip } from "../../function/vip.mjs";

/**
 * 批量接口。清评论 tips、社交事件广告、ad/get 广告位；伪造嵌套 vip/info；
 * 评论列表脱敏（关注/VIP 标识/挂件）；清 feed 推荐、话题列表、付费下载入口。
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
