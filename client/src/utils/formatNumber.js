export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return "0";
  const n = Number(num);
  if (n >= 1000000) {
    return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (n >= 1000) {
    return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return n.toString();
}

export function formatPercentage(num) {
  if (num === null || num === undefined || isNaN(num)) return "0%";
  return Number(num).toFixed(1) + "%";
}
