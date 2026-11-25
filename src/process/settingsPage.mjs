/**
 * App 内设置页。
 *
 * 侧边栏入口打开 https://music.163.com/wyy-settings，请求阶段由脚本直接返回页面，
 * 页面里的开关通过 /wyy-settings/set 写入持久化存储（键 wyy_<KEY>，与 BoxJS 共用，优先级最高）。
 */
import { Storage } from "@nsnanocat/util";
import database from "../database.mjs";
import setENV from "../function/setENV.mjs";
import { parseOrder } from "../function/order.mjs";

export const SETTINGS_PATH = "/wyy-settings";
const SETTINGS_URL = `https://music.163.com${SETTINGS_PATH}`;
/**
 * 侧边栏入口：与同一侧边栏里「商城」等服务项一样，用 orpheus://openurl 在 App 内网页打开；
 * bgcolor 同样沿用那些入口的写法，取原生设置页的背景色，让导航栏与页面底色一致。
 */
export const SETTINGS_ENTRY = {
  name: "去广告设置",
  url: `orpheus://openurl?url=${encodeURIComponent(SETTINGS_URL)}&bgcolor=f2f6fc`
};

/**
 * 设置项分组。[键, 显示名]。
 * - 默认为开关（开 = 1）；text=true 为文本框；
 * - order=键 为排序列表：items 的原始顺序即默认顺序，值为逗号分隔的 id 串（空 = 默认顺序）。
 */
const GROUPS = [
  {
    title: "底部 Tab",
    hint: "开启即隐藏，重启 App 后生效。",
    items: [["FX", "发现"], ["MY", "漫游"], ["DT", "笔记"], ["GZ", "关注"], ["SOU", "搜索"]]
  },
  {
    title: "底部 Tab 名称",
    hint: "留空保持原名。",
    text: true,
    items: [["SY_NAME", "首页"], ["SOU_NAME", "搜索"], ["DT_NAME", "笔记"], ["WD_NAME", "我的"], ["MY_NAME", "漫游"], ["FX_NAME", "发现"]]
  },
  {
    title: "底部 Tab 顺序",
    hint: "越靠上越靠左，重启 App 后生效。",
    order: "BOTTOM_ORDER",
    items: [["首页", "首页"], ["搜索", "搜索"], ["笔记", "笔记"], ["我的", "我的"]]
  },
  {
    title: "顶部 Tab",
    hint: "开启即显示；推荐始终显示，福利和 AI写歌始终隐藏。",
    items: [["XD", "心动"], ["YY", "音乐"], ["BK", "播客"], ["TS", "听书"], ["HDTAB", "活动 Tab"]]
  },
  {
    title: "顶部 Tab 名称",
    hint: "留空保持原名，重启 App 后生效。",
    text: true,
    items: [["XD_NAME", "心动"], ["TJ_NAME", "推荐"], ["YY_NAME", "音乐"], ["BK_NAME", "播客"], ["TS_NAME", "听书"]]
  },
  {
    title: "顶部 Tab 顺序",
    hint: "越靠上越靠左，重启 App 后生效。",
    order: "TOP_ORDER",
    items: [["fastPlay", "心动"], ["rcmd", "推荐"], ["music", "音乐"], ["podcast", "播客"], ["vBook", "听书"]]
  },
  {
    title: "首页卡片",
    hint: "开启即显示，下拉刷新后生效。",
    items: [
      ["PRGG", "问候语"], ["PRDRD", "每日推荐"], ["PRSCVPT", "推荐歌单"], ["PRST", "最近常听"],
      ["HMPR", "音乐合伙人"], ["PRRR", "雷达歌单"], ["PRRK", "排行榜"], ["PRMST", "推荐专属歌单"],
      ["PRCN", "你的专属歌单"], ["PRPRS", "私房推荐歌曲"], ["PRRSS", "红心相似歌曲"]
    ]
  }
];

/** 键 → { kind: switch | text | order, allowed?: 排序列表允许的 id }。 */
const FIELDS = new Map(
  GROUPS.flatMap(g =>
    g.order
      ? [[g.order, { kind: "order", allowed: g.items.map(([id]) => id) }]]
      : g.items.map(([k]) => [k, { kind: g.text ? "text" : "switch" }])
  )
);

const NAME_MAX = 16;

const esc = s =>
  String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// 注意：iOS 对字号 < 16px 的输入框聚焦时会自动放大整个页面，所以文本框的字号必须是 16px，
// 再用 scale(.8) 缩回到原生页面「值」文字的观感（约 12.8px），宽度同步放大 1/.8 抵消缩小。
const CSS = `
:root{color-scheme:light dark;--bg:#f2f6fc;--card:#fff;--text:#0c0d18;--sub:#89898b;--hd:#737375;--val:#939393;--line:#f1f1f1;--on:#fe393e;--off:#c5c4c7;--chip:#f2f6fc}
@media(prefers-color-scheme:dark){:root{--bg:#0d0e10;--card:#1b1c1f;--text:#f2f2f4;--sub:#8b8b90;--hd:#8b8b90;--val:#8b8b90;--line:#2a2b2e;--off:#48484d;--chip:#2a2b2e}}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{margin:0;padding:0 16px 40px;background:var(--bg);color:var(--text);font:15px/1.4 -apple-system,"PingFang SC",sans-serif}
.card{margin-top:16px;background:var(--card);border-radius:8px;overflow:hidden}
.hd{display:flex;align-items:center;height:38px;padding:0 16px;font-size:11.5px;color:var(--hd);border-bottom:1px solid var(--line)}
ul{margin:0;padding:0;list-style:none}
li{display:flex;align-items:center;justify-content:space-between;min-height:48px;padding:0 12px 0 16px}
p{margin:8px 16px 0;font-size:11px;color:var(--sub)}
input[type=text]{width:calc(55% / .8);border:0;outline:0;background:none;text-align:right;font:inherit;font-size:16px;color:var(--val);transform:scale(.8);transform-origin:right center}
input[type=text]::placeholder{color:var(--val);opacity:.6}
input[type=checkbox]{appearance:none;-webkit-appearance:none;position:relative;flex:none;width:50px;height:22px;margin:0;border-radius:11px;background:var(--off);transition:background .2s}
input[type=checkbox]::after{content:"";position:absolute;top:2px;left:2px;width:26px;height:18px;border-radius:9px;background:#fff;box-shadow:0 0 0 .5px rgba(0,0,0,.06);transition:transform .2s}
input[type=checkbox]:checked{background:var(--on)}
input[type=checkbox]:checked::after{transform:translateX(20px)}
.mv{display:flex;gap:4px}
.mv button{width:36px;height:28px;border:0;border-radius:6px;background:var(--chip);color:var(--text);font:inherit;font-size:14px}
.mv button:active{opacity:.5}
ul li:first-child .up,ul li:last-child .dn{opacity:.25}
#reset{display:block;width:100%;height:48px;margin-top:16px;padding:0;border:0;border-radius:8px;background:var(--card);color:var(--on);font:inherit}
#t{position:fixed;left:50%;bottom:36px;transform:translateX(-50%);padding:8px 16px;border-radius:16px;background:rgba(60,60,60,.92);color:#fff;font-size:14px;opacity:0;transition:opacity .2s;pointer-events:none}
#t.show{opacity:1}`;

const JS = `
var t=document.getElementById("t");
function tip(m){t.textContent=m;t.className="show";clearTimeout(tip.h);tip.h=setTimeout(function(){t.className=""},1200)}
function call(q,cb){fetch("${SETTINGS_PATH}/"+q,{headers:{"x-wyy":"1"}}).then(function(r){return r.json()}).then(function(j){cb(!!j.ok)}).catch(function(){cb(false)})}
function save(k,v,cb){call("set?k="+encodeURIComponent(k)+"&v="+encodeURIComponent(v),function(ok){tip(ok?"已保存":"保存失败");cb&&cb(ok)})}
document.querySelectorAll("input[type=checkbox]").forEach(function(e){e.addEventListener("change",function(){save(e.dataset.k,e.checked?1:0,function(ok){if(!ok)e.checked=!e.checked})})});
document.querySelectorAll("input[type=text]").forEach(function(e){e.addEventListener("change",function(){save(e.dataset.k,e.value)})});
document.querySelectorAll("ul[data-order] button").forEach(function(b){b.addEventListener("click",function(){
var li=b.closest("li"),ul=li.parentNode,up=b.className==="up",other=up?li.previousElementSibling:li.nextElementSibling;
if(!other)return;
ul.insertBefore(li,up?other:other.nextSibling);
save(ul.dataset.order,Array.prototype.map.call(ul.children,function(x){return x.dataset.id}).join(","))})});
var r=document.getElementById("reset"),armed=false;
r.addEventListener("click",function(){if(!armed){armed=true;r.textContent="再点一次确认恢复默认";setTimeout(function(){armed=false;r.textContent="恢复默认"},3000);return}call("reset",function(ok){if(ok)location.reload();else tip("操作失败")})});`;

function row([key, label], text, values) {
  const control = text
    ? `<input type="text" data-k="${key}" maxlength="${NAME_MAX}" placeholder="原名" value="${esc(values[key] ?? "")}">`
    : `<input type="checkbox" data-k="${key}"${values[key] === 1 ? " checked" : ""}>`;
  return `<li><span>${esc(label)}</span>${control}</li>`;
}

function orderList(g, values) {
  const names = new Map(g.items);
  const ids = parseOrder(values[g.order], g.items.map(([id]) => id));
  const rows = ids
    .map(id => `<li data-id="${esc(id)}"><span>${esc(names.get(id))}</span><span class="mv"><button class="up">↑</button><button class="dn">↓</button></span></li>`)
    .join("");
  return `<ul data-order="${g.order}">${rows}</ul>`;
}

function renderPage(values) {
  const sections = GROUPS.map(g => {
    const body = g.order ? orderList(g, values) : `<ul>${g.items.map(i => row(i, g.text, values)).join("")}</ul>`;
    return `<section class="card"><div class="hd">${esc(g.title)}</div>${body}</section><p>${esc(g.hint)}</p>`;
  }).join("");
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${SETTINGS_ENTRY.name}</title><style>${CSS}</style></head><body>${sections}<button id="reset">恢复默认</button><div id="t"></div><script>${JS}</script></body></html>`;
}

/** 解析 URL 的路径与查询参数（不依赖 URL 对象，各平台行为一致）。 */
function parseUrl(url) {
  const m = String(url).match(/^https?:\/\/[^/]+(\/[^?#]*)(?:\?([^#]*))?/);
  const query = {};
  for (const kv of (m?.[2] ?? "").split("&")) {
    if (!kv) continue;
    const i = kv.indexOf("=");
    const dec = s => decodeURIComponent(s.replace(/\+/g, " "));
    query[dec(i < 0 ? kv : kv.slice(0, i))] = i < 0 ? "" : dec(kv.slice(i + 1));
  }
  return { path: m?.[1] ?? "", query };
}

function hasHeader($request, name) {
  return Object.keys($request.headers ?? {}).some(k => k.toLowerCase() === name);
}

const reply = (status, type, body) => ({
  status,
  headers: { "Content-Type": `${type};charset=utf-8`, "Cache-Control": "no-store" },
  body
});
const json = (status, obj) => reply(status, "application/json", JSON.stringify(obj));

/** 校验并规范化要写入的值；不合法返回 null。 */
function normalize(field, v) {
  switch (field.kind) {
    case "switch":
      return v === "0" || v === "1" ? v : null;
    case "text":
      return v.trim().slice(0, NAME_MAX);
    default: {
      const ids = v.split(",");
      const valid = new Set(ids).size === ids.length && ids.every(id => field.allowed.includes(id));
      return valid ? v : null;
    }
  }
}

/**
 * 请求阶段入口：返回设置页或处理写入。写入接口要求自定义请求头 x-wyy，
 * 避免被别的网页用 <img> / 表单跨站触发。
 */
export async function SettingsPage($request) {
  let route;
  try {
    route = parseUrl($request.url);
  } catch {
    return json(400, { ok: false });
  }
  const sub = route.path.slice(SETTINGS_PATH.length);

  if (sub === "" || sub === "/") return reply(200, "text/html", renderPage(setENV(database)));
  if (!hasHeader($request, "x-wyy")) return json(403, { ok: false });

  if (sub === "/set") {
    const { k, v = "" } = route.query;
    const field = FIELDS.get(k);
    const value = field && normalize(field, v);
    if (value === null || value === undefined) return json(400, { ok: false });
    Storage.setItem(`wyy_${k}`, value);
    return json(200, { ok: true });
  }
  if (sub === "/reset") {
    // 写空串 = 清除覆盖（setENV 忽略空值）；removeItem 并非所有平台都支持
    for (const k of FIELDS.keys()) Storage.setItem(`wyy_${k}`, "");
    return json(200, { ok: true });
  }
  return json(404, { ok: false });
}
