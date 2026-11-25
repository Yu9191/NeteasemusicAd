/** Tab 顺序：逗号分隔的 id 串，空串 = 保持原顺序。 */

/** 解析顺序串为完整 id 列表：合法 id 在前（去重），缺的按 defaults 补在后面。 */
export function parseOrder(order, defaults) {
  const picked = typeof order === "string" && order ? order.split(",").filter((id, i, a) => defaults.includes(id) && a.indexOf(id) === i) : [];
  return [...picked, ...defaults.filter(id => !picked.includes(id))];
}

/** 按顺序串稳定重排；不在串里的排最后，保持原顺序。keyOf 取每项的 id。 */
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
