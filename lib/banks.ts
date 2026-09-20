import type { BankAccount, Database } from "@/lib/types";

export function resolveBank(db: Database, bankId?: string | null): BankAccount | null {
  const banks = Array.isArray(db.banks) ? db.banks : [];
  if (banks.length) {
    return banks.find((row) => row.id === bankId) || banks.find((row) => row.isDefault) || banks[0];
  }
  if (db.profile.bankAccount) {
    return {
      id: "legacy",
      bankName: db.profile.bankName,
      accountNumber: db.profile.bankAccount,
      holder: db.profile.bankHolder,
      isDefault: true,
      notes: "",
    };
  }
  return null;
}

export function formatBankLine(bank?: BankAccount | null) {
  if (!bank?.accountNumber) return "";
  return `Pembayaran ke ${bank.bankName} ${bank.accountNumber} a.n. ${bank.holder}`;
}

export function formatBankOption(bank: BankAccount) {
  return `${bank.bankName} · ${bank.accountNumber} a.n. ${bank.holder}`;
}

export function syncProfileBank(db: Database) {
  const bank = resolveBank(db, null);
  if (!bank) return;
  db.profile.bankName = bank.bankName;
  db.profile.bankAccount = bank.accountNumber;
  db.profile.bankHolder = bank.holder;
}

export function setDefaultBank(db: Database, id: string) {
  for (const bank of db.banks) bank.isDefault = bank.id === id;
  syncProfileBank(db);
}
