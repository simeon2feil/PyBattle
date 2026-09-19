"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Protected } from "@/components/protected";
import { Panel } from "@/components/ui";
import { api } from "@/lib/api";
import type { BattleMatch } from "@/lib/types";
import { Swords } from "lucide-react";

function Queue() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "queued" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function join() {
    setError(null);
    setStatus("queued");
    const queued = await api.post<{ queued: boolean }>("/api/battle/queue");
    if (!queued.success) {
      setStatus("error");
      setError(queued.error);
      return;
    }
    await new Promise((r) => setTimeout(r, 1600));
    const match = await api.post<BattleMatch>("/api/battle/match");
    if (!match.success) {
      setStatus("error");
      setError(match.error);
      return;
    }
    sessionStorage.setItem("pyclash_match", JSON.stringify(match.data));
    router.push(`/battle/${match.data.id}`);
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-12">
      <Panel className="p-8 text-center">
        <Swords className="mx-auto h-10 w-10 text-emerald-400" />
        <h1 className="mt-4 text-3xl font-semibold text-white">1v1 Battle</h1>
        <p className="mt-3 text-zinc-400">
          Matchmaking nach ELO. Beide Spieler bekommen dasselbe Problem und 10 Minuten.
        </p>
        <button
          disabled={status === "queued"}
          onClick={() => void join()}
          className="mt-8 w-full rounded-xl bg-emerald-400 py-3 font-medium text-[#07110b] disabled:opacity-60"
        >
          {status === "queued" ? "Suche Gegner…" : "Queue beitreten"}
        </button>
        {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}
      </Panel>
    </main>
  );
}

export default function BattlePage() {
  return (
    <Protected>
      <Queue />
    </Protected>
  );
}
