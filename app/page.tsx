import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GameClient from "./game/GameClient";
import { AuthButton } from "@/components/auth-button";
import ResetProgressButton from "./game/ResetProgressButton";

type GameClue = {
  text: string;
  hint: string;
  image: string;
};

type GameItem = {
  taskId: string;
  solution: { long: number; lat: number };
  clues: GameClue;
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    redirect("/auth/login");
  }

  const gameDataModule = await import("@/app/game-template/game1.json");
  const gameData = (gameDataModule.default || []) as GameItem[];

  const { data: progressRow } = await supabase
    .from("game_progress")
    .select("completed_task_ids")
    .eq("user_id", data.user.id)
    .eq("game_id", "game1")
    .maybeSingle();

  const completedTaskIds: string[] = progressRow?.completed_task_ids ?? [];

  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="w-full flex justify-between border-b border-b-foreground/10 h-14 items-center px-4">
        <ResetProgressButton gameId="game1" />
        {/* Auth actions incl. Logout */}
        <AuthButton />
      </div>
      <GameClient
        gameId="game1"
        items={gameData}
        initialCompleted={completedTaskIds}
        initialShowIntro={completedTaskIds.length === 0}
      />
    </div>
  );
}
