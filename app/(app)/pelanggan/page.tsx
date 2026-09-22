import {
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
} from "@/components/shared";
import { CustomersTable } from "@/components/tables/list-tables";
import { formatDate } from "@/lib/format";
import { readDb } from "@/lib/store";

export default async function PelangganPage() {
  const db = await readDb();
  const data = db.customers.map((customer) => ({
    id: customer.id,
    href: `/pelanggan/${customer.id}`,
    name: customer.name,
    pic: customer.pic || "—",
    phone: customer.phone || "—",
    specials: `${db.customerPrices.filter((row) => row.customerId === customer.id).length} item`,
    joined: formatDate(customer.createdAt.slice(0, 10)),
  }));

  return (
    <div>
      <PageHeader
        eyebrow="Relasi"
        title="Perusahaan pelanggan"
        description="Setiap perusahaan bisa punya harga sendiri untuk item yang sama."
        actions={<ButtonLink href="/pelanggan/baru">Tambah perusahaan</ButtonLink>}
      />
      {data.length === 0 ? (
        <Card>
          <EmptyState
            title="Belum ada perusahaan"
            description="Tambahkan pelanggan agar harga khusus dan faktur bisa mengikuti nama perusahaan."
            action={<ButtonLink href="/pelanggan/baru">Tambah perusahaan</ButtonLink>}
          />
        </Card>
      ) : (
        <CustomersTable data={data} />
      )}
    </div>
  );
}
