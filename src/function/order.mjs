/**
 * Tab 顺序工具。顺序以逗号分隔的 id 串保存（空串 = 保持原顺序）。
 */

/**
 * 把设置里的顺序串解析成完整的 id 列表：串里合法的 id 在前（去重），
 * 缺的按 defaults 里的顺序补在后面。
 */
export function parseOrder(order, defaults) {
  const picked = typeof order === "string" && order ? order.split(",").filter((id, i, a) => defaults.includes(id) && a.indexOf(id) === i) : [];
  return [...picked, ...defaults.filter(id => !picked.includes(id))];
}

/**
 * 按顺序串稳定重排 list；不在串里的项排到最后，保持原相对顺序。
 * keyOf 取出每一项对应的 id。
 */
export function sortByOrder(list, order, keyOf) {
  const ids = typeof order === "string" && order ? order.split(",") : [];
  if (!ids.length) return list;
  const rank = item => {
    const i = ids.indexOf(keyOf(item));
    return i < 0 ? ids.length : i;
  };
  return list
    .map((item, idx) => [item, idx])
    .sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1])
    .map(([item]) => item);
}
