// src/app/api/campaigns/dispatch/route.ts
import 'server-only';
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

function matchesFilters(profile: any, filters: any) {
  if (filters.temperature && filters.temperature !== "all") {
    if (profile.leadTemperature !== filters.temperature) return false;
  }

  if (filters.followStatus === "followers" && !profile.isFollower) {
    return false;
  }

  if (filters.followStatus === "non_followers" && profile.isFollower) {
    return false;
  }

  if (filters.category && filters.category !== "all") {
    if (!(profile.categories || []).includes(filters.category)) {
      return false;
    }
  }

  if (filters.operationalTag && filters.operationalTag !== "all") {
    if (!(profile.operationalTags || []).includes(filters.operationalTag)) {
      return false;
    }
  }

  if (filters.search && String(filters.search).trim()) {
    const term = String(filters.search).toLowerCase();
    const haystack = [
      profile.name,
      profile.username,
      ...(profile.categories || []),
      ...(profile.interestTags || []),
      ...(profile.operationalTags || []),
      ...(profile.politicalEntities || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (!haystack.includes(term)) return false;
  }

  return true;
}

function applyVariables(message: string, profile: any) {
  const firstName = String(profile.name || "").split(" ")[0] || "";
  return message
    .replace(/\{\{nome\}\}/gi, firstName)
    .replace(/\{\{nome_completo\}\}/gi, profile.name || "")
    .replace(/\{\{usuario\}\}/gi, profile.username || "");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      workspaceId,
      name,
      channel,
      message,
      filters,
    } = body || {};

    if (!workspaceId || !name || !channel || !message) {
      return NextResponse.json(
        { error: "workspaceId, name, channel e message são obrigatórios." },
        { status: 400 },
      );
    }

    const profilesSnap = await adminFirestore
      .collection("engagementProfiles")
      .where("workspaceId", "==", workspaceId)
      .get();

    const allProfiles = profilesSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    }));

    let recipients = allProfiles.filter((profile) =>
      matchesFilters(profile, filters || {}),
    );

    // segurança anti-volume exagerado
    const MAX_DISPATCH = 80;
    const limitedRecipients = recipients.slice(0, MAX_DISPATCH);

    const now = new Date().toISOString();

    const campaignRef = await adminFirestore.collection("campaigns").add({
      workspaceId,
      name,
      channel,
      message,
      audienceFilters: filters || {},
      recipientsCount: limitedRecipients.length,
      status: "queued",
      createdAt: now,
      updatedAt: now,
    });

    for (const recipient of limitedRecipients) {
      await adminFirestore.collection("messages").add({
        workspaceId,
        campaignId: campaignRef.id,
        toUser: recipient.username,
        toPhone: recipient.phone || null,
        toEmail: recipient.email || null,
        channel,
        content: applyVariables(message, recipient),
        status: "queued",
        createdAt: now,
      });
    }

    return NextResponse.json({
      ok: true,
      campaignId: campaignRef.id,
      recipientsCount: limitedRecipients.length,
      limited: recipients.length > MAX_DISPATCH,
      note:
        recipients.length > MAX_DISPATCH
          ? `Por segurança, apenas ${MAX_DISPATCH} destinatários foram enfileirados nesta ação.`
          : "Campanha enfileirada com sucesso.",
    });
  } catch (err) {
    console.error("[campaign dispatch] erro:", err);
    return NextResponse.json(
      { error: "Erro ao disparar campanha." },
      { status: 500 },
    );
  }
}
