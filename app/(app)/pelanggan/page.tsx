import Link from "next/link";
import {
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
  SearchBar,
  Table,
  TableBody,
  TableHeader,
  TableRow,
  Td,
  Th,
} from "@/components/shared";
import { formatDate } from "@/lib/format";
import { readDb } from "@/lib/store";

export default async function PelangganPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const db = await readDb();
  const rows = db.customers.filter((customer) => {
    const hay = `${customer.name} ${customer.pic} ${customer.address}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <div>
      <PageHeader
        eyebrow="Relasi"
        title="Perusahaan pelanggan"
        description="Setiap perusahaan bisa punya harga sendiri untuk item yang sama."
        actions={<ButtonLink href="/pelanggan/baru">Tambah perusahaan</ButtonLink>}
      />
      <SearchBar placeholder="Cari perusahaan atau PIC" defaultValue={q} />
      {rows.length === 0 ? (
        <Card>
          <EmptyState
            title="Belum ada perusahaan"
            description="Tambahkan pelanggan agar harga khusus dan faktur bisa mengikuti nama perusahaan."
            action={<ButtonLink href="/pelanggan/baru">Tambah perusahaan</ButtonLink>}
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {rows.map((customer) => (
              <Link key={customer.id} href={`/pelanggan/${customer.id}`}>
                <Card className="p-4">
                  <p className="font-medium">{customer.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{customer.pic || "Tanpa PIC"}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {db.customerPrices.filter((row) => row.customerId === customer.id).length} harga khusus
                  </p>
                </Card>
              </Link>
            ))}
          </div>
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <Th>Perusahaan</Th>
                  <Th>PIC</Th>
                  <Th>Telepon</Th>
                  <Th>Harga khusus</Th>
                  <Th>Bergabung</Th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((customer) => (
                  <TableRow key={customer.id}>
                    <Td>
                      <Link href={`/pelanggan/${customer.id}`} className="font-medium">
                        {customer.name}
                      </Link>
                    </Td>
                    <Td>{customer.pic || "—"}</Td>
                    <Td>{customer.phone || "—"}</Td>
                    <Td>
                      {db.customerPrices.filter((row) => row.customerId === customer.id).length} item
                    </Td>
                    <Td>{formatDate(customer.createdAt.slice(0, 10))}</Td>
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
