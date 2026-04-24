/**
 * 首页推荐卡片 bizCode 映射。
 * Home recommendation block bizCode mapping (setting key to bizCode).
 *
 * @type {Record<string, string>}
 */
const BLOCK_MAP = {
  PRGG: "PAGE_RECOMMEND_GREETING",
  PRDRD: "PAGE_RECOMMEND_DAILY_RECOMMEND",
  PRSCVPT: "PAGE_RECOMMEND_SPECIAL_CLOUD_VILLAGE_PLAYLIST",
  PRST: "PAGE_RECOMMEND_SHORTCUT",
  HMPR: "HOMEPAGE_MUSIC_PARTNER",
  PRRR: "PAGE_RECOMMEND_RADAR",
  PRRK: "PAGE_RECOMMEND_RANK",
  PRMST: "PAGE_RECOMMEND_MY_SHEET",
  PRCN: "PAGE_RECOMMEND_COMBINATION"
};

/**
 * 清理问候语卡片中带遥测/广告字段的子项。
 * Strip telemetry / advertising fields from greeting block entries.
 *
 * @param {Array<object>} entries
 * @returns {void}
 */
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

/**
 * 计算允许显示的 bizCode 白名单。
 * Compute allowed bizCode whitelist from settings.
 *
 * @param {Record<string, unknown>} settings
 * @returns {string[]}
 */
function allowedBizCodes(settings) {
  return Object.keys(BLOCK_MAP)
    .filter(k => settings[k] === 1)
    .map(k => BLOCK_MAP[k]);
}

/**
 * 首页 Banner 去除活动与广告类型 (`/homepage/block/page`)。
 * Home banner filter: remove activity/ad entries.
 *
 * @param {object} s
 * @returns {void}
 */
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

/**
 * 发现页移除顶部 Banner (`/link/page/discovery/resource/show`)。
 * Discovery page: remove top banner.
 *
 * @param {object} s
 * @returns {void}
 */
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

/**
 * 推荐页全量加载 (`/link/page/rcmd/resource/show`)。
 * Recommendation page: full resource fetch.
 *
 * @param {object} s
 * @param {{settings: Record<string, unknown>}} ctx
 * @returns {void}
 */
export function rcmdResource(s, { settings }) {
  const allowed = allowedBizCodes(settings);

  if (s.data?.blocks) {
    s.data.blocks = s.data.blocks.filter(b => allowed.includes(b.bizCode));
    const greeting = s.data.blocks.find(b => b.bizCode === "PAGE_RECOMMEND_GREETING");
    if (greeting?.dslData) {
      for (const ds of Object.values(greeting.dslData)) {
        cleanGreetingEntries(ds.commonResourceList);
      }
    }
  }
  if (s.data?.blockCodeOrderList) {
    try {
      s.data.blockCodeOrderList = JSON.stringify(
        JSON.parse(s.data.blockCodeOrderList).filter(i => allowed.includes(i))
      );
    } catch {}
  }
}

/**
 * 推荐页增量刷新 (`/link/page/rcmd/block/resource/multi/refresh`)。
 * Recommendation incremental refresh handler.
 *
 * @param {object} s
 * @param {{settings: Record<string, unknown>}} ctx
 * @returns {void}
 */
export function rcmdRefresh(s, { settings }) {
  if (!Array.isArray(s.data)) return;
  const allowed = allowedBizCodes(settings);
  s.data = s.data.filter(i => allowed.includes(i.blockCode));
  const greeting = s.data.find(i => i.blockCode === "PAGE_RECOMMEND_GREETING");
  if (greeting?.block?.dslData) {
    for (const ds of Object.values(greeting.block.dslData)) {
      cleanGreetingEntries(ds.commonResourceList);
    }
  }
}
