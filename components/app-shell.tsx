"use client";

import { usePathname } from "next/navigation";
import { AppSidebar, currentNavItem } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export function AppShell({
  companyName,
  children,
}: {
  companyName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "/";
  const current = currentNavItem(pathname);

  return (
    <SidebarProvider>
      <AppSidebar companyName={companyName} />
      <SidebarInset>
        <header className="no-print flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{current?.label || "CV Rizky"}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex min-w-0 flex-1 flex-col px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 print:p-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
