import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { NumberInput } from "@/components/number-input";
import { Badge as UiBadge } from "@/components/ui/badge";
import { Button as UiButton } from "@/components/ui/button";
import { Card as UiCard } from "@/components/ui/card";
import { Input as UiInput } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea as UiTextarea } from "@/components/ui/textarea";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
export type ButtonSize = "sm" | "md";

export const buttonVariant = {
  primary: "default",
  secondary: "secondary",
  ghost: "ghost",
  danger: "destructive",
  outline: "outline",
} as const;

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <UiButton
      variant={buttonVariant[variant]}
      size={size === "sm" ? "sm" : "lg"}
      className={cn(size === "md" && "h-10 px-4", className)}
      {...props}
    />
  );
}

export function Input({ className, type, ...props }: ComponentProps<typeof UiInput>) {
  if (type === "number") {
    return <NumberInput className={cn("h-10 md:text-sm tabular-nums text-right", className)} {...props} />;
  }
  return <UiInput suppressHydrationWarning type={type} className={cn("h-10 md:text-sm", className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: Omit<ComponentProps<"select">, "size">) {
  return (
    <NativeSelect className={cn("w-full min-w-0 [&_select]:h-10", className)} {...props}>
      {children}
    </NativeSelect>
  );
}

export function Textarea({ className, ...props }: ComponentProps<typeof UiTextarea>) {
  return <UiTextarea className={cn("min-h-24", className)} {...props} />;
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label className="text-sm leading-none font-medium" suppressHydrationWarning>
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <UiCard className={cn("gap-0 py-0", className)}>{children}</UiCard>;
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "ok" | "warn" | "bad" | "accent";
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "border-transparent bg-muted text-muted-foreground",
    ok: "border-transparent bg-emerald-50 text-emerald-800",
    warn: "border-transparent bg-amber-50 text-amber-800",
    bad: "border-transparent bg-destructive/10 text-destructive",
    accent: "border-transparent bg-primary/10 text-primary",
  };
  return (
    <UiBadge variant="outline" className={tones[tone]}>
      {children}
    </UiBadge>
  );
}
