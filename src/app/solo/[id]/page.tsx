"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CodeEditor } from "@/components/code-editor";
import { Protected } from "@/components/protected";
import { DifficultyBadge, Panel } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDuration, formatMs } from "@/lib/format";
import type { SoloSession, SoloSubmitResult } from "@/lib/types";

function SoloArena() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<SoloSession | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SoloSubmitResult | null>(null);
  const [pending, setPending] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    void api
      .post<SoloSession>("/api/solo/start", { problem_id: params.id })
      .then((res) => {
        if (!res.success) {
          setError(res.error);
          return;
        }
        setSession(res.data);
        setCode(res.data.problem.starter_code);
      });
  }, [params.id]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  if (error) {
    return (
      <div className="p-10">
        <p className="text-rose-400">{error}</p>
        <button className="mt-4 text-emerald-300" onClick={() => router.push("/problems")}>
          Zurück
        </button>
      </div>
    );
  }

  if (!session) return <p className="p-10 text-zinc-400">Session wird vom Server gestartet…</p>;

  const started = new Date(session.started_at).getTime();
  const elapsed = now - started;
  const timedOut = elapsed >= 15 * 60 * 1000;

  async function submit() {
    if (!session) return;
    setPending(true);
    setError(null);
    const res = await api.post<SoloSubmitResult>("/api/solo/submit", {
      session_id: session.session_id,
      code,
    });
    setPending(false);
    if (!res.success) {
      setError(res.error);
      return;
    }
    setResult(res.data);
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[0.9fr_1.1fr]">
      <Panel className="p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <DifficultyBadge level={session.problem.difficulty} />
            <h1 className="mt-2 text-2xl font-semibold text-white">{session.problem.title}</h1>
          </div>
          <div className="text-right">
            <p className="font-mono text-2xl text-emerald-300">{formatDuration(elapsed)}</p>
            <p className="text-xs text-zinc-500">Server-Timer (Referenz: started_at)</p>
          </div>
        </div>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
          {session.problem.description}
        </p>
        <div className="mt-4 rounded-lg bg-black/40 p-3 font-mono text-xs text-zinc-400">
          <p>Input: {session.problem.example_input}</p>
          <p>Output: {session.problem.example_output}</p>
        </div>
        {session.problem.best_score ? (
          <p className="mt-4 text-sm text-emerald-300">
            Dein Rekord: {formatMs(session.problem.best_score)}
          </p>
        ) : null}
      </Panel>
      <div>
        <CodeEditor value={code} onChange={setCode} />
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            disabled={pending || timedOut || result?.correct}
            onClick={() => void submit()}
            className="rounded-xl bg-emerald-400 px-5 py-2.5 font-medium text-[#07110b] disabled:opacity-50"
          >
            {pending ? "Piston prüft…" : "Submit"}
          </button>
          <p className="text-xs text-zinc-500">Min. 5s · Max. 15min · 1 Submit (außer Compile-Error)</p>
        </div>
        {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
        {result ? (
          <Panel className="mt-4 p-4 text-sm">
            {result.compile_error ? (
              <p className="text-amber-300">{result.compile_error} — du darfst erneut submitten.</p>
            ) : result.correct ? (
              <p className="text-emerald-300">
                Alle Tests bestanden in {formatMs(result.duration_ms ?? 0)}. Bestzeit:{" "}
                {result.best_score ? formatMs(result.best_score) : "—"}
              </p>
            ) : (
              <p className="text-rose-300">
                {result.tests_passed}/{result.tests_total} Tests. Session failed.
              </p>
            )}
          </Panel>
        ) : null}
      </div>
    </main>
  );
}

export default function SoloPage() {
  return (
    <Protected>
      <SoloArena />
    </Protected>
  );
}
