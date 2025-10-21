"use client";

import { Button } from "@/components/ui/button";
import { useTransition } from "react";
import { resetProgressAction } from "./actions";

export default function ResetProgressButton({ gameId }: { gameId: string }) {
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    const confirmed = window.confirm("Are you sure you want to reset your progress?");
    if (!confirmed) return;
    startTransition(async () => {
      try {
        await resetProgressAction(gameId);
        window.location.reload();
      } catch {
        // no-op
      }
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={isPending}>
      {isPending ? "Resetting..." : "Reset progress"}
    </Button>
  );
}


