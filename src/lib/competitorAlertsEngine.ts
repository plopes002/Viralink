// src/lib/competitorAlertsEngine.ts
type Snapshot = {
  createdAt: string;
  periodDays: number;
  metrics?: {
    myFollowers?: number;
    competitorFollowers?: number;
    myEngagementRate?: number;
    competitorEngagementRate?: number;
    myGrowthRate?: number;
    competitorGrowthRate?: number;
    myAvgLikes?: number;
    competitorAvgLikes?: number;
    myAvgComments?: number;
    competitorAvgComments?: number;
  };
};

function diff(a = 0, b = 0) {
  return a - b;
}

function formatSigned(value: number, suffix = "") {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}${suffix}`;
}

export function generateCompetitorAlerts(params: {
  current: Snapshot;
  previous: Snapshot;
}) {
  const { current, previous } = params;

  const c = current.metrics || {};
  const p = previous.metrics || {};

  const alerts: Array<{
    type: string;
    severity: "info" | "warning" | "critical";
    title: string;
    description: string;
    metadata?: Record<string, any>;
  }> = [];

  const currentGrowthGap =
    Number(c.myGrowthRate || 0) - Number(c.competitorGrowthRate || 0);
  const previousGrowthGap =
    Number(p.myGrowthRate || 0) - Number(p.competitorGrowthRate || 0);
  const growthDelta = currentGrowthGap - previousGrowthGap;

  if (growthDelta < -0.5) {
    alerts.push({
      type: "competitor_growth_accelerated",
      severity: "warning",
      title: "Concorrente acelerou crescimento",
      description:
        "O concorrente ampliou a vantagem relativa de crescimento no período mais recente.",
      metadata: {
        currentGrowthGap,
        previousGrowthGap,
        growthDelta,
      },
    });
  }

  const currentEngagementGap =
    Number(c.myEngagementRate || 0) - Number(c.competitorEngagementRate || 0);
  const previousEngagementGap =
    Number(p.myEngagementRate || 0) - Number(p.competitorEngagementRate || 0);
  const engagementDelta = currentEngagementGap - previousEngagementGap;

  if (currentEngagementGap < 0 && previousEngagementGap >= 0) {
    alerts.push({
      type: "lost_engagement_advantage",
      severity: "critical",
      title: "Você perdeu vantagem em engajamento",
      description:
        "Sua conta deixou de liderar em taxa de engajamento em relação ao concorrente.",
      metadata: {
        currentEngagementGap,
        previousEngagementGap,
        engagementDelta,
      },
    });
  }

  const commentsGapNow =
    Number(c.myAvgComments || 0) - Number(c.competitorAvgComments || 0);
  const commentsGapBefore =
    Number(p.myAvgComments || 0) - Number(p.competitorAvgComments || 0);
  const commentsDelta = commentsGapNow - commentsGapBefore;

  if (commentsDelta < -10) {
    alerts.push({
      type: "comments_drop",
      severity: "warning",
      title: "Sua vantagem em comentários caiu",
      description:
        "O volume relativo de comentários piorou no período mais recente.",
      metadata: {
        commentsGapNow,
        commentsGapBefore,
        commentsDelta,
      },
    });
  }

  const likesGapNow =
    Number(c.myAvgLikes || 0) - Number(c.competitorAvgLikes || 0);
  const likesGapBefore =
    Number(p.myAvgLikes || 0) - Number(p.competitorAvgLikes || 0);
  const likesDelta = likesGapNow - likesGapBefore;

  if (likesDelta < -25) {
    alerts.push({
      type: "likes_gap_worsened",
      severity: "info",
      title: "Diferença de curtidas piorou",
      description:
        "O concorrente ganhou vantagem relativa em likes médios.",
      metadata: {
        likesGapNow,
        likesGapBefore,
        likesDelta,
      },
    });
  }

  const competitorAheadInGrowth =
    Number(c.competitorGrowthRate || 0) > Number(c.myGrowthRate || 0);
  const myAheadInEngagement =
    Number(c.myEngagementRate || 0) > Number(c.competitorEngagementRate || 0);

  if (competitorAheadInGrowth && myAheadInEngagement) {
    alerts.push({
      type: "campaign_opportunity",
      severity: "info",
      title: "Momento favorável para campanha",
      description:
        "O concorrente cresce mais rápido, mas sua conta ainda mantém melhor engajamento. Há oportunidade de campanha para converter atenção em relacionamento.",
      metadata: {
        myEngagementRate: c.myEngagementRate || 0,
        competitorGrowthRate: c.competitorGrowthRate || 0,
      },
    });
  }

  return alerts;
}