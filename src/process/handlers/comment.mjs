/**
 * 单条评论去装饰：清 VIP 标识/头像装饰/等级/挂件/附加标签，未关注的强制 followed=true。
 * 评论楼层、批量评论、回复预加载共用。
 */
export function cleanComment(c) {
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

/**
 * 评论楼层：楼主与子评论清空 VIP 标识/头像装饰/挂件，未关注的强制 followed=true。
 */
export function commentFloor(s) {
  if (s.data?.ownerComment?.user) {
    s.data.ownerComment.user.vipRights = null;
    s.data.ownerComment.user.avatarDetail = {};
    s.data.ownerComment.pendantData = null;
  }
  for (const c of s.data?.comments ?? []) cleanComment(c);
}

/**
 * 评论回复预加载（新版 /resource/comments/reply/preload）：
 * data.preloadCommentMap 为 { 评论 ID: 回复数组 }，逐条去装饰。
 */
export function commentReplyPreload(s) {
  for (const replies of Object.values(s.data?.preloadCommentMap ?? {})) {
    if (Array.isArray(replies)) replies.forEach(cleanComment);
  }
}

/**
 * 评论区插入的推荐动态/笔记（新版独立接口 /comment/feed/inserted/resources/combined，
 * 旧版在 /batch 里的 /api/comment/feed/inserted/resources）：清空记录。
 */
export function commentInserted(s) {
  if (!s.data) return;
  s.data.records = [];
  s.data.count = 0;
}
