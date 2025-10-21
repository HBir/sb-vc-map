"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckIcon, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveProgressAction } from "./actions";
import dynamic from "next/dynamic";

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

type Props = {
  gameId: string;
  items: GameItem[];
  initialCompleted: string[];
};

function resolveImagePath(p: string): string {
  // The JSON points to /game-template/*.jpeg. We serve those via an app route.
  return p;
}

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false, loading: () => null });

function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000; // meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const a = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function GameClient({ gameId, items, initialCompleted }: Props) {
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>(initialCompleted);
  const [currentIdx, setCurrentIdx] = useState<number>(() => {
    const firstIncomplete = items.findIndex((it) => !initialCompleted.includes(it.taskId));
    return firstIncomplete === -1 ? 0 : firstIncomplete;
  });
  const [showHint, setShowHint] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [checking, setChecking] = useState<boolean>(false);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);

  const current = items[currentIdx];

  const allDone = useMemo(() => completedTaskIds.length >= items.length, [completedTaskIds.length, items.length]);

  const showDebugIndices = process.env.NEXT_PUBLIC_SHOW_TASK_INDICES === "true";
  if (showDebugIndices) {
    console.log("DEBUG FLAG ON");
  }

  const saveProgress = useCallback(async (newCompleted: string[]) => {
    try {
      await saveProgressAction(gameId, newCompleted);
    } catch {}
  }, [gameId]);

  const checkLocation = useCallback(() => {
    if (!current) return;
    setChecking(true);
    setLocationError(null);
    if (!("geolocation" in navigator)) {
      setLocationError("Geolocation is not available.");
      setChecking(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const distance = haversineMeters(latitude, longitude, current.solution.lat, current.solution.long);
        if (distance <= 100) {
          if (!completedTaskIds.includes(current.taskId)) {
            const updated = [...completedTaskIds, current.taskId];
            setCompletedTaskIds(updated);
            saveProgress(updated);
          }
        } else {
          setLocationError(`Not quite there. You are ${(distance | 0)}m away.`);
        }
        setChecking(false);
      },
      (err) => {
        setLocationError(err.message || "Failed to get location");
        setChecking(false);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 },
    );
  }, [completedTaskIds, current, currentIdx, saveProgress]);

  useEffect(() => {
    if (completedTaskIds.includes(current.taskId)) {
      const next = items.findIndex((it) => !completedTaskIds.includes(it.taskId));
      if (next !== -1) setCurrentIdx(next);
    }
  }, [completedTaskIds, current.taskId, items]);

  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);



  return (
    <div className="flex flex-col gap-4 p-4 max-w-xl mx-auto w-full">
      {/* Progress */}
      <div className="flex items-center gap-2 justify-center sticky top-0 bg-background/80 backdrop-blur py-2 z-10">
        {items.map((it, i) => {
          const done = completedTaskIds.includes(it.taskId);
          return (
            <button
              key={i}
              className={`h-6 w-6 rounded-full border flex items-center justify-center ${done ? "bg-green-500 text-white border-green-500" : i === currentIdx ? "border-primary" : "border-muted-foreground/40"}`}
              onClick={() => setCurrentIdx(i)}
            >
              {done ? <CheckIcon size={14} /> : <span className="text-[10px]">{i + 1}</span>}
            </button>
          );
        })}
      </div>

      {/* Current challenge */}
      {!allDone ? (
        <div className="flex flex-col gap-4">
          <div className="w-full overflow-hidden rounded-md border bg-muted flex items-center justify-center">
            {/* In prod we might map JSON paths to /public assets directly */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resolveImagePath(current.clues.image)} alt={current.clues.text} className="h-full w-auto max-h-full object-contain" />
          </div>
          <div className="text-center text-lg font-semibold">{current.clues.text}</div>

          <div className="flex items-center justify-center gap-2">
            <Button variant="secondary" onClick={() => setShowHint((v) => !v)}>
              <HelpCircle className="mr-2 h-4 w-4" /> {showHint ? "Hide hint" : "Show hint"}
            </Button>
            <Button onClick={checkLocation} disabled={checking}>
              {checking ? "Checking..." : "I am here"}
            </Button>
          </div>

          {showHint && (
            <div className="text-center text-sm text-muted-foreground">Hint: {current.clues.hint}</div>
          )}

          {locationError && (
            <div className="text-center text-sm text-red-500">{locationError}</div>
          )}

          <LeafletMap
            center={userPos}
            completed={items
              .filter((it) => completedTaskIds.includes(it.taskId))
              .map((it) => ({ lat: it.solution.lat, lng: it.solution.long }))}
            tasks={showDebugIndices ? items.map((it, i) => ({ lat: it.solution.lat, lng: it.solution.long, index: i })) : undefined}
            showDebugIndices={showDebugIndices}
          />
        </div>
      ) : (
        <div className="text-center py-10">
          {/* TODO: Add something better here */}
          <div className="text-2xl font-bold mb-2">All challenges completed!</div>
          <div className="text-muted-foreground">Great job ✨</div>
        </div>
      )}
    </div>
  );
}


