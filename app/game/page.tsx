import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GameClient from "./GameClient";

type GameClue = {
  text: string;
  hint: string;
  image: string;
};

type GameItem = {
  solution: { long: number; lat: number };
  clues: GameClue;
};

export const dynamic = "force-dynamic";

export default async function GamePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    redirect("/auth/login");
  }

  const gameDataModule = await import("@/app/game-template/game1.json");
  const gameData = (gameDataModule.default || []) as GameItem[];

  // Load existing progress for this user
  const { data: progressRow } = await supabase
    .from("game_progress")
    .select("completed_indices")
    .eq("user_id", data.user.id)
    .eq("game_id", "game1")
    .maybeSingle();

  const completedIndices: number[] = progressRow?.completed_indices ?? [];

  return (
    <div className="min-h-screen w-full flex flex-col">
      <GameClient
        userId={data.user.id}
        gameId="game1"
        items={gameData}
        initialCompleted={completedIndices}
      />
    </div>
  );
}


