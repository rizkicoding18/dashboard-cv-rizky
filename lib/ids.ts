export function createId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  const time = Date.now().toString(36);
  return `${prefix}_${time}${rand}`;
}

export function nextNumber(
  prefix: string,
  existing: string[],
  date = new Date(),
): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const head = `${prefix}/${year}/${month}/`;
  const seqs = existing
    .filter((value) => value.startsWith(head))
    .map((value) => Number(value.slice(head.length)))
    .filter((value) => Number.isFinite(value));
  const next = (seqs.length ? Math.max(...seqs) : 0) + 1;
  return `${head}${String(next).padStart(4, "0")}`;
}
