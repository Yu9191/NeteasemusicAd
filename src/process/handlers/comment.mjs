/**
 * 评论楼层处理 (`/v2/resource/comment/floor/get`)。
 * Comment floor handler.
 *
 * 修改内容 / Modifications:
 * - 楼主评论：清空 VIP 标识、头像装饰、挂件
 * - 子评论：未关注的强制 followed=true，并清理装饰字段
 *
 * @param {object} s
 * @returns {void}
 */
export function commentFloor(s) {
  if (s.data?.ownerComment?.user) {
    s.data.ownerComment.user.vipRights = null;
    s.data.ownerComment.user.avatarDetail = {};
    s.data.ownerComment.pendantData = null;
  }
  for (const c of s.data?.comments ?? []) {
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
}
