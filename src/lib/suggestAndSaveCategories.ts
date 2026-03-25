import { updateEngagement } from "@/firebase/engagements";
import { suggestCategories } from "@/ai/flows/suggest-categories";
import type { EngagementItem } from "@/types/engagement";
import type { Firestore } from "firebase/firestore";

export async function suggestAndSaveCategories(
  firestore: Firestore,
  item: EngagementItem,
) {
  try {
    const { categories } = await suggestCategories({
        name: item.name,
        username: item.username,
        bio: "", // Placeholder as defined in the prompt
        interactionText: item.interactionText || "",
        postTopic: item.postTopic || "",
        postTitle: item.postTitle || "",
    });

    if (categories.length) {
      // Merge new categories with existing ones, avoiding duplicates
      const existingCategories = item.categories || [];
      const newCategories = Array.from(new Set([...existingCategories, ...categories]));
      await updateEngagement(firestore, item.id, { categories: newCategories });
      return newCategories;
    }

    return item.categories || [];
  } catch (err) {
    console.error("[suggestAndSaveCategories] erro:", err);
    return [];
  }
}
