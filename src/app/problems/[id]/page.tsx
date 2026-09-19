"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatMs } from "@/lib/format";
import type { Problem } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";
import { DifficultyBadge, Panel } from "@/components/ui";

export default function ProblemDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api.get<Problem>(`/api/problems/${params.id}`).then((res) => {
      if (!res.success) setError(res.error);
      else setProblem(res.data);
    });
  }, [params.id]);

  if (error) return <p className="p-10 text-rose-400">{error}</p>;
  if (!problem) return <p className="p-10 text-zinc-400">Lade Problem…</p>;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center gap-3">
        <DifficultyBadge level={problem.difficulty} />
        <h1 className="text-3xl font-semibold text-white">{problem.title}</h1>
      </div>
      {problem.best_score ? (
        <p className="mt-3 text-emerald-300">Dein Rekord: {formatMs(problem.best_score)}</p>
      ) : (
        <p className="mt-3 text-zinc-500">Noch keine Bestzeit.</p>
      )}
      <Panel className="mt-8 p-6">
        <p className="whitespace-pre-wrap leading-7 text-zinc-300">{problem.description}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Beispiel Input</p>
            <pre className="mt-2 rounded-lg bg-black/40 p-3 font-mono text-sm text-zinc-200">
              {problem.example_input}
            </pre>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Beispiel Output</p>
            <pre className="mt-2 rounded-lg bg-black/40 p-3 font-mono text-sm text-zinc-200">
              {problem.example_output}
            </pre>
          </div>
        </div>
        <p className="mt-4 text-sm text-zinc-500">
          {problem.test_case_count} versteckte Test-Cases (Inhalt nur auf dem Server).
        </p>
      </Panel>
      <div className="mt-6">
        {user ? (
          <Link
            href={`/solo/${problem.id}`}
            className="inline-flex rounded-xl bg-emerald-400 px-5 py-3 font-medium text-[#07110b]"
          >
            Solo starten
          </Link>
        ) : (
          <Link href="/login" className="text-emerald-300">
            Einloggen, um Solo zu spielen
          </Link>
        )}
      </div>
    </main>
  );
}
