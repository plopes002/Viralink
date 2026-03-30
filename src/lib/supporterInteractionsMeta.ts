// src/lib/supporterInteractionsMeta.ts
import "server-only";

type MetaErrorResponse = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
  id?: string;
};

async function readMetaJson(response: Response) {
  const text = await response.text();

  try {
    return JSON.parse(text) as MetaErrorResponse;
  } catch {
    throw new Error(`Meta retornou resposta não JSON: ${text.slice(0, 300)}`);
  }
}

export async function replyToInstagramComment({
  commentId,
  message,
  accessToken,
}: {
  commentId: string;
  message: string;
  accessToken: string;
}) {
  if (!commentId) {
    throw new Error("commentId não informado.");
  }

  if (!message?.trim()) {
    throw new Error("Mensagem de resposta não informada.");
  }

  if (!accessToken) {
    throw new Error("Token de acesso não encontrado.");
  }

  const url = new URL(
    `https://graph.facebook.com/v20.0/${encodeURIComponent(commentId)}/replies`
  );
  url.searchParams.set("message", message.trim());
  url.searchParams.set("access_token", accessToken);

  const res = await fetch(url.toString(), {
    method: "POST",
    cache: "no-store",
  });

  const data = await readMetaJson(res);

  if (!res.ok || data.error) {
    throw new Error(data.error?.message || "Erro ao responder comentário.");
  }

  return data;
}

export async function sendInstagramPrivateReply({
  commentId,
  message,
  accessToken,
}: {
  commentId: string;
  message: string;
  accessToken: string;
}) {
  if (!commentId) {
    throw new Error("commentId não informado.");
  }

  if (!message?.trim()) {
    throw new Error("Mensagem privada não informada.");
  }

  if (!accessToken) {
    throw new Error("Token de acesso não encontrado.");
  }

  const url = new URL(
    `https://graph.facebook.com/v20.0/${encodeURIComponent(commentId)}/private_replies`
  );
  url.searchParams.set("message", message.trim());
  url.searchParams.set("access_token", accessToken);

  const res = await fetch(url.toString(), {
    method: "POST",
    cache: "no-store",
  });

  const data = await readMetaJson(res);

  if (!res.ok || data.error) {
    throw new Error(data.error?.message || "Erro ao enviar resposta privada.");
  }

  return data;
}
