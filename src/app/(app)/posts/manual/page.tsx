// src/app/(app)/posts/manual/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import {
  FiArrowLeft,
  FiCalendar,
  FiImage,
  FiPaperclip,
  FiSave,
  FiVideo,
  FiX,
} from "react-icons/fi";
import { useFirebase, useUser } from "@/firebase/provider";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toUtcDateFromLocalInput } from "@/lib/timezone";

type MediaType = "image" | "video" | "none";

const AVAILABLE_NETWORKS = [
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "whatsapp", label: "WhatsApp" },
];

const MAX_IMAGE_MB = 8;
const MAX_VIDEO_MB = 100;

function getTomorrowDateInput() {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
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

export default function ManualPostPage() {
  const router = useRouter();
  const { firestore: db } = useFirebase();
  const { currentWorkspace } = useWorkspace();
  const { user: currentUser } = useUser();

  const workspaceId = currentWorkspace?.id ?? null;
  const ownerId = currentUser?.uid ?? null;
  const sessionReady = !!db && !!workspaceId && !!ownerId;

  const [text, setText] = useState("");
  const [networks, setNetworks] = useState<string[]>(["instagram"]);
  const [mediaType, setMediaType] = useState<MediaType>("image");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [date, setDate] = useState(getTomorrowDateInput());
  const [time, setTime] = useState("10:00");
  const [timeZone, setTimeZone] = useState("America/Sao_Paulo");

  const [savingDraft, setSavingDraft] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const isBusy = savingDraft || savingSchedule || uploading;

  const canSubmit = useMemo(() => {
    if (!sessionReady) return false;
    if (!networks.length) return false;
    if (!text.trim() && mediaType === "none") return false;
    if (mediaType !== "none" && !selectedFile) return false;
    return true;
  }, [sessionReady, networks, text, mediaType, selectedFile]);

  const toggleNetwork = (networkId: string) => {
    setNetworks((prev) =>
      prev.includes(networkId)
        ? prev.filter((item) => item !== networkId)
        : [...prev, networkId]
    );
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  };

  const handleChangeMediaType = (value: MediaType) => {
    setMediaType(value);
    setError(null);
    clearSelectedFile();
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

        if (previewUrl) URL.revokeObjectURL(previewUrl);
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

        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(file));
        return;
      }

      clearSelectedFile();
    } catch (err: any) {
      clearSelectedFile();
      setError(err?.message || "Erro ao preparar arquivo.");
    }
  };

  async function uploadMediaIfNeeded() {
    if (mediaType === "none") {
      return null;
    }

    if (!selectedFile || !workspaceId || !ownerId) {
      throw new Error("Selecione um arquivo antes de continuar.");
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

  const buildContent = async () => {
    const uploadedMediaUrl = await uploadMediaIfNeeded();

    return {
      text: text.trim(),
      mediaType,
      mediaUrl: mediaType === "none" ? null : uploadedMediaUrl,
    };
  };

  const handleSaveDraft = async () => {
    if (!sessionReady) {
      setError("Sessão ainda carregando. Aguarde alguns segundos e tente novamente.");
      return;
    }

    if (!canSubmit) {
      setError("Preencha os campos obrigatórios antes de salvar.");
      return;
    }

    setError(null);
    setSavingDraft(true);

    try {
      const content = await buildContent();

      await addDoc(collection(db!, "draftPosts"), {
        workspaceId,
        ownerId,
        networks,
        content,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      router.push("/posts");
    } catch (err: any) {
      console.error("[ManualPostPage] erro ao salvar rascunho:", err);
      setError(err?.message || "Erro ao salvar rascunho.");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSchedule = async () => {
    if (!sessionReady) {
      setError("Sessão ainda carregando. Aguarde alguns segundos e tente novamente.");
      return;
    }

    if (!canSubmit) {
      setError("Preencha os campos obrigatórios antes de agendar.");
      return;
    }

    if (!date || !time) {
      setError("Informe data e horário do agendamento.");
      return;
    }

    setError(null);
    setSavingSchedule(true);

    try {
      const content = await buildContent();
      const runAtUtc = toUtcDateFromLocalInput(date, time, timeZone);

      await addDoc(collection(db!, "scheduledPosts"), {
        workspaceId,
        ownerId,
        networks,
        content,
        timeZone,
        runAt: runAtUtc,
        status: "pending",
        lastError: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      router.push("/posts");
    } catch (err: any) {
      console.error("[ManualPostPage] erro ao agendar post:", err);
      setError(err?.message || "Erro ao agendar post.");
    } finally {
      setSavingSchedule(false);
    }
  };

  return (
    <section className="mt-4 flex flex-col gap-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.push("/posts")}
            className="inline-flex items-center gap-2 text-xs text-[#9CA3AF] hover:text-white mb-2"
          >
            <FiArrowLeft className="h-4 w-4" />
            Voltar para Posts & Agenda
          </button>

          <h1 className="text-2xl md:text-3xl font-semibold text-white">
            Novo post manual
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1">
            Selecione redes, envie imagem ou vídeo e escolha salvar ou agendar.
          </p>
        </div>
      </header>

      {!sessionReady && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Carregando sessão, workspace e permissões...
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-[#261341] bg-[#0B001F] p-4 md:p-5 space-y-4">
        <div>
          <label className="text-[11px] text-[#E5E7EB] block mb-1">
            Texto do post
          </label>
          <textarea
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full rounded-xl border border-[#272046] bg-[#020012] text-[13px] text-[#E5E7EB] px-3 py-3 outline-none focus:ring-1 focus:ring-[#7C3AED]"
            placeholder="Escreva a legenda completa que será publicada nas redes selecionadas."
          />
        </div>

        <div>
          <label className="text-[11px] text-[#E5E7EB] block mb-2">
            Redes selecionadas
          </label>
          <div className="flex flex-wrap gap-2 text-[11px]">
            {AVAILABLE_NETWORKS.map((network) => {
              const active = networks.includes(network.id);

              return (
                <button
                  key={network.id}
                  type="button"
                  onClick={() => toggleNetwork(network.id)}
                  className={`px-3 py-1 rounded-full border transition ${
                    active
                      ? "border-[#7C3AED] bg-[#7C3AED]/20 text-white"
                      : "border-[#272046] text-[#E5E7EB]/80 hover:bg-[#111827]"
                  }`}
                >
                  {network.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
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

          <div>
            <label className="text-[11px] text-[#E5E7EB] block mb-1">
              Arquivo de mídia
            </label>
            <label className="flex items-center gap-2 w-full rounded-xl border border-[#272046] bg-[#020012] text-[12px] text-[#E5E7EB] px-3 py-2 cursor-pointer hover:border-[#7C3AED] transition">
              <FiPaperclip className="h-4 w-4 text-[#9CA3AF]" />
              <span className="truncate">
                {mediaType === "none"
                  ? "Nenhuma mídia selecionada"
                  : selectedFile?.name || "Clique para escolher um arquivo"}
              </span>
              <input
                type="file"
                accept={
                  mediaType === "image"
                    ? "image/*"
                    : mediaType === "video"
                    ? "video/*"
                    : undefined
                }
                disabled={mediaType === "none"}
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>

            <p className="text-[10px] text-[#9CA3AF] mt-1">
              Imagem: até {MAX_IMAGE_MB} MB. Vídeo: até {MAX_VIDEO_MB} MB.
            </p>
          </div>
        </div>

        {previewUrl && mediaType === "image" && (
          <div className="rounded-2xl border border-[#261341] bg-[#120426] p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-white font-medium">Preview da imagem</p>
              <button
                type="button"
                onClick={clearSelectedFile}
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
                onClick={clearSelectedFile}
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

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-[11px] text-[#E5E7EB] block mb-1">
              Data
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-[#272046] bg-[#020012] text-[12px] text-[#E5E7EB] px-3 py-2 outline-none focus:ring-1 focus:ring-[#7C3AED]"
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
              className="w-full rounded-xl border border-[#272046] bg-[#020012] text-[12px] text-[#E5E7EB] px-3 py-2 outline-none focus:ring-1 focus:ring-[#7C3AED]"
            />
          </div>

          <div>
            <label className="text-[11px] text-[#E5E7EB] block mb-1">
              Fuso horário
            </label>
            <select
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              className="w-full rounded-xl border border-[#272046] bg-[#020012] text-[12px] text-[#E5E7EB] px-3 py-2 outline-none focus:ring-1 focus:ring-[#7C3AED]"
            >
              <option value="America/Sao_Paulo">Horário de Brasília</option>
              <option value="America/Manaus">Horário de Manaus</option>
              <option value="America/Boa_Vista">Horário de Boa Vista</option>
              <option value="America/Porto_Velho">Horário de Porto Velho</option>
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-[#261341] bg-[#120426] px-4 py-3 text-[11px] text-[#CBD5E1]">
          <div className="flex items-center gap-2 mb-1">
            <FiCalendar className="h-4 w-4 text-[#0EA5E9]" />
            <span className="font-medium text-white">Resumo</span>
          </div>
          <p>
            Redes: <span className="text-white">{networks.join(", ") || "nenhuma"}</span>
          </p>
          <p>
            Mídia: <span className="text-white">{mediaType === "none" ? "sem mídia" : mediaType}</span>
          </p>
          <p>
            Arquivo: <span className="text-white">{selectedFile?.name || "—"}</span>
          </p>
          {selectedFile && (
            <p>
              Tamanho:{" "}
              <span className="text-white">
                {fileSizeInMb(selectedFile).toFixed(2)} MB
              </span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={!canSubmit || isBusy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#312356] text-[#E5E7EB] hover:bg-white/5 transition disabled:opacity-50"
          >
            <FiSave className="h-4 w-4" />
            {savingDraft ? "Salvando..." : "Salvar rascunho"}
          </button>

          <button
            type="button"
            onClick={handleSchedule}
            disabled={!canSubmit || isBusy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-medium disabled:opacity-50"
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
            {savingSchedule
              ? "Agendando..."
              : uploading
              ? "Enviando mídia..."
              : "Agendar publicação"}
          </button>
        </div>
      </div>
    </section>
  );
}