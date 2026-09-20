import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariant, Button, Input, type ButtonSize, type ButtonVariant } from "@/components/form-controls";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export { cn } from "@/lib/utils";
export { Badge, Button, Card, Field, Input, Select, Textarea } from "@/components/form-controls";
export {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
};

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}) {
  const sizeToken = size === "sm" ? "sm" : "lg";
  return (
    <Link
      href={href}
      data-slot="button"
      data-variant={buttonVariant[variant]}
      data-size={sizeToken}
      suppressHydrationWarning
      className={cn(
        buttonVariants({ variant: buttonVariant[variant], size: sizeToken }),
        size === "md" && "h-10 px-4",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-heading text-2xl sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap lg:w-auto [&>a]:w-full sm:[&>a]:w-auto [&>button]:w-full sm:[&>button]:w-auto">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid place-items-center px-6 py-16 text-center">
      <div className="max-w-sm">
        <h3 className="font-heading text-xl">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
      </div>
    </div>
  );
}

export function SearchBar({
  placeholder,
  defaultValue,
}: {
  placeholder: string;
  defaultValue?: string;
}) {
  return (
    <form className="mb-4 flex w-full max-w-md flex-col gap-2 sm:flex-row">
      <Input name="q" defaultValue={defaultValue} placeholder={placeholder} className="flex-1" />
      <Button type="submit" variant="outline" className="shrink-0">
        Cari
      </Button>
    </form>
  );
}

export function TableWrap({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <TableHead className={cn("px-4 text-xs uppercase tracking-wider text-muted-foreground", className)}>{children}</TableHead>;
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <TableCell className={cn("px-4 py-3 whitespace-normal", className)}>{children}</TableCell>;
}
