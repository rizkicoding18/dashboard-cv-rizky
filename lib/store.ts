import { requireSession } from "@/lib/auth";
import { createSeed } from "@/lib/seed";
import { loadLegacyJson, loadSqlDatabase, saveSqlDatabase } from "@/lib/sql";
import type { Database } from "@/lib/types";

let writeChain = Promise.resolve();

function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const run = writeChain.then(work, work);
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function migrate(db: Database): Database {
  if (!Array.isArray(db.suratJalans)) db.suratJalans = [];
  if (!Array.isArray(db.quotations)) db.quotations = [];
  if (!Array.isArray(db.banks)) db.banks = [];
  for (const invoice of db.invoices) {
    if (!invoice.fakturNumber) {
      invoice.fakturNumber = invoice.number.replace(/^INV\b/, "FKT");
    }
    if (invoice.bankId === undefined) invoice.bankId = null;
  }
  if (!db.banks.length && db.profile.bankAccount) {
    db.banks.push({
      id: "bnk_default",
      bankName: db.profile.bankName || "Bank",
      accountNumber: db.profile.bankAccount,
      holder: db.profile.bankHolder || db.profile.name,
      isDefault: true,
      notes: "",
    });
  }
  if (db.banks.length && !db.banks.some((bank) => bank.isDefault)) {
    db.banks[0].isDefault = true;
  }
  return db;
}

async function ensureDb(): Promise<Database> {
  const existing = await loadSqlDatabase();
  if (existing) return migrate(existing);

  const imported = await loadLegacyJson();
  const db = migrate(imported ?? createSeed());
  await saveSqlDatabase(db);
  return db;
}

export async function readDb(): Promise<Database> {
  return enqueue(() => ensureDb());
}

export async function updateDb<T>(mutator: (db: Database) => T | Promise<T>): Promise<T> {
  await requireSession();
  return enqueue(async () => {
    const db = await ensureDb();
    const result = await mutator(db);
    await saveSqlDatabase(db);
    return result;
  });
}

export async function replaceDb(next: Database) {
  await requireSession();
  return enqueue(async () => {
    await saveSqlDatabase(migrate(next));
  });
}
