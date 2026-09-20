const SATUAN = [
  "",
  "satu",
  "dua",
  "tiga",
  "empat",
  "lima",
  "enam",
  "tujuh",
  "delapan",
  "sembilan",
];

function say(n: number): string {
  if (n < 10) return SATUAN[n];
  if (n === 10) return "sepuluh";
  if (n === 11) return "sebelas";
  if (n < 20) return `${SATUAN[n - 10]} belas`;
  if (n < 100) return `${SATUAN[Math.floor(n / 10)]} puluh ${say(n % 10)}`.trim();
  if (n < 200) return `seratus ${say(n - 100)}`.trim();
  if (n < 1000) return `${SATUAN[Math.floor(n / 100)]} ratus ${say(n % 100)}`.trim();
  if (n < 2000) return `seribu ${say(n - 1000)}`.trim();
  if (n < 1_000_000) {
    return `${say(Math.floor(n / 1000))} ribu ${say(n % 1000)}`.trim();
  }
  if (n < 1_000_000_000) {
    return `${say(Math.floor(n / 1_000_000))} juta ${say(n % 1_000_000)}`.trim();
  }
  if (n < 1_000_000_000_000) {
    return `${say(Math.floor(n / 1_000_000_000))} miliar ${say(n % 1_000_000_000)}`.trim();
  }
  return `${say(Math.floor(n / 1_000_000_000_000))} triliun ${say(n % 1_000_000_000_000)}`.trim();
}

export function terbilang(value: number): string {
  const n = Math.floor(Math.abs(value));
  if (n === 0) return "Nol rupiah";
  const words = say(n).replace(/\s+/g, " ").trim();
  return `${words.charAt(0).toUpperCase()}${words.slice(1)} rupiah`;
}

export function formatRupiah(value: number): string {
  const amount = Math.round(value || 0);
  const sign = amount < 0 ? "-" : "";
  const formatted = Math.abs(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}Rp ${formatted}`;
}

const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const DAYS_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export function formatNumber(value: number): string {
  const n = Number(value) || 0;
  const sign = n < 0 ? "-" : "";
  const [int, frac] = Math.abs(n).toFixed(2).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  if (frac === "00") return `${sign}${grouped}`;
  return `${sign}${grouped},${frac.replace(/0+$/, "")}`;
}

export function parseGroupedNumber(raw: string): number {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return 0;
  const negative = trimmed.startsWith("-");
  const cleaned = trimmed.replace(/[^\d,]/g, "");
  const comma = cleaned.lastIndexOf(",");
  const intPart = (comma >= 0 ? cleaned.slice(0, comma) : cleaned).replace(/\D/g, "");
  const frac = comma >= 0 ? cleaned.slice(comma + 1).replace(/\D/g, "").slice(0, 4) : "";
  const n = Number(frac ? `${intPart || "0"}.${frac}` : intPart || "0");
  if (!Number.isFinite(n)) return 0;
  return negative ? -n : n;
}

export function formatGroupedNumber(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return "";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (decimals > 0) {
    const [int, frac] = abs.toFixed(decimals).split(".");
    const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const trimmed = frac.replace(/0+$/, "");
    return trimmed ? `${sign}${grouped},${trimmed}` : `${sign}${grouped}`;
  }
  return `${sign}${Math.round(abs).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

export function formatGroupedTyping(raw: string, allowDecimal = false): string {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "-") return trimmed === "-" ? "-" : "";
  const negative = trimmed.startsWith("-");
  const sign = negative ? "-" : "";
  if (allowDecimal && trimmed.includes(",")) {
    const body = trimmed.slice(negative ? 1 : 0);
    const [intRaw, ...rest] = body.split(",");
    const intDigits = intRaw.replace(/\D/g, "");
    const frac = rest.join("").replace(/\D/g, "").slice(0, 4);
    const grouped = (intDigits || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const keepComma = body.endsWith(",") || frac.length > 0;
    return `${sign}${grouped}${keepComma ? `,${frac}` : ""}`;
  }
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return sign;
  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return iso;
  return `${day} ${MONTHS_ID[month - 1]} ${year}`;
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${formatDate(iso.slice(0, 10))} ${hours}:${minutes}`;
}

export function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  const tz = date.getTime() - date.getTimezoneOffset() * 60_000;
  return new Date(tz).toISOString().slice(0, 10);
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function currentMonthKey(): string {
  return todayIso().slice(0, 7);
}

export function formatMonth(key: string): string {
  const [year, month] = key.split("-").map(Number);
  if (!year || !month) return key;
  return `${MONTHS_ID[month - 1]} ${year}`;
}

export function dayName(iso: string): string {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return DAYS_ID[date.getDay()];
}
