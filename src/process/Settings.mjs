/**
 * 脚本参数合并器。
 * Script settings merger.
 *
 * 合并优先级 / Priority:
 * 1. `$argument` - 模块参数 (Surge/Loon/QuanX 等宿主注入) / Module arguments injected by host.
 * 2. BoxJS 持久化存储，键名前缀 `wyy_` / BoxJS persistent storage with `wyy_` prefix.
 * 3. 默认值 / Built-in defaults.
 *
 * 类型规范 / Type contract:
 * `loadSettings()` 在边界统一类型，避免下游 `==` / `===` 不一致：
 * - 所有数值键 (含开关 0/1) 强制转为 `number`
 * - 所有字符串键 (Tab 自定义名等) 强制转为 `string`
 *
 * `loadSettings()` normalizes types at the boundary so downstream code
 * can use `===` safely:
 * - All numeric keys (including 0/1 switches) are coerced to `number`
 * - All string keys (custom Tab names, etc.) are coerced to `string`
 */
import { $argument, Storage } from "@nsnanocat/util";

/**
 * 所有可配置参数及默认值。
 * All configurable keys and their default values.
 *
 * @type {Record<string, number|string>}
 */
const DEFAULTS = {
  VipEnabled: 1,
  VipLevel: 7,
  GrowthValue: 99999,

  FX: 0, MY: 1, DT: 0, GZ: 1,
  MY_NAME: "", DT_NAME: "", FX_NAME: "",

  AIXG: 0, HDTAB: 0,

  PRGG: 1, PRDRD: 0, PRSCVPT: 0, PRST: 0,
  HMPR: 0, PRRR: 1, PRRK: 0, PRMST: 1, PRCN: 1
};

/**
 * 安全转整数，空值或 NaN 时返回默认值。
 * Safely parse integer, returning default on empty or NaN.
 *
 * @param {*} v - 输入值 / Input value.
 * @param {number} def - 默认值 / Default value.
 * @returns {number}
 */
export function toInt(v, def) {
  if (v === undefined || v === null || v === "") return def;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
}

/**
 * 从 `$argument` 和 BoxJS 持久化存储合并出最终设置，并按默认值类型归一化。
 * Merge final settings from `$argument` and BoxJS storage, normalized by default type.
 *
 * @returns {Record<string, number|string>}
 */
export function loadSettings() {
  const arg = $argument || {};
  const settings = {};

  for (const key of Object.keys(DEFAULTS)) {
    let raw;
    if (arg[key] !== undefined && arg[key] !== "" && arg[key] !== null) {
      raw = arg[key];
    } else {
      const stored = Storage.getItem(`wyy_${key}`, null);
      raw = stored !== null && stored !== "" ? stored : DEFAULTS[key];
    }

    // 按默认值的类型归一化：number → number / string → string
    settings[key] = typeof DEFAULTS[key] === "number" ? toInt(raw, DEFAULTS[key]) : String(raw);
  }

  return settings;
}
