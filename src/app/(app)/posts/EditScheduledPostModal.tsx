// src/app/(app)/posts/EditScheduledPostModal.tsx
"use client";

import { useState, useEffect } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";
import type { ScheduledPost } from "@/hooks/useScheduledPosts";
import { toUtcDateFromLocalInput } from "@/lib/timezone";
import { formatRunAtWithTimezone } from "@/lib/scheduleFormatting";

interface EditScheduledPostModalProps {
  post: (ScheduledPost & { boardStatus: string }) | null;
  isOpen: boolean;
  onClose: () => void;
}

function toSafeDate(value: any): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value?.toDate === "function") {
    const parsed = value.toDate();
    return parsed instanceof Date && !Number.isNaN(parsed.getTime())
      ? parsed
      : null;
  }

  if (typeof value?.seconds === "number") {
    const parsed = new Date(value.seconds * 1000);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function getLocalDateInputValue(value: any) {
  const date = toSafeDate(value);
  if (!date) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getLocalTimeInputValue(value: any) {
  const date = toSafeDate(value);
  if (!date) return "";
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function EditScheduledPostModal({
  post,
  isOpen,
  onClose,
}: EditScheduledPostModalProps) {
  const { firestore: db } = useFirebase();
  const [text, setText] = useState("");
  const [networks, setNetworks] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [timeZone, setTimeZone] = useState("America/Sao_Paulo");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!post || !isOpen) return;

    setText(post.content?.text ?? "");
    setNetworks(post.networks ?? []);
    setTimeZone(post.timeZone ?? "America/Sao_Paulo");

    const safeDate = toSafeDate(post.runAt);

    if (!safeDate) {
      setDate("");
      setTime("");
      return;
    }

    setDate(getLocalDateInputValue(safeDate));
    setTime(getLocalTimeInputValue(safeDate));
  }, [post, isOpen]);

  if (!isOpen || !post) return null;

  const handleToggleNetwork = (network: string) => {
    setNetworks((prev) =>
      prev.includes(network)
        ? prev.filter((n) => n !== network)
        : [...prev, network]
    );
  };

  const handleSave = async () => {
    if (!db) return;
    if (!date || !time) return;

    setSaving(true);
    try {
      const runAtUtc = toUtcDateFromLocalInput(date, time, timeZone);

      const ref = doc(db, "scheduledPosts", post.id);
      await updateDoc(ref, {
        "content.text": text,
        networks,
        timeZone,
        runAt: runAtUtc,
        updatedAt: serverTimestamp(),
      });

      onClose();
    } catch (err) {
      console.error("[EditScheduledPostModal] erro ao salvar:", err);
    } finally {
      setSaving(false);
    }
  };

  const runAtLabel = formatRunAtWithTimezone(
    post.runAt,
    post.timeZone ?? "America/Sao_Paulo"
  ).full;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-[#312356] bg-[#050017] p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Editar agendamento
            </h2>
            <p className="text-[11px] text-[#9CA3AF]">
              Ajuste texto, redes e horário de disparo. Agendado atualmente
              para: <span className="text-[#E5E7EB]">{runAtLabel}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-white text-xs"
          >
            Fechar ✕
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-[#E5E7EB] block mb-1">
              Texto do post
            </label>
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full rounded-xl border border-[#272046] bg-[#020012] text-[12px] text-[#E5E7EB] px-3 py-2 outline-none focus:ring-1 focus:ring-[#7C3AED]"
              placeholder="Escreva ou ajuste o texto do post..."
            />
          </div>

          <div>
            <label className="text-[11px] text-[#E5E7EB] block mb-1">
              Redes selecionadas
            </label>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {[
                { id: "instagram", label: "Instagram" },
                { id: "facebook", label: "Facebook" },
                { id: "whatsapp", label: "WhatsApp" },
              ].map((opt) => {
                const active = networks.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleToggleNetwork(opt.id)}
                    className={`px-3 py-1 rounded-full border transition ${
                      active
                        ? "border-[#7C3AED] bg-[#7C3AED]/20 text-white"
                        : "border-[#272046] text-[#E5E7EB]/80 hover:bg-[#111827]"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-[#E5E7EB] block mb-1">
                Data
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-[#272046] bg-[#020012] text-[12px] text-[#E5E7EB] px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#7C3AED]"
              />
            </div>
            <div>
              <label className="text-[11px] text-[#E5E7EB] block mb-1">
                Horário
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl border border-[#272046] bg-[#020012] text-[12px] text-[#E5E7EB] px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#7C3AED]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-[#E5E7EB] block mb-1">
              Fuso horário
            </label>
            <select
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              className="w-full rounded-xl border border-[#272046] bg-[#020012] text-[12px] text-[#E5E7EB] px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#7C3AED]"
            >
              <option value="America/Sao_Paulo">
                Horário de Brasília (America/Sao_Paulo)
              </option>
              <option value="America/Manaus">
                Horário de Manaus (America/Manaus)
              </option>
              <option value="America/Boa_Vista">
                Roraima (America/Boa_Vista)
              </option>
              <option value="America/Porto_Velho">
                Rondônia (America/Porto_Velho)
              </option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 text-[11px]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-full border border-[#272046] text-[#E5E7EB] hover:bg-[#111827]"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 rounded-full text-white font-medium"
            style={{
              background:
                "linear-gradient(90deg,#7C3AED 0%,#EC4899 50%,#0EA5E9 100%)",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}

