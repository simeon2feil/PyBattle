"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatMs } from "@/lib/format";
import type { ProblemListItem } from "@/lib/types";
import { DifficultyBadge, Panel } from "@/components/ui";

export default function ProblemsPage() {
  const [items, setItems] = useState<ProblemListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api.get<ProblemListItem[]>("/api/problems").then((res) => {
      if (!res.success) setError(res.error);
      else setItems(res.data);
    });
  }, []);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-white">Probleme</h1>
      <p className="mt-2 text-zinc-400">
        Öffentliche Liste. Test-Cases siehst du nicht – nur die Anzahl.
      </p>
      {error ? <p className="mt-6 text-rose-400">{error}</p> : null}
      <div className="mt-8 space-y-3">
        {items.map((p) => (
          <Link key={p.id} href={`/problems/${p.id}`}>
            <Panel className="flex items-center justify-between px-5 py-4 transition hover:border-emerald-400/30">
              <div className="flex items-center gap-4">
                <DifficultyBadge level={p.difficulty} />
                <div>
                  <p className="font-medium text-white">{p.title}</p>
                  <p className="text-xs text-zinc-500">{p.test_case_count} versteckte Tests</p>
                </div>
              </div>
              <div className="text-right text-sm">
                {p.solved ? (
                  <p className="text-emerald-300">
                    Gelöst · Bestzeit {p.best_score ? formatMs(p.best_score) : "—"}
                  </p>
                ) : (
                  <p className="text-zinc-500">Offen</p>
                )}
              </div>
            </Panel>
          </Link>
        ))}
      </div>
    </main>
  );
}
