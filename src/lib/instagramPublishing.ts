// src/lib/instagramPublishing.ts
import "server-only";

type InstagramPublishInput = {
  igUserId: string;
  accessToken: string;
  caption: string;
  imageUrl: string;
};

type MetaGraphError = {
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
    return JSON.parse(text);
  } catch {
    throw new Error(`Meta retornou resposta não JSON: ${text.slice(0, 300)}`);
  }
}

export async function publishImageToInstagram({
  igUserId,
  accessToken,
  caption,
  imageUrl,
}: InstagramPublishInput) {
  if (!igUserId) {
    throw new Error("IG User ID ausente.");
  }

  if (!accessToken) {
    throw new Error("Access token do Instagram ausente.");
  }

  if (!imageUrl) {
    throw new Error("imageUrl ausente para publicação no Instagram.");
  }

  const createContainerUrl = new URL(
    `https://graph.facebook.com/v20.0/${igUserId}/media`
  );
  createContainerUrl.searchParams.set("image_url", imageUrl);
  createContainerUrl.searchParams.set("caption", caption || "");
  createContainerUrl.searchParams.set("access_token", accessToken);

  const createRes = await fetch(createContainerUrl.toString(), {
    method: "POST",
    cache: "no-store",
  });

  const createJson = (await readMetaJson(createRes)) as MetaGraphError & {
    id?: string;
  };

  if (!createRes.ok || !createJson?.id) {
    const message =
      createJson?.error?.message || "Falha ao criar container no Instagram.";
    throw new Error(message);
  }

  const creationId = createJson.id;

  const publishUrl = new URL(
    `https://graph.facebook.com/v20.0/${igUserId}/media_publish`
  );
  publishUrl.searchParams.set("creation_id", creationId);
  publishUrl.searchParams.set("access_token", accessToken);

  const publishRes = await fetch(publishUrl.toString(), {
    method: "POST",
    cache: "no-store",
  });

  const publishJson = (await readMetaJson(publishRes)) as MetaGraphError & {
    id?: string;
  };

  if (!publishRes.ok || !publishJson?.id) {
    const message =
      publishJson?.error?.message || "Falha ao publicar post no Instagram.";
    throw new Error(message);
  }

  return {
    ok: true,
    creationId,
    mediaId: publishJson.id,
  };
}
