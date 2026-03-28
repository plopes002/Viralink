// src/app/(app)/posts/EditScheduledPostModal.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from "firebase/storage";
import {
  FiImage,
  FiPaperclip,
  FiVideo,
  FiX,
} from "react-icons/fi";
import { useFirebase, useUser } from "@/firebase/provider";
import type { ScheduledPost } from "@/hooks/useScheduledPosts";
import { toUtcDateFromLocalInput } from "@/lib/timezone";
import { formatRunAtWithTimezone } from "@/lib/scheduleFormatting";

type MediaType = "image" | "video" | "none";

interface EditScheduledPostModalProps {
  post: (ScheduledPost & { boardStatus: string }) | null;
  isOpen: boolean;
  onClose: () => void;
}

const MAX_IMAGE_MB = 8;
const MAX_VIDEO_MB = 100;

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

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function fileSizeInMb(file: File) {
  return file.size / (1024 * 1024);
}

function isImage(file: File) {
  return file.type.startsWith("image/");
}

function isVideo(file: File) {
  return file.type.startsWith("video/");
}

async function compressImage(
  file: File,
  maxWidth = 1600,
  quality = 0.82
): Promise<File> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });

  let { width, height } = image;

  if (width > maxWidth) {
    const ratio = maxWidth / width;
    width = maxWidth;
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Não foi possível processar a imagem.");
  }

  ctx.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });

  if (!blob) {
    throw new Error("Falha ao comprimir a imagem.");
  }

  const compressedName = file.name.replace(/\.[^.]+$/, "") + ".jpg";

  return new File([blob], compressedName, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

export function EditScheduledPostModal({
  post,
  isOpen,
  onClose,
}: EditScheduledPostModalProps) {
  const { firestore: db } = useFirebase();
  const { user: currentUser } = useUser();

  const [text, setText] = useState("");
  const [networks, setNetworks] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [timeZone, setTimeZone] = useState("America/Sao_Paulo");

  const [mediaType, setMediaType] = useState<MediaType>("none");
  const [existingMediaUrl, setExistingMediaUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const ownerId = currentUser?.uid ?? null;
  const workspaceId = post?.workspaceId ?? null;

  useEffect(() => {
    if (!post || !isOpen) return;

    setText(post.content?.text ?? "");
    setNetworks(post.networks ?? []);
    setTimeZone(post.timeZone ?? "America/Sao_Paulo");

    const safeDate = toSafeDate(post.runAt);

    if (!safeDate) {
      setDate("");
      setTime("");
    } else {
      setDate(getLocalDateInputValue(safeDate));
      setTime(getLocalTimeInputValue(safeDate));
    }

    const initialMediaType = (post.content?.mediaType ?? "none") as MediaType;
    const initialMediaUrl = post.content?.mediaUrl ?? null;

    setMediaType(initialMediaType);
    setExistingMediaUrl(initialMediaUrl);
    setSelectedFile(null);
    setPreviewUrl(initialMediaUrl);
    setError(null);
    setUploadProgress(0);
  }, [post, isOpen]);

  const canSubmit = useMemo(() => {
    if (!db || !post || !ownerId) return false;
    if (!date || !time) return false;
    if (!networks.length) return false;
    if (!text.trim() && mediaType === "none") return false;
    if (mediaType !== "none" && !selectedFile && !existingMediaUrl) return false;
    return true;
  }, [db, post, ownerId, date, time, networks, text, mediaType, selectedFile, existingMediaUrl]);

  if (!isOpen || !post) return null;

  const handleToggleNetwork = (network: string) => {
    setNetworks((prev) =>
      prev.includes(network)
        ? prev.filter((n) => n !== network)
        : [...prev, network]
    );
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);

    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(existingMediaUrl);
  };

  const removeMediaCompletely = () => {
    setSelectedFile(null);

    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);
    setExistingMediaUrl(null);
    setMediaType("none");
  };

  const handleChangeMediaType = (value: MediaType) => {
    setError(null);
    setMediaType(value);

    if (value === "none") {
      removeMediaCompletely();
      return;
    }

    if (
      existingMediaUrl &&
      post.content?.mediaType &&
      post.content.mediaType !== value
    ) {
      setExistingMediaUrl(null);
      setPreviewUrl(null);
    }

    if (selectedFile) {
      setSelectedFile(null);
    }
  };

  const handleFileChange = async (file: File | null) => {
    setError(null);

    if (!file) {
      clearSelectedFile();
      return;
    }

    try {
      if (mediaType === "image") {
        if (!isImage(file)) {
          throw new Error("Selecione um arquivo de imagem válido.");
        }

        if (fileSizeInMb(file) > MAX_IMAGE_MB) {
          throw new Error(`A imagem deve ter no máximo ${MAX_IMAGE_MB} MB.`);
        }

        const compressed = await compressImage(file);

        setSelectedFile(compressed);

        if (previewUrl && previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(previewUrl);
        }

        setPreviewUrl(URL.createObjectURL(compressed));
        return;
      }

      if (mediaType === "video") {
        if (!isVideo(file)) {
          throw new Error("Selecione um arquivo de vídeo válido.");
        }

        if (fileSizeInMb(file) > MAX_VIDEO_MB) {
          throw new Error(`O vídeo deve ter no máximo ${MAX_VIDEO_MB} MB.`);
        }

        setSelectedFile(file);

        if (previewUrl && previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(previewUrl);
        }

        setPreviewUrl(URL.createObjectURL(file));
        return;
      }

      removeMediaCompletely();
    } catch (err: any) {
      setSelectedFile(null);
      setError(err?.message || "Erro ao preparar arquivo.");
    }
  };

  async function uploadMediaIfNeeded() {
    if (mediaType === "none") {
      return null;
    }

    if (!selectedFile) {
      return existingMediaUrl ?? null;
    }

    if (!workspaceId || !ownerId) {
      throw new Error("Workspace ou usuário não disponível para upload.");
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const storage = getStorage();
      const timestamp = Date.now();
      const safeName = sanitizeFileName(selectedFile.name);
      const storagePath = `post-media/${workspaceId}/${ownerId}/${timestamp}-${safeName}`;
      const storageRef = ref(storage, storagePath);

      const task = uploadBytesResumable(storageRef, selectedFile);

      await new Promise<void>((resolve, reject) => {
        task.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(Math.round(progress));
          },
          reject,
          () => resolve()
        );
      });

      const downloadURL = await getDownloadURL(task.snapshot.ref);
      setUploadProgress(100);
      return downloadURL;
    } finally {
      setUploading(false);
    }
  }

  const handleSave = async () => {
    if (!db || !canSubmit) {
      setError("Preencha os campos obrigatórios antes de salvar.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const runAtUtc = toUtcDateFromLocalInput(date, time, timeZone);
      const uploadedMediaUrl = await uploadMediaIfNeeded();

      const refDoc = doc(db, "scheduledPosts", post.id);

      await updateDoc(refDoc, {
        "content.text": text.trim(),
        "content.mediaType": mediaType,
        "content.mediaUrl": mediaType === "none" ? null : uploadedMediaUrl,
        networks,
        timeZone,
        runAt: runAtUtc,
        updatedAt: serverTimestamp(),
      });

      onClose();
    } catch (err: any) {
      console.error("[EditScheduledPostModal] erro ao salvar:", err);
      setError(err?.message || "Erro ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  };

  const runAtLabel = formatRunAtWithTimezone(
    post.runAt,
    post.timeZone ?? "America/Sao_Paulo"
  ).full;

  const isBusy = saving || uploading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-3">
      <div className="w-full max-w-2xl rounded-2xl border border-[#312356] bg-[#050017] p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Editar agendamento
            </h2>
            <p className="text-[11px] text-[#9CA3AF]">
              Ajuste texto, redes, mídia e horário de disparo. Agendado atualmente
              para: <span className="text-[#E5E7EB]">{runAtLabel}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-white text-xs"
            disabled={isBusy}
          >
            Fechar ✕
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 mb-3">
            {error}
          </div>
        )}

        <div className="space-y-4">
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

          <div>
            <label className="text-[11px] text-[#E5E7EB] block mb-2">
              Tipo de mídia
            </label>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {[
                { id: "none", label: "Sem mídia" },
                { id: "image", label: "Imagem" },
                { id: "video", label: "Vídeo" },
              ].map((item) => {
                const active = mediaType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleChangeMediaType(item.id as MediaType)}
                    className={`px-3 py-1 rounded-full border transition ${
                      active
                        ? "border-[#7C3AED] bg-[#7C3AED]/20 text-white"
                        : "border-[#272046] text-[#E5E7EB]/80 hover:bg-[#111827]"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {mediaType !== "none" && (
            <div>
              <label className="text-[11px] text-[#E5E7EB] block mb-1">
                Arquivo de mídia
              </label>
              <label className="flex items-center gap-2 w-full rounded-xl border border-[#272046] bg-[#020012] text-[12px] text-[#E5E7EB] px-3 py-2 cursor-pointer hover:border-[#7C3AED] transition">
                <FiPaperclip className="h-4 w-4 text-[#9CA3AF]" />
                <span className="truncate">
                  {selectedFile?.name ||
                    (existingMediaUrl ? "Mídia atual carregada" : "Clique para escolher um arquivo")}
                </span>
                <input
                  type="file"
                  accept={mediaType === "image" ? "image/*" : "video/*"}
                  onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </label>
              <p className="text-[10px] text-[#9CA3AF] mt-1">
                Imagem: até {MAX_IMAGE_MB} MB. Vídeo: até {MAX_VIDEO_MB} MB.
              </p>
            </div>
          )}

          {previewUrl && mediaType === "image" && (
            <div className="rounded-2xl border border-[#261341] bg-[#120426] p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] text-white font-medium">Preview da imagem</p>
                <button
                  type="button"
                  onClick={removeMediaCompletely}
                  className="inline-flex items-center gap-1 text-[11px] text-[#FCA5A5] hover:text-white"
                >
                  <FiX className="h-3.5 w-3.5" />
                  Remover
                </button>
              </div>
              <img
                src={previewUrl}
                alt="Preview da imagem"
                className="max-h-72 rounded-xl border border-[#272046] object-contain"
              />
            </div>
          )}

          {previewUrl && mediaType === "video" && (
            <div className="rounded-2xl border border-[#261341] bg-[#120426] p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] text-white font-medium">Preview do vídeo</p>
                <button
                  type="button"
                  onClick={removeMediaCompletely}
                  className="inline-flex items-center gap-1 text-[11px] text-[#FCA5A5] hover:text-white"
                >
                  <FiX className="h-3.5 w-3.5" />
                  Remover
                </button>
              </div>
              <video
                src={previewUrl}
                controls
                className="max-h-72 rounded-xl border border-[#272046]"
              />
            </div>
          )}

          {uploading && (
            <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 px-4 py-3">
              <div className="flex items-center justify-between text-[11px] text-sky-200 mb-2">
                <span>Enviando mídia...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#120426] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${uploadProgress}%`,
                    background:
                      "linear-gradient(90deg,#7C3AED 0%,#EC4899 50%,#0EA5E9 100%)",
                  }}
                />
              </div>
            </div>
          )}

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
            disabled={isBusy}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSubmit || isBusy}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-white font-medium disabled:opacity-50"
            style={{
              background:
                "linear-gradient(90deg,#7C3AED 0%,#EC4899 50%,#0EA5E9 100%)",
            }}
          >
            {mediaType === "video" ? (
              <FiVideo className="h-4 w-4" />
            ) : (
              <FiImage className="h-4 w-4" />
            )}
            {saving ? "Salvando..." : uploading ? "Enviando mídia..." : "Salvar alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}
