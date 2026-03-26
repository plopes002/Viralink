// src/app/api/queue/process/route.ts
import 'server-only';
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";
import { buildEngagementProfileFromItems } from "@/lib/engagementProfileScoring";
import { calculateLeadScore } from "@/lib/leadScoring";

async function getPendingJobs(limit = 10) {
  const snap = await adminFirestore
    .collection("processingQueue")
    .where("status", "==", "pending")
    .limit(limit)
    .get();

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as any),
  }));
}

async function getEngagementById(id: string) {
  const snap = await adminFirestore.collection("engagements").doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as any) };
}

async function analyzeSentiment(text: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/api/engagement/analyze-sentiment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const data = await res.json();
  return data?.sentiment || "neutral";
}

async function suggestCategories(item: any) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/api/engagement/suggest-categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: item.name,
      username: item.username,
      bio: "",
      interactionText: item.interactionText || "",
      postTopic: item.postTopic || "",
      postTitle: item.postTitle || "",
    }),
  });

  const data = await res.json();
  return Array.isArray(data?.categories) ? data.categories : [];
}

async function analyzePolitical(text: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/api/engagement/political-review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  return await res.json();
}

async function updateConsolidatedProfile(engagement: any) {
  const allItemsSnap = await adminFirestore
    .collection("engagements")
    .where("workspaceId", "==", engagement.workspaceId)
    .where("socialAccountId", "==", engagement.socialAccountId)
    .where("username", "==", engagement.username)
    .get();

  const allItems = allItemsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const profileData = buildEngagementProfileFromItems(allItems as any);

  const profileId = `${profileData.workspaceId}_${profileData.socialAccountId}_${profileData.username}`;
  
  await adminFirestore
    .collection("engagementProfiles")
    .doc(profileId)
    .set({
        ...profileData,
        updatedAt: new Date().toISOString(),
    }, { merge: true });
}

export async function POST(req: NextRequest) {
  try {
    const jobs = await getPendingJobs(10);
    const results: any[] = [];

    for (const job of jobs) {
      try {
        await adminFirestore.collection("processingQueue").doc(job.id).update({
          status: "processing",
          attempts: (job.attempts || 0) + 1,
          updatedAt: new Date().toISOString(),
        });

        const engagement = job.engagementId
          ? await getEngagementById(job.engagementId)
          : null;

        if (!engagement) {
          throw new Error("Engagement não encontrado.");
        }

        if (job.type === "engagement_sentiment_analysis") {
          if (engagement.interactionText) {
            const sentiment = await analyzeSentiment(engagement.interactionText);
            await adminFirestore.collection("engagements").doc(engagement.id).update({
              interactionSentiment: sentiment,
            });
          }
        } else if (job.type === "engagement_category_suggestion") {
          const categories = await suggestCategories(engagement);
          if (categories.length) {
            await adminFirestore.collection("engagements").doc(engagement.id).update({ categories });
          }
        } else if (job.type === "engagement_political_review") {
          const textBase = [
            engagement.interactionText || "",
            engagement.postTitle || "",
            engagement.postTopic || "",
            engagement.username || "",
            engagement.name || "",
          ]
            .filter(Boolean)
            .join(" | ");

          if (textBase.trim()) {
            const politicalReview = await analyzePolitical(textBase);
            await adminFirestore.collection("engagements").doc(engagement.id).update({ politicalReview });
          }
        } else if (job.type === "engagement_profile_update") {
          await updateConsolidatedProfile(engagement);

          const scoreResult = calculateLeadScore(engagement);
          await adminFirestore.collection("engagements").doc(engagement.id).update({
            leadScore: scoreResult.score,
            leadTemperature: scoreResult.temperature,
            leadScoreReason: scoreResult.reasons,
          });
        }

        await adminFirestore.collection("processingQueue").doc(job.id).update({
          status: "done",
          errorMessage: null,
          updatedAt: new Date().toISOString(),
        });

        results.push({ id: job.id, status: "done" });
      } catch (err: any) {
        console.error("[queue process] erro no job", job.id, err);

        await adminFirestore.collection("processingQueue").doc(job.id).update({
          status: "error",
          errorMessage: err?.message || "Erro desconhecido",
          updatedAt: new Date().toISOString(),
        });

        results.push({ id: job.id, status: "error" });
      }
    }

    return NextResponse.json({
      ok: true,
      processed: results.length,
      results,
    });
  } catch (err) {
    console.error("[queue process route] erro:", err);
    return NextResponse.json(
      { error: "Erro ao processar fila." },
      { status: 500 },
    );
  }
}
