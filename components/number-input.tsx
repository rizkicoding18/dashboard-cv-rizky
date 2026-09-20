"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";
import { Input as UiInput } from "@/components/ui/input";
import { formatGroupedNumber, formatGroupedTyping, parseGroupedNumber } from "@/lib/format";

type Props = Omit<ComponentProps<"input">, "type" | "inputMode">;

function decimalsFromStep(step: Props["step"]) {
  if (step == null || step === "any") return 0;
  const text = String(step);
  const dot = text.indexOf(".");
  return dot >= 0 ? text.length - dot - 1 : 0;
}

function toNumber(raw: string | number | readonly string[] | undefined) {
  if (raw == null || raw === "") return 0;
  return parseGroupedNumber(String(raw));
}

export function NumberInput({
  name,
  value,
  defaultValue,
  min,
  max,
  step,
  required,
  onChange,
  onBlur,
  onFocus,
  className,
  ...props
}: Props) {
  const fallbackId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const decimals = decimalsFromStep(step);
  const allowDecimal = decimals > 0;
  const isControlled = value !== undefined;

  const [focused, setFocused] = useState(false);
  const [text, setText] = useState(() => {
    const initial = value ?? defaultValue;
    if (initial == null || initial === "") return "";
    return formatGroupedNumber(toNumber(initial), decimals);
  });

  useEffect(() => {
    if (focused || !isControlled) return;
    if (value == null || value === "") {
      setText("");
      return;
    }
    setText(formatGroupedNumber(toNumber(value), decimals));
  }, [decimals, focused, isControlled, value]);

  useEffect(() => {
    const input = wrapRef.current?.querySelector("input:not([type=hidden])");
    const form = input instanceof HTMLInputElement ? input.form : null;
    if (!form || isControlled) return;
    function handleReset() {
      const initial = defaultValue;
      setText(initial == null || initial === "" ? "" : formatGroupedNumber(toNumber(initial), decimals));
    }
    form.addEventListener("reset", handleReset);
    return () => form.removeEventListener("reset", handleReset);
  }, [decimals, defaultValue, isControlled]);

  const raw = parseGroupedNumber(text);

  function emit(nextText: string, event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = nextText.trim() === "" || nextText === "-" ? "" : String(parseGroupedNumber(nextText));
    onChange?.({
      ...event,
      target: { ...event.target, name: name || event.target.name, value: nextValue },
      currentTarget: { ...event.currentTarget, name: name || event.currentTarget.name, value: nextValue },
    });
  }

  function clamp(n: number) {
    let next = n;
    if (min != null && min !== "" && next < Number(min)) next = Number(min);
    if (max != null && max !== "" && next > Number(max)) next = Number(max);
    return next;
  }

  return (
    <div ref={wrapRef} className="contents">
      {name ? <input type="hidden" name={name} value={text.trim() === "" ? "" : String(raw)} /> : null}
      <UiInput
        {...props}
        id={props.id || fallbackId}
        type="text"
        inputMode={allowDecimal ? "decimal" : "numeric"}
        autoComplete="off"
        required={required}
        className={className}
        value={text}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          if (text.trim() === "" || text === "-") {
            setText("");
          } else {
            setText(formatGroupedNumber(clamp(raw), decimals));
          }
          onBlur?.(event);
        }}
        onChange={(event) => {
          const next = formatGroupedTyping(event.target.value, allowDecimal);
          setText(next);
          emit(next, event);
        }}
      />
    </div>
  );
}
