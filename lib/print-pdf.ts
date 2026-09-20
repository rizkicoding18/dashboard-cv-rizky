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
  return CHROME_CANDIDATES.find((candidate) => existsSync(candidate));
}

async function fontFace(family: string, relative: string, style: string, weight: string) {
  const file = await readFile(path.join(FONT_ROOT, relative));
  return `@font-face{font-family:"${family}";src:url(data:font/woff2;base64,${file.toString("base64")}) format("woff2");font-weight:${weight};font-style:${style};font-display:swap;}`;
}

export async function renderDocumentPdf(node: ReactElement) {
  const css = await readFile(path.join(process.cwd(), "components/document-sheet.css"), "utf8");
  const logo = await readFile(path.join(process.cwd(), "public/logo/logo.png"));
  const dataUri = `data:image/png;base64,${logo.toString("base64")}`;
  const faces = (
    await Promise.all([
      fontFace("GeistSans", "geist-sans/Geist-Variable.woff2", "normal", "100 900"),
      fontFace("GeistSans", "geist-sans/Geist-Italic[wght].woff2", "italic", "100 900"),
      fontFace("GeistMono", "geist-mono/GeistMono-Variable.woff2", "normal", "100 900"),
    ])
  ).join("");
  const { renderToStaticMarkup } = require("react-dom/server") as typeof import("react-dom/server");
  const markup = renderToStaticMarkup(node).replaceAll("/logo/logo.png", dataUri);
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<style>
${faces}
${css}
@page { size: A4; margin: 12mm; }
html, body { margin: 0; background: #fff; font-family: GeistSans, ui-sans-serif, sans-serif; }
.doc-sheet {
  max-width: none;
  box-shadow: none;
  padding: 0;
  font-family: GeistSans, ui-sans-serif, sans-serif;
}
.doc-number { font-family: GeistMono, ui-monospace, monospace; }
</style>
</head>
<body>${markup}</body>
</html>`;

  const chrome = chromePath();
  if (!chrome) {
    throw new Error("Chrome tidak ditemukan. Pasang Google Chrome untuk mengunduh PDF.");
  }

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
