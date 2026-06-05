"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type AgentOption = {
  id: string;
  name: string;
  phone?: string | null;
};

interface AgentSearchSelectProps {
  agents: AgentOption[];
  value: string;
  onChange: (agentId: string) => void;
  label?: string;
  placeholder?: string;
  optional?: boolean;
  required?: boolean;
  disabled?: boolean;
}

export function AgentSearchSelect({
  agents,
  value,
  onChange,
  label = "Sales agent",
  placeholder = "Search agent name…",
  optional = false,
  required = false,
  disabled = false,
}: AgentSearchSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const selected = agents.find((a) => a.id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return agents;
    return agents.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.phone?.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ?? false)
    );
  }, [agents, query]);

  useEffect(() => {
    if (!open) {
      setQuery(selected?.name ?? "");
    }
  }, [selected, open]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(agent: AgentOption) {
    onChange(agent.id);
    setQuery(agent.name);
    setOpen(false);
  }

  function clear() {
    onChange("");
    setQuery("");
    setOpen(false);
  }

  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">
        {label}
        {required && " *"}
        {optional && !required && (
          <span className="font-normal text-[var(--muted)]"> (optional)</span>
        )}
      </span>
      <div ref={wrapRef} className="relative">
        <div className="flex gap-2">
          <input
            className="input flex-1"
            value={query}
            placeholder={placeholder}
            disabled={disabled}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              if (!e.target.value.trim()) onChange("");
            }}
            onFocus={() => setOpen(true)}
            autoComplete="off"
          />
          {optional && value && (
            <button
              type="button"
              className="btn-secondary shrink-0 px-3 text-sm"
              onClick={clear}
              disabled={disabled}
            >
              Clear
            </button>
          )}
        </div>
        {open && !disabled && (
          <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-[var(--muted)]">No agents match</li>
            ) : (
              filtered.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-teal-50 ${
                      a.id === value ? "bg-teal-50 font-medium text-teal-900" : ""
                    }`}
                    onClick={() => pick(a)}
                  >
                    {a.name}
                    {a.phone ? (
                      <span className="ml-2 text-[var(--muted)]">{a.phone}</span>
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </label>
  );
}
