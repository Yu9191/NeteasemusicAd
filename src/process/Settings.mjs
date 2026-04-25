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

  FX: 0, MY: 1, DT: 0, GZ: 1, SOU: 1,
  MY_NAME: "", DT_NAME: "", FX_NAME: "", SY_NAME: "", WD_NAME: "",

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
  // 真布尔（BoxJS boolean type 直接存 true/false）
  // Real boolean (BoxJS `boolean` type stores actual true/false).
  if (v === true) return 1;
  if (v === false) return 0;
  // 字符串布尔（Loon switch 注入的是 "true"/"false"，QX/Surge 也偶发）
  // String booleans (Loon switch injects literal "true"/"false"; QX/Surge see them too).
  if (typeof v === "string") {
    const t = v.trim().toLowerCase();
    if (t === "true") return 1;
    if (t === "false") return 0;
  }
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
    const argVal = arg[key];
    const isStringKey = typeof DEFAULTS[key] === "string";
    // Loon 等宿主在用户留空 input 时可能不替换占位符，把字面 `{KEY}` 当成有效值传进来。
    // Loon (and similar hosts) may leave the literal placeholder `{KEY}` when the user
    // leaves an input blank; treat that as unset.
    const isPlaceholder = typeof argVal === "string" && argVal === `{${key}}`;
    // Surge / QX 约定字符串字段（如自定义 Tab 名）默认值 `0` 表示"未填写"。
    // Surge / QX use `0` as the "unset" sentinel for string fields like custom Tab names.
    const isZeroSentinel = isStringKey && (argVal === "0" || argVal === 0);
    if (
      argVal !== undefined &&
      argVal !== "" &&
      argVal !== null &&
      !isPlaceholder &&
      !isZeroSentinel
    ) {
      raw = argVal;
    } else {
      const stored = Storage.getItem(`wyy_${key}`, null);
      // BoxJS 持久化的字符串字段也可能存了 "0"，同样视作未设置。
      const storedIsZero = isStringKey && stored === "0";
      raw = stored !== null && stored !== "" && !storedIsZero ? stored : DEFAULTS[key];
    }

    // 按默认值的类型归一化：number → number / string → string
    settings[key] = typeof DEFAULTS[key] === "number" ? toInt(raw, DEFAULTS[key]) : String(raw);
  }

  return settings;
}
