"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveProgressAction(gameId: string, completedIndices: number[]) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("Unauthenticated");
  }

  const upsertRes = await supabase
    .from("game_progress")
    .upsert(
      {
        user_id: data.user.id,
        game_id: gameId,
        completed_indices: completedIndices,
      },
      { onConflict: "user_id,game_id" },
    )
    .select()
    .single();

  if (upsertRes.error) {
    throw new Error(upsertRes.error.message);
  }

  return upsertRes.data;
}


