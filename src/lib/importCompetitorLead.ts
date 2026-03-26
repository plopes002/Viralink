// src/lib/importCompetitorLead.ts
import { importProfileToContact } from "./importProfileToContact";
import type { CompetitorLead } from "@/types/competitorLead";
import type { Firestore } from "firebase/firestore";

export async function importLeadToCRM(firestore: Firestore, lead: CompetitorLead) {
  await importProfileToContact(
    firestore,
    {
      id: lead.id,
      workspaceId: lead.workspaceId,
      name: lead.username,
      username: lead.username,
      categories: ["concorrente"],
      operationalTags: ["lead-concorrente"],
      leadTemperature: "warm",
    } as any,
    "competitor",
  );
}
