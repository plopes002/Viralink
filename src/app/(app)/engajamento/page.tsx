"use client";

import { useState } from "react";

export default function EngagementPage() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const users = [
    { username: "julia_fit", name: "Júlia", isFollower: false },
    { username: "carlos", name: "Carlos", isFollower: true }
  ];

  async function sendMessage() {
    if (!selectedUser) {
      alert("Selecione um usuário para enviar a mensagem.");
      return;
    };
    if (!message.trim()) {
      alert("A mensagem não pode estar vazia.");
      return;
    }

    try {
      const response = await fetch("/api/engagement/send-message", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: selectedUser,
          message
        })
      });
      if (!response.ok) throw new Error("Falha ao enviar mensagem.");
      
      alert("Mensagem enviada!");
      setMessage("");
      setSelectedUser(null);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      alert("Ocorreu um erro ao enviar a mensagem.");
    }

  }

  return (
    <section className="mt-4 flex flex-col gap-4">
      <header>
        <h1 className="text-lg font-semibold text-white">
          Central de Engajamento
        </h1>
        <p className="text-xs text-[#9CA3AF]">
          Liste, classifique e interaja com os usuários que engajaram com seus posts.
        </p>
      </header>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Coluna da Lista de Usuários */}
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4 flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-white">Usuários que interagiram</h2>
          {users.map((user) => (
            <div
              key={user.username}
              className={`border p-3 rounded-lg cursor-pointer transition ${selectedUser === user.username ? 'border-purple-500 bg-[#111827]' : 'border-[#272046] hover:bg-[#111827]'}`}
              onClick={() => setSelectedUser(user.username)}
            >
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-white">{user.name} <span className="text-xs text-gray-400">@{user.username}</span></p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${user.isFollower ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                  {user.isFollower ? "Seguidor" : "Não segue"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Coluna de Envio de Mensagem */}
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-white">Enviar Mensagem</h2>
          {selectedUser ? (
             <p className="text-xs text-[#9CA3AF]">Enviando para: <span className="font-medium text-white">@{selectedUser}</span></p>
          ) : (
             <p className="text-xs text-[#9CA3AF]">Selecione um usuário da lista para enviar uma mensagem.</p>
          )}
          <textarea
            className="w-full rounded-xl border border-[#272046] bg-[#020012] text-[12px] text-[#E5E7EB] px-3 py-2 outline-none focus:ring-1 focus:ring-[#7C3AED] min-h-[120px]"
            placeholder="Digite a mensagem..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={!selectedUser}
          />
          <button
            onClick={sendMessage}
            disabled={!selectedUser || !message.trim()}
            className="w-full rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-[12px] font-medium text-white py-2 hover:opacity-90 transition disabled:opacity-50"
          >
            Enviar Mensagem
          </button>
        </div>
      </div>
    </section>
  );
}