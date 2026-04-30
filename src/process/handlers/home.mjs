/** 首页推荐卡片 setting key → bizCode 映射。 */
const BLOCK_MAP = {
  PRGG: "PAGE_RECOMMEND_GREETING",
  PRDRD: "PAGE_RECOMMEND_DAILY_RECOMMEND",
  PRSCVPT: "PAGE_RECOMMEND_SPECIAL_CLOUD_VILLAGE_PLAYLIST",
  PRST: "PAGE_RECOMMEND_SHORTCUT",
  HMPR: "HOMEPAGE_MUSIC_PARTNER",
  PRRR: "PAGE_RECOMMEND_RADAR",
  PRRK: "PAGE_RECOMMEND_RANK",
  PRMST: "PAGE_RECOMMEND_MY_SHEET",
  PRCN: "PAGE_RECOMMEND_COMBINATION",
  PRPRS: "PAGE_RECOMMEND_PRIVATE_RCMD_SONG",
  PRRSS: "PAGE_RECOMMEND_RED_SIMILAR_SONG"
};

/** 清理问候语卡片中带遥测/广告字段的子项。 */
function cleanGreetingEntries(entries) {
  for (const d of entries ?? []) {
    if (d.summary) d.summary = "";
    if (d.extraMap) d.extraMap = {};
    if (d.trp_id) d.trp_id = "";
    if (d.log) d.log = {};
    if (d.icon) d.icon = "";
    if (d.actionUrl) d.actionUrl = "";
    if (d.s_ctrp) d.s_ctrp = "";
    if (d.resourceType) d.resourceType = "";
  }
}

function allowedBizCodes(settings) {
  return Object.keys(BLOCK_MAP)
    .filter(k => settings[k] === 1)
    .map(k => BLOCK_MAP[k]);
}

/** 首页 Banner 移除活动/广告类型。 */
export function homepageBlock(s) {
  if (!Array.isArray(s.data?.blocks)) return;
  for (const blk of s.data.blocks) {
    if (blk.showType === "BANNER" && blk.extInfo?.banners) {
      blk.extInfo.banners = blk.extInfo.banners.filter(
        y => !["活动", "广告"].includes(y.typeTitle)
      );
      break;
    }
  }
}

/** 发现页移除顶部 Banner。 */
export function discovery(s) {
  if (s.data?.blockCodeOrderList) {
    try {
      s.data.blockCodeOrderList = JSON.stringify(
        JSON.parse(s.data.blockCodeOrderList).filter(i => i !== "PAGE_DISCOVERY_BANNER")
      );
    } catch {}
  }
  if (Array.isArray(s.data?.blocks)) {
    s.data.blocks = s.data.blocks.filter(i => i.bizCode !== "PAGE_DISCOVERY_BANNER");
  }
}

/** 按白名单过滤 JSON 字符串化的 blockCode 列表。 */
function filterCodeListJson(jsonStr, allowed) {
  try {
    const arr = JSON.parse(jsonStr);
    return JSON.stringify(arr.filter(i => allowed.includes(i)));
  } catch {
    return jsonStr;
  }
}

/** 推荐页全量加载：按 BLOCK_MAP 过滤 blocks，问候语再清理子项。 */
export function rcmdResource(s, { settings }) {
  const allowed = allowedBizCodes(settings);
  if (!s.data) return;

  if (Array.isArray(s.data.blocks)) {
    s.data.blocks = s.data.blocks.filter(b => allowed.includes(b.bizCode));
    const greeting = s.data.blocks.find(b => b.bizCode === "PAGE_RECOMMEND_GREETING");
    if (greeting?.dslData) {
      for (const ds of Object.values(greeting.dslData)) {
        cleanGreetingEntries(ds.commonResourceList);
      }
    }
  }
  if (typeof s.data.blockCodeOrderList === "string") {
    s.data.blockCodeOrderList = filterCodeListJson(s.data.blockCodeOrderList, allowed);
  }
  if (typeof s.data.algDemoteBlockCodeOrderList === "string") {
    s.data.algDemoteBlockCodeOrderList = filterCodeListJson(s.data.algDemoteBlockCodeOrderList, allowed);
  }
  if (Array.isArray(s.data.requestBlockOrder)) {
    s.data.requestBlockOrder = s.data.requestBlockOrder.filter(i => allowed.includes(i));
  }
  // 斩断懒加载链条：避免 multi/refresh 把过滤掉的卡片反复拉回。
  if ("hasMore" in s.data) s.data.hasMore = false;
  if ("cursor" in s.data) s.data.cursor = -1;
}

/**
 * 推荐页增量刷新：同时兼容
 *  - 旧结构：{ data: [{ blockCode, block: {...} }, ...] }
 *  - 新结构：{ data: { blocks: [{ bizCode, ... }], cursor, hasMore } }
 */
export function rcmdRefresh(s, ctx) {
  const allowed = allowedBizCodes(ctx.settings);

  if (Array.isArray(s.data)) {
    s.data = s.data.filter(i => allowed.includes(i.blockCode));
    const greeting = s.data.find(i => i.blockCode === "PAGE_RECOMMEND_GREETING");
    if (greeting?.block?.dslData) {
      for (const ds of Object.values(greeting.block.dslData)) {
        cleanGreetingEntries(ds.commonResourceList);
      }
    }
    return;
  }
  // 新结构：复用 rcmdResource 逻辑
  rcmdResource(s, ctx);
}
