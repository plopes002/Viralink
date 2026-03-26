// src/lib/competitorStrategyComparison.ts
type StrategySnapshot = {
    createdAt: string;
    periodDays: number;
    summary?: string;
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
  
  export function compareStrategySnapshots(
    current: StrategySnapshot,
    previous: StrategySnapshot,
  ) {
    const currentMetrics = current.metrics || {};
    const previousMetrics = previous.metrics || {};
  
    const insights: string[] = [];
  
    const currentEngagementGap = diff(
      Number(currentMetrics.myEngagementRate || 0),
      Number(currentMetrics.competitorEngagementRate || 0),
    );
    const previousEngagementGap = diff(
      Number(previousMetrics.myEngagementRate || 0),
      Number(previousMetrics.competitorEngagementRate || 0),
    );
  
    const engagementGapDelta = currentEngagementGap - previousEngagementGap;
  
    if (engagementGapDelta > 0.05) {
      insights.push(
        `Sua vantagem relativa em engajamento melhorou ${formatSigned(
          engagementGapDelta,
          " p.p.",
        )} desde a análise anterior.`,
      );
    } else if (engagementGapDelta < -0.05) {
      insights.push(
        `Sua posição relativa em engajamento piorou ${formatSigned(
          engagementGapDelta,
          " p.p.",
        )} desde a análise anterior.`,
      );
    }
  
    const currentGrowthGap = diff(
      Number(currentMetrics.myGrowthRate || 0),
      Number(currentMetrics.competitorGrowthRate || 0),
    );
    const previousGrowthGap = diff(
      Number(previousMetrics.myGrowthRate || 0),
      Number(previousMetrics.competitorGrowthRate || 0),
    );
    const growthGapDelta = currentGrowthGap - previousGrowthGap;
  
    if (growthGapDelta > 0.05) {
      insights.push(
        `Sua diferença relativa de crescimento melhorou ${formatSigned(
          growthGapDelta,
          " p.p.",
        )}.`,
      );
    } else if (growthGapDelta < -0.05) {
      insights.push(
        `Sua diferença relativa de crescimento piorou ${formatSigned(
          growthGapDelta,
          " p.p.",
        )}.`,
      );
    }
  
    const currentLikesGap = diff(
      Number(currentMetrics.myAvgLikes || 0),
      Number(currentMetrics.competitorAvgLikes || 0),
    );
    const previousLikesGap = diff(
      Number(previousMetrics.myAvgLikes || 0),
      Number(previousMetrics.competitorAvgLikes || 0),
    );
    const likesGapDelta = currentLikesGap - previousLikesGap;
  
    if (likesGapDelta > 1) {
      insights.push(
        `Sua posição relativa em curtidas médias melhorou ${formatSigned(
          likesGapDelta,
        )}.`,
      );
    } else if (likesGapDelta < -1) {
      insights.push(
        `Sua posição relativa em curtidas médias caiu ${formatSigned(
          likesGapDelta,
        )}.`,
      );
    }
  
    const currentCommentsGap = diff(
      Number(currentMetrics.myAvgComments || 0),
      Number(currentMetrics.competitorAvgComments || 0),
    );
    const previousCommentsGap = diff(
      Number(previousMetrics.myAvgComments || 0),
      Number(previousMetrics.competitorAvgComments || 0),
    );
    const commentsGapDelta = currentCommentsGap - previousCommentsGap;
  
    if (commentsGapDelta > 1) {
      insights.push(
        `Sua vantagem relativa em comentários médios melhorou ${formatSigned(
          commentsGapDelta,
        )}.`,
      );
    } else if (commentsGapDelta < -1) {
      insights.push(
        `Sua posição relativa em comentários médios piorou ${formatSigned(
          commentsGapDelta,
        )}.`,
      );
    }
  
    const currentFollowersGap = diff(
      Number(currentMetrics.myFollowers || 0),
      Number(currentMetrics.competitorFollowers || 0),
    );
    const previousFollowersGap = diff(
      Number(previousMetrics.myFollowers || 0),
      Number(previousMetrics.competitorFollowers || 0),
    );
    const followersGapDelta = currentFollowersGap - previousFollowersGap;
  
    if (followersGapDelta > 0) {
      insights.push(
        `A diferença absoluta de seguidores melhorou em ${Math.round(
          followersGapDelta,
        )} desde a análise anterior.`,
      );
    } else if (followersGapDelta < 0) {
      insights.push(
        `A diferença absoluta de seguidores piorou em ${Math.round(
          Math.abs(followersGapDelta),
        )}.`,
      );
    }
  
    let summary = "Não houve mudança relevante em relação à análise anterior.";
  
    if (insights.length > 0) {
      summary = insights.join(" ");
    }
  
    return {
      summary,
      insights,
    };
  }