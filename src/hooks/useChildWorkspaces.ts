// src/hooks/useChildWorkspaces.ts
"use client";

import { useMemo } from "react";
import { useWorkspaceLinks } from "@/hooks/useWorkspaceLinks";
import { useWorkspaces } from "@/hooks/useWorkspaces";

export function useChildWorkspaces(masterWorkspaceId?: string | null) {
  const { links, loading: loadingLinks } = useWorkspaceLinks(masterWorkspaceId);
  const { workspaces, loading: loadingWorkspaces } = useWorkspaces();

  const childWorkspaces = useMemo(() => {
    const activeChildIds = links
      .filter((l) => l.status === "active")
      .map((l) => l.childWorkspaceId);

    return workspaces.filter((w: any) => activeChildIds.includes(w.id));
  }, [links, workspaces]);

  return {
    childWorkspaces,
    links,
    loading: loadingLinks || loadingWorkspaces,
  };
}
