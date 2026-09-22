import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { promisify } from "node:util";
import { type ReactElement } from "react";

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);
const FONT_ROOT = path.join(process.cwd(), "node_modules/geist/dist/fonts");

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
].filter(Boolean) as string[];

function chromePath() {
  if (process.env.VERCEL) return null;
  return CHROME_CANDIDATES.find((candidate) => existsSync(candidate));
}

async function fontFace(family: string, relative: string, style: string, weight: string) {
  try {
    const file = await readFile(path.join(FONT_ROOT, relative));
    return `@font-face{font-family:"${family}";src:url(data:font/woff2;base64,${file.toString("base64")}) format("woff2");font-weight:${weight};font-style:${style};font-display:swap;}`;
  } catch {
    return "";
  }
}

async function buildHtml(node: ReactElement) {
  const css = await readFile(path.join(process.cwd(), "components/document-sheet.css"), "utf8").catch(
    () => "",
  );
  let dataUri = "";
  try {
    const logo = await readFile(path.join(process.cwd(), "public/logo/logo.png"));
    dataUri = `data:image/png;base64,${logo.toString("base64")}`;
  } catch {
    dataUri = "";
  }
  const faces = (
    await Promise.all([
      fontFace("GeistSans", "geist-sans/Geist-Variable.woff2", "normal", "100 900"),
      fontFace("GeistSans", "geist-sans/Geist-Italic[wght].woff2", "italic", "100 900"),
      fontFace("GeistMono", "geist-mono/GeistMono-Variable.woff2", "normal", "100 900"),
    ])
  ).join("");
  const { renderToStaticMarkup } = require("react-dom/server") as typeof import("react-dom/server");
  const markup = dataUri ? renderToStaticMarkup(node).replaceAll("/logo/logo.png", dataUri) : renderToStaticMarkup(node);
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<style>
${faces}
${css}
@page { size: A4; margin: 12mm 12mm 16mm 12mm; }
@page {
  @bottom-center {
    content: "Halaman " counter(page) " dari " counter(pages);
    font-size: 9px;
    color: #78716c;
    font-family: GeistSans, ui-sans-serif, sans-serif;
  }
}
html, body { margin: 0; background: #fff; font-family: GeistSans, ui-sans-serif, sans-serif; }
.doc-sheet {
  width: auto;
  min-width: 0;
  max-width: none;
  box-shadow: none;
  padding: 0;
  font-family: GeistSans, ui-sans-serif, sans-serif;
}
.doc-sheet-invoice { padding: 0 0 0 8px; }
.doc-sheet-kwitansi {
  background: linear-gradient(#7a2a32, #7a2a32) left top / 100% 8px no-repeat, #fff;
}
.doc-number { font-family: GeistMono, ui-monospace, monospace; }
.doc-sph-cover { break-after: page; page-break-after: always; }
</style>
</head>
<body>${markup}</body>
</html>`;
}

async function renderWithChrome(html: string, chrome: string) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "cv-rizky-pdf-"));
  const htmlPath = path.join(dir, "doc.html");
  const pdfPath = path.join(dir, "doc.pdf");
  const profileDir = path.join(dir, "chrome-profile");
  await writeFile(htmlPath, html, "utf8");
  try {
    await execFileAsync(
      chrome,
      [
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-crash-reporter",
        "--disable-extensions",
        "--no-pdf-header-footer",
        "--virtual-time-budget=5000",
        `--user-data-dir=${profileDir}`,
        `--print-to-pdf=${pdfPath}`,
        `file://${htmlPath}`,
      ],
      { timeout: 25000 },
    );
    return await readFile(pdfPath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function renderWithChromium(html: string) {
  const chromiumMod = await import("@sparticuz/chromium");
  const puppeteerMod = await import("puppeteer-core");
  const chromium = chromiumMod.default;
  const puppeteer = puppeteerMod.default;
  chromium.setGraphicsMode = false;
  const browser = await puppeteer.launch({
    args: await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
    defaultViewport: { width: 794, height: 1123, deviceScaleFactor: 1 },
    executablePath: await chromium.executablePath(),
    headless: "shell",
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.evaluateHandle("document.fonts.ready").catch(() => undefined);
    return await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
    });
  } finally {
    await browser.close().catch(() => undefined);
  }
}

export async function renderDocumentPdf(node: ReactElement) {
  const html = await buildHtml(node);
  const chrome = chromePath();
  if (chrome) return renderWithChrome(html, chrome);
  try {
    return await renderWithChromium(html);
  } catch (error) {
    console.error("Chromium PDF failed", error);
    throw new Error("Gagal membuat PDF di server. Coba lagi, atau gunakan Cetak dari browser.");
  }
}
