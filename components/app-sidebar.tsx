"use client";

import Link from "next/link";
import { logout } from "@/app/actions-auth";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  ClipboardList,
  FileText,
  Landmark,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Wallet,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Operasi",
    items: [
      { href: "/", label: "Ringkasan", icon: LayoutDashboard },
      { href: "/order", label: "Order masuk", icon: ClipboardList },
      { href: "/pelanggan", label: "Perusahaan", icon: Building2 },
      { href: "/barang", label: "Barang & stok", icon: Package },
    ],
  },
  {
    label: "Administrasi",
    items: [
      { href: "/dokumen", label: "Dokumen", icon: FileText },
      { href: "/bank", label: "Bank", icon: Landmark },
      { href: "/keuangan", label: "Keuangan", icon: Wallet },
      { href: "/pengaturan", label: "Pengaturan", icon: Settings },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

export function currentNavItem(pathname: string) {
  return NAV_ITEMS.find((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
  );
}

export function AppSidebar({ companyName }: { companyName: string }) {
  const pathname = usePathname() ?? "/";
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <Sidebar variant="inset" collapsible="icon" className="no-print">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip={companyName}>
              <Link href="/">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                  R
                </span>
                <span className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">CV Rizky</span>
                  <span className="truncate text-xs text-muted-foreground">Percetakan & pengadaan</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active =
                    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.label}
                      >
                        <Link
                          href={item.href}
                          onClick={() => {
                            if (isMobile) setOpenMobile(false);
                          }}
                        >
                          <Icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Keluar" onClick={() => logout()}>
              <LogOut />
              <span>Keluar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <p className="px-2 pb-1 text-[11px] leading-4 text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
          Harga item bisa berbeda per perusahaan.
        </p>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
