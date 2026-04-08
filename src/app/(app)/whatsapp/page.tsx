// src/app/(app)/whatsapp/page.tsx
"use client";

import { useState } from "react";

export default function WhatsAppPage() {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  async function handleSend() {
    if (!phone || !message) {
      alert("Preencha telefone e mensagem");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, message }),
      });

      const data = await res.json();

      if (data.ok) {
        const newItem = {
          phone,
          message,
          status: "enviado",
          date: new Date().toLocaleString(),
        };

        setHistory((prev) => [newItem, ...prev]);

        setMessage("");
        alert("Mensagem enviada (ambiente de teste)");
      } else {
        alert("Erro ao enviar");
      }
    } catch (err) {
      alert("Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="rounded-2xl border border-white/10 bg-[#070014] p-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Central do WhatsApp
          </h1>
          <p className="text-white/60 mt-2">
            Gerencie conexão, envios e histórico de mensagens.
          </p>
        </div>

        <span className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-sm">
          Não conectado
        </span>
      </div>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Mensagens enviadas" value={history.length} />
        <MetricCard title="Taxa de sucesso" value="100%" />
        <MetricCard title="Último envio" value={history[0]?.date || "-"} />
      </div>

      {/* CONEXÃO + ENVIO */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* CONEXÃO */}
        <div className="rounded-2xl border border-white/10 bg-[#070014] p-6 space-y-4">
          <h2 className="text-lg text-white font-semibold">Conexão</h2>

          <Box label="Número conectado" value="Nenhum número configurado" />
          <Box label="Ambiente" value="Modo de preparação" />

          <button className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-semibold">
            Configurar WhatsApp
          </button>
        </div>

        {/* ENVIO */}
        <div className="rounded-2xl border border-white/10 bg-[#070014] p-6 space-y-4">
          <h2 className="text-lg text-white font-semibold">Envio de teste</h2>

          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Telefone com DDI"
            className="w-full p-3 rounded-xl bg-transparent border border-white/10 text-white"
          />

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite a mensagem..."
            className="w-full p-3 rounded-xl bg-transparent border border-white/10 text-white min-h-[120px]"
          />

          <button
            onClick={handleSend}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-semibold"
          >
            {loading ? "Enviando..." : "Enviar teste"}
          </button>
        </div>
      </div>

      {/* HISTÓRICO */}
      <div className="rounded-2xl border border-white/10 bg-[#070014] p-6">
        <h2 className="text-lg text-white font-semibold mb-4">Histórico</h2>

        {history.length === 0 ? (
          <div className="text-center text-white/40 py-10">
            Nenhum envio realizado ainda
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item, i) => (
              <div
                key={i}
                className="border border-white/10 rounded-xl p-4 flex justify-between items-center"
              >
                <div>
                  <p className="text-white text-sm">{item.phone}</p>
                  <p className="text-white/60 text-xs">{item.message}</p>
                </div>

                <div className="text-right">
                  <p className="text-green-400 text-sm">{item.status}</p>
                  <p className="text-white/40 text-xs">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value }: any) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#070014] p-4">
      <p className="text-white/60 text-sm">{title}</p>
      <p className="text-white text-xl font-semibold mt-1">{value}</p>
    </div>
  );
}

function Box({ label, value }: any) {
  return (
    <div className="border border-white/10 rounded-xl p-4">
      <p className="text-white/50 text-sm">{label}</p>
      <p className="text-white mt-1">{value}</p>
    </div>
  );
}
