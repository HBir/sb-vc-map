"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  initialShowIntro?: boolean;
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

export default function GameClient({ gameId, items, initialCompleted, initialShowIntro }: Props) {
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>(initialCompleted);
  const [currentIdx, setCurrentIdx] = useState<number>(() => {
    const firstIncomplete = items.findIndex((it) => !initialCompleted.includes(it.taskId));
    return firstIncomplete === -1 ? 0 : firstIncomplete;
  });
  const [showHint, setShowHint] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [checking, setChecking] = useState<boolean>(false);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [hintPresses, setHintPresses] = useState<number>(0);
  const hereBtnRef = useRef<HTMLButtonElement | null>(null);
  const completionRef = useRef<HTMLDivElement | null>(null);
  const [introActive, setIntroActive] = useState<boolean>(initialShowIntro ?? (initialCompleted.length === 0));

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

  const launchBurstAt = useCallback((clientX: number, clientY: number) => {
    if (typeof window === "undefined") return;
    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.left = "0";
    canvas.style.top = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"]; // tailwind-ish
    type Particle = {
      x: number; y: number; vx: number; vy: number; life: number; rot: number; vr: number; size: number; color: string; kind: "confetti" | "heart";
    };

    const originX = clientX;
    const originY = clientY;
    const particles: Particle[] = [];
    const totalConfetti = 140;
    const totalHearts = 40;

    for (let i = 0; i < totalConfetti; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 6;
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 60 + Math.random() * 30,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        size: 6 + Math.random() * 6,
        color: colors[(Math.random() * colors.length) | 0],
        kind: "confetti",
      });
    }
    for (let i = 0; i < totalHearts; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 4;
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 70 + Math.random() * 30,
        rot: 0,
        vr: 0,
        size: 16 + Math.random() * 10,
        color: "#ef4444",
        kind: "heart",
      });
    }

    let frame = 0;
    const gravity = 0.15;

    const tick = () => {
      if (!ctx) return;
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= 1;

        if (p.kind === "confetti") {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        } else {
          ctx.save();
          ctx.font = `${p.size}px system-ui, -apple-system, Segoe UI, Roboto, Emoji`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("💖", p.x, p.y);
          ctx.restore();
        }

        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }
      if (particles.length > 0 && frame < 240) {
        requestAnimationFrame(tick);
      } else {
        canvas.remove();
      }
    };

    requestAnimationFrame(tick);
  }, []);

  const burstFromButton = useCallback(() => {
    const btn = hereBtnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    launchBurstAt(x, y);
  }, [launchBurstAt]);

  // When the game is fully completed, periodically celebrate over the completion message
  useEffect(() => {
    if (!allDone) return;
    const elem = completionRef.current;
    if (!elem) return;
    const fire = () => {
      const rect = elem.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      launchBurstAt(x, y);
    };
    // Fire immediately and then every 3 seconds
    fire();
    const id = setInterval(fire, 2000);
    return () => clearInterval(id);
  }, [allDone, launchBurstAt]);

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
            burstFromButton();
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
  }, [completedTaskIds, current, currentIdx, saveProgress, burstFromButton]);

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

  // Reset hint press counter when switching tasks
  useEffect(() => {
    setHintPresses(0);
  }, [currentIdx]);

  const onHintClick = () => {
    setShowHint((v) => !v);
    const next = hintPresses + 1;
    if (next >= 10) {
      setHintPresses(0);
      const confirmed = window.confirm("Do you want to skip this task?");
      if (confirmed && !completedTaskIds.includes(current.taskId)) {
        const updated = [...completedTaskIds, current.taskId];
        setCompletedTaskIds(updated);
        saveProgress(updated);
        burstFromButton();
      }
    } else {
      setHintPresses(next);
    }
  };



  return (
    <div className="flex flex-col gap-4 p-4 max-w-xl mx-auto w-full">
      {introActive ? (
        <div className="flex flex-col items-center justify-center gap-6 text-center py-16">
          <h1 className="text-3xl font-bold">Klava&apos;s Quest</h1>
          <p className="text-muted-foreground max-w-md">
            You will be given a series of images. Your task is to figure out where the photograph was taken. If you go there you will be granted the next clue.
          </p>
          <p className="text-muted-foreground max-w-md">
            Are you ready?
          </p>
          <Button onClick={() => setIntroActive(false)}>
            Start!
          </Button>
        </div>
      ) : (
        <>
      {/* Progress */}
      <div className="flex items-center gap-2 justify-center sticky top-0 bg-background/80 backdrop-blur py-2 z-10">
        {items.map((it, i) => {
          const done = completedTaskIds.includes(it.taskId);
          return (
            <div
              key={i}
              className={`h-6 w-6 rounded-full border flex items-center justify-center select-none ${done ? "bg-green-500 text-white border-green-500" : i === currentIdx ? "border-primary" : "border-muted-foreground/40"}`}
            >
              {done ? <CheckIcon size={14} /> : <span className="text-[10px]">{i + 1}</span>}
            </div>
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
            <Button variant="secondary" onClick={onHintClick}>
              <HelpCircle className="mr-2 h-4 w-4" /> {showHint ? "Hide hint" : "Show hint"}
            </Button>
            <Button onClick={checkLocation} disabled={checking} ref={hereBtnRef}>
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
            tasks={showDebugIndices ? items.map((it, i) => ({ lat: it.solution.lat, lng: it.solution.long, index: i, id: it.taskId })) : undefined}
            showDebugIndices={showDebugIndices}
          />
        </div>
      ) : (
        <div className="text-center py-10" ref={completionRef}>
          {/* TODO: Add something better here */}
          <div className="text-2xl font-bold mb-2">All challenges completed!</div>
          <div className="text-muted-foreground">Great job ✨</div>
        </div>
      )}
        </>
      )}
    </div>
  );
}


