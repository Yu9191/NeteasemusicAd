/**
 * 脚本参数合并器。
 *
 * 优先级（后写覆盖前写）：默认值 → $argument → BoxJS。
 * BoxJS 最高，因为 QX/Surge 用户唯一的实际配置 UI 就是 BoxJS。
 *
 * 调试：设置 $argument.LogLevel 或 BoxJS wyy_LogLevel = "debug" 打开 Console.debug。
 */
import { $argument, Console, Lodash as _, Storage } from "@nsnanocat/util";

const DEFAULTS = {
  VipEnabled: 1,
  VipLevel: 7,
  GrowthValue: 99999,

  FX: 0, MY: 1, DT: 0, GZ: 1, SOU: 1,
  MY_NAME: "", DT_NAME: "", FX_NAME: "", SY_NAME: "", WD_NAME: "",

  AIXG: 0, HDTAB: 0,

  PRGG: 1, PRDRD: 0, PRSCVPT: 0, PRST: 0,
  HMPR: 0, PRRR: 1, PRRK: 0, PRMST: 1, PRCN: 1
};

/**
 * 跨平台真假值统一映射。模板参照 `@nsnanocat/util` `polyfill/fetch.mjs` 的 `auto-cookie`。
 *
 * @param {*} v
 * @param {number} def
 * @returns {number}
 */
export function toInt(v, def) {
  if (v === null || v === "") return def;
  switch (v) {
    case true: case "true": case 1: case "1":
      return 1;
    case false: case "false": case 0: case "0": case -1: case "-1":
      return 0;
    case undefined:
      return def;
  }
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
}

/** 过滤掉 $argument 里"未设置"语义的字段（空 / 占位符 / "0" 哨兵）。 */
function pickArgumentOverrides(arg) {
  const out = {};
  for (const key of Object.keys(DEFAULTS)) {
    const v = arg?.[key];
    if (v === undefined || v === null || v === "") continue;
    if (typeof v === "string" && v === `{${key}}`) continue;
    if (typeof DEFAULTS[key] === "string" && (v === "0" || v === 0)) continue;
    out[key] = v;
  }
  return out;
}

/** 读取 BoxJS 中非空的 `wyy_KEY`。 */
function pickBoxJSOverrides() {
  const out = {};
  for (const key of Object.keys(DEFAULTS)) {
    const v = Storage.getItem(`wyy_${key}`, null);
    if (v === null || v === "") continue;
    if (typeof DEFAULTS[key] === "string" && v === "0") continue;
    out[key] = v;
  }
  return out;
}

/**
 * 合并出最终设置并按默认值类型归一化。
 *
 * @returns {Record<string, number|string>}
 */
export function loadSettings() {
  const logLevel = $argument?.LogLevel ?? Storage.getItem("wyy_LogLevel", null);
  if (logLevel) Console.logLevel = logLevel;

  const argOverrides = pickArgumentOverrides($argument || {});
  const boxOverrides = pickBoxJSOverrides();
  const merged = _.merge({}, DEFAULTS, argOverrides, boxOverrides);

  const settings = {};
  for (const key of Object.keys(DEFAULTS)) {
    settings[key] = typeof DEFAULTS[key] === "number"
      ? toInt(merged[key], DEFAULTS[key])
      : String(merged[key] ?? "");
  }

  Console.debug(`[WYY/Settings] argument override: ${JSON.stringify(argOverrides)}`);
  Console.debug(`[WYY/Settings] BoxJS override: ${JSON.stringify(boxOverrides)}`);
  Console.debug(`[WYY/Settings] effective: ${JSON.stringify(settings)}`);

  return settings;
}
