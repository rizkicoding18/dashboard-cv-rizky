import Link from "next/link";
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
  Table,
  TableBody,
  TableHeader,
  TableRow,
  Td,
  Th,
} from "@/components/shared";
import { readDb } from "@/lib/store";

export default async function BankPage() {
  const db = await readDb();
  const rows = db.banks;

  return (
    <div>
      <PageHeader
        eyebrow="Keuangan"
        title="Rekening bank"
        description="Rekening ini dipakai sebagai tujuan pembayaran di invoice dan faktur."
        actions={<ButtonLink href="/bank/baru">Tambah rekening</ButtonLink>}
      />
      {rows.length === 0 ? (
        <Card>
          <EmptyState
            title="Belum ada rekening"
            description="Tambahkan rekening usaha agar nomor rekening tampil di invoice."
            action={<ButtonLink href="/bank/baru">Tambah rekening</ButtonLink>}
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {rows.map((bank) => (
              <Link key={bank.id} href={`/bank/${bank.id}`}>
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{bank.bankName}</p>
                      <p className="mt-1 font-mono text-sm">{bank.accountNumber}</p>
                      <p className="mt-1 text-sm text-muted-foreground">a.n. {bank.holder}</p>
                    </div>
                    {bank.isDefault ? <Badge>Default</Badge> : null}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <Th>Bank</Th>
                  <Th>No. rekening</Th>
                  <Th>Atas nama</Th>
                  <Th>Status</Th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((bank) => (
                  <TableRow key={bank.id}>
                    <Td>
                      <Link href={`/bank/${bank.id}`} className="font-medium">
                        {bank.bankName}
                      </Link>
                      {bank.notes ? <p className="text-xs text-muted-foreground">{bank.notes}</p> : null}
                    </Td>
                    <Td className="font-mono">{bank.accountNumber}</Td>
                    <Td>{bank.holder}</Td>
                    <Td>{bank.isDefault ? <Badge>Default</Badge> : "—"}</Td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
