"use client";

import { useEffect, useRef, useState } from "react";

interface ChatMessage {
  role: "bot" | "user";
  text: string;
  attachment?: { name: string; url: string; type: string };
  timestamp: string;
}

interface SimulatorCustomer {
  phone: string;
  label: string;
}

const FALLBACK_CUSTOMERS: SimulatorCustomer[] = [
  { phone: "+919876543210", label: "Vikram Patel (4B)" },
  { phone: "+919123456789", label: "Sneha Reddy (12A)" },
];

export function WhatsAppChat() {
  const [customers, setCustomers] = useState<SimulatorCustomer[]>(FALLBACK_CUSTOMERS);
  const [phone, setPhone] = useState(FALLBACK_CUSTOMERS[0].phone);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetch("/api/bot/customers")
      .then((res) => res.json())
      .then((data) => {
        if (data.customers?.length) {
          const list = data.customers.map(
            (c: { phone: string; label: string }) => ({
              phone: c.phone,
              label: c.label,
            })
          );
          setCustomers(list);
          setPhone((current) =>
            list.some((c: SimulatorCustomer) => c.phone === current)
              ? current
              : list[0].phone
          );
        }
      })
      .catch(() => {
        /* keep fallback */
      });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendText(text: string) {
    if (!text.trim() || sending) return;
    setSending(true);
    const res = await fetch("/api/bot/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, text }),
    });
    const data = await res.json();
    setMessages((prev) => [...prev, ...data.messages]);
    setSending(false);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const t = input;
    setInput("");
    await sendText(t);
  }

  async function resetChat() {
    await fetch("/api/bot/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    setMessages([]);
    await sendText("Hi");
  }

  useEffect(() => {
    if (!phone) return;
    setMessages([]);
    void (async () => {
      await fetch("/api/bot/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const res = await fetch("/api/bot/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, text: "Hi" }),
      });
      const data = await res.json();
      setMessages(data.messages);
    })();
  }, [phone]);

  return (
    <div className="mx-auto max-w-md overflow-hidden rounded-2xl shadow-xl">
      <div
        className="flex items-center gap-3 px-4 py-3 text-white"
        style={{ background: "var(--whatsapp-header)" }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg">
          🏢
        </div>
        <div className="flex-1">
          <p className="font-semibold">Prestige Estates</p>
          <p className="text-xs opacity-90">Business · Online</p>
        </div>
      </div>

      <div
        className="flex flex-col gap-3 px-3 py-4"
        style={{
          background: "#e5ddd5",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cdc4' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          minHeight: "420px",
          maxHeight: "480px",
          overflowY: "auto",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={`${m.timestamp}-${i}`}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm shadow-sm ${
                m.role === "user"
                  ? "rounded-tr-none text-slate-900"
                  : "rounded-tl-none bg-white text-slate-800"
              }`}
              style={
                m.role === "user"
                  ? { background: "var(--whatsapp-bubble)" }
                  : undefined
              }
            >
              <p className="whitespace-pre-wrap">{m.text}</p>
              {m.attachment && (
                <a
                  href={m.attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 flex items-center gap-2 rounded border border-slate-200 bg-slate-50 p-2 text-teal-800 hover:bg-slate-100"
                >
                  <span className="text-xl">📄</span>
                  <span className="truncate text-xs font-medium">
                    {m.attachment.name}
                  </span>
                </a>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="flex gap-2 border-t border-slate-200 bg-[#f0f0f0] p-2"
      >
        <input
          className="flex-1 rounded-full border-0 bg-white px-4 py-2 text-sm shadow-inner outline-none"
          placeholder="Type a message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--whatsapp-header)" }}
        >
          Send
        </button>
      </form>

      <div className="space-y-2 border-t border-slate-200 bg-white p-3 text-xs">
        <label className="block font-medium text-slate-600">
          Simulate as customer ({customers.length} in database)
        </label>
        <select
          className="input text-sm"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        >
          {customers.map((d) => (
            <option key={d.phone} value={d.phone}>
              {d.label} — {d.phone}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2">
          {["1", "482916", "Sale Agreement", "2", "menu"].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => sendText(q)}
              className="rounded-full bg-slate-100 px-2 py-1 text-slate-700 hover:bg-slate-200"
            >
              {q}
            </button>
          ))}
          <button
            type="button"
            onClick={resetChat}
            className="rounded-full bg-red-50 px-2 py-1 text-red-700 hover:bg-red-100"
          >
            Reset
          </button>
        </div>
        <p className="text-[var(--muted)]">
          Demo OTP: <strong>482916</strong> · New customers from the portal appear
          here automatically after refresh.
        </p>
      </div>
    </div>
  );
}
