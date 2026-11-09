"use client";

import { useEffect, useRef, useState } from "react";
import { messages } from "../shared/messages/pt-BR";
import { Input } from "@/components/ui/input";

export interface SearchOption {
  value: string;
  label: string;
}

export function FilterSearch({
  label,
  selectedLabel,
  allLabel,
  options,
  onSearch,
  onSelect,
}: {
  label: string;
  selectedLabel: string;
  allLabel: string;
  options: SearchOption[];
  onSearch: (query: string) => Promise<SearchOption[]>;
  onSelect: (value: string) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [items, setItems] = useState(options);

  useEffect(() => {
    setItems(options);
  }, [options]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const timer = window.setTimeout(() => {
      void onSearch(typed).then(setItems);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [open, typed, onSearch]);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={root} className="relative w-56">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <button
        type="button"
        className="mt-1 flex h-8 w-full items-center justify-between rounded-lg border border-input bg-background px-2.5 text-sm"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="truncate">{selectedLabel}</span>
        <span className="text-muted-foreground">▾</span>
      </button>
      {open ? (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover p-1 shadow-md">
          <Input
            autoFocus
            value={typed}
            placeholder={messages.searchPlaceholder}
            onChange={(event) => setTyped(event.target.value)}
            className="mb-1"
          />
          <button
            type="button"
            className="flex w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
            onClick={() => onSelect("")}
          >
            {allLabel}
          </button>
          {items.map((item) => (
            <button
              key={item.value}
              type="button"
              className="flex w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
              onClick={() => onSelect(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
