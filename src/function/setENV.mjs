/**
 * 合并 database / $argument / BoxJS 三方设置，按优先级与类型规则归一。
 *
 * 优先级（由 $argument.Storage 控制）：
 * - undefined / 默认 : database → $argument → BoxJS  (BoxJS 最高)
 * - "Argument"      : database → BoxJS → $argument  ($argument 最高)
 * - "BoxJs" 等      : database → BoxJS              (忽略 $argument)
 * - "database"      : 仅 database
 *
 * 调试：$argument.LogLevel 或 BoxJS wyy_LogLevel = "debug" 打开 Console.debug。
 */
import { $argument, Console, Lodash as _, Storage } from "@nsnanocat/util";
import { string2number, traverseObject } from "@nsnanocat/util/getStorage.mjs";

function coerce(_key, value) {
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "string") {
    switch (value) {
      case "true": return 1;
      case "false": return 0;
      case "[]": return [];
      default: return string2number(value);
    }
  }
  return value;
}

export function toInt(v, def) {
  if (v === null || v === undefined || v === "") return def;
  const n = coerce("", v);
  return typeof n === "number" && Number.isFinite(n) ? n : def;
}

function pickArgumentOverrides(database, arg) {
  const out = {};
  for (const key of Object.keys(database)) {
    const v = arg?.[key];
    if (v === undefined || v === null || v === "") continue;
    if (typeof v === "string" && v === `{${key}}`) continue;
    if (typeof database[key] === "string" && (v === "0" || v === 0)) continue;
    out[key] = v;
  }
  return out;
}

function pickBoxJSOverrides(database) {
  const out = {};
  for (const key of Object.keys(database)) {
    const v = Storage.getItem(`wyy_${key}`, null);
    if (v === null || v === "") continue;
    if (typeof database[key] === "string" && v === "0") continue;
    out[key] = v;
  }
  return out;
}

export default function setENV(database) {
  Console.debug("☑️ setENV");

  const logLevel = $argument?.LogLevel ?? Storage.getItem("wyy_LogLevel", null);
  if (logLevel) Console.logLevel = logLevel;

  const argOverrides = pickArgumentOverrides(database, $argument || {});
  const boxOverrides = pickBoxJSOverrides(database);

  let Settings;
  switch ($argument?.Storage) {
    case "Argument":
    case "$argument":
      Settings = _.merge({}, database, boxOverrides, argOverrides);
      break;
    case "BoxJs":
    case "boxjs":
    case "PersistentStore":
    case "$persistentStore":
      Settings = _.merge({}, database, boxOverrides);
      break;
    case "database":
      Settings = { ...database };
      break;
    default:
      Settings = _.merge({}, database, argOverrides, boxOverrides);
      break;
  }

  traverseObject(Settings, coerce);

  Console.debug(`[WYY/setENV] $argument override: ${JSON.stringify(argOverrides)}`);
  Console.debug(`[WYY/setENV] BoxJS override: ${JSON.stringify(boxOverrides)}`);
  Console.debug(`[WYY/setENV] Settings: ${JSON.stringify(Settings)}`);
  Console.debug("✅ setENV");

  return Settings;
}
