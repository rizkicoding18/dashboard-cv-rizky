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
import { PAYEE_KIND_LABEL } from "@/lib/payroll";
import { readDb } from "@/lib/store";

export default async function PenerimaPage() {
  const db = await readDb();
  const rows = db.payees;

  return (
    <div>
      <PageHeader
        eyebrow="Penggajian"
        title="Penerima upah & vendor"
        description="Pekerja dihitung per volume. Vendor adalah perusahaan luar yang mengirim nota desain, cetak, atau pekerjaan lain."
        actions={
          <>
            <ButtonLink href="/gaji" variant="outline">
              Kembali
            </ButtonLink>
            <ButtonLink href="/gaji/penerima/baru">Tambah penerima</ButtonLink>
          </>
        }
      />
      {rows.length === 0 ? (
        <Card>
          <EmptyState
            title="Belum ada penerima"
            description="Tambah orang yang mengerjakan, atau perusahaan luar yang memberi nota."
            action={<ButtonLink href="/gaji/penerima/baru">Tambah penerima</ButtonLink>}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="grid gap-3 p-4 md:hidden">
            {rows.map((row) => (
              <Link key={row.id} href={`/gaji/penerima/${row.id}`} className="rounded-xl border border-border p-3">
                <p className="font-medium">{row.name}</p>
                <p className="text-xs text-muted-foreground">{PAYEE_KIND_LABEL[row.kind]}</p>
              </Link>
            ))}
          </div>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <Th>Nama</Th>
                  <Th>Jenis</Th>
                  <Th>Telepon</Th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <Td>
                      <Link href={`/gaji/penerima/${row.id}`} className="font-medium text-primary">
                        {row.name}
                      </Link>
                      {row.notes ? <p className="text-xs text-muted-foreground">{row.notes}</p> : null}
                    </Td>
                    <Td>
                      <Badge tone="neutral">{PAYEE_KIND_LABEL[row.kind]}</Badge>
                    </Td>
                    <Td>{row.phone || "—"}</Td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
