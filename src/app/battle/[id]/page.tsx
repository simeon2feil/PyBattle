"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CodeEditor } from "@/components/code-editor";
import { Protected } from "@/components/protected";
import { Panel } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDuration } from "@/lib/format";
import type { BattleMatch, SoloSubmitResult } from "@/lib/types";

function Arena() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [match, setMatch] = useState<BattleMatch | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [now, setNow] = useState(Date.now());
  const [log, setLog] = useState<string[]>([]);
  const [over, setOver] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("pyclash_match");
    if (!raw) return;
    const parsed = JSON.parse(raw) as BattleMatch;
    if (parsed.id !== params.id) return;
    setMatch(parsed);
    setCode(parsed.problem.starter_code);
    void api
      .post<{ session_id: string }>("/api/solo/start", { problem_id: parsed.problem.id })
      .then((res) => {
        if (res.success) setSessionId(res.data.session_id);
      });
  }, [params.id]);

  useEffect(() => {
    if (!match) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    const fail = setTimeout(() => {
      setLog((l) => [...l, `${match.opponent.username} hat einen Fehler (3/6 Tests)`]);
    }, 4000);
    const progress = setTimeout(() => {
      setLog((l) => [...l, `${match.opponent.username} ist bei Test 5/6`]);
    }, 9000);
    return () => {
      clearInterval(t);
      clearTimeout(fail);
      clearTimeout(progress);
    };
  }, [match]);

  if (!match) {
    return (
      <div className="p-10">
        <p className="text-zinc-400">Match nicht gefunden.</p>
        <button className="mt-3 text-emerald-300" onClick={() => router.push("/battle")}>
          Zur Queue
        </button>
      </div>
    );
  }

  const elapsed = now - new Date(match.started_at).getTime();
  const left = Math.max(0, match.time_limit_ms - elapsed);

  async function submit() {
    if (!match || !sessionId) return;
    setPending(true);
    const res = await api.post<SoloSubmitResult>("/api/solo/submit", {
      session_id: sessionId,
      code,
    });
    setPending(false);
    if (!res.success) {
      setLog((l) => [...l, res.error]);
      return;
    }
    if (res.data.compile_error) {
      setLog((l) => [...l, `Compile-Error: ${res.data.compile_error}`]);
      return;
    }
    if (!res.data.correct) {
      setLog((l) => [...l, `Du: ${res.data.tests_passed}/${res.data.tests_total} Tests`]);
      return;
    }
    const finish = await api.post<{ elo_change: number }>("/api/battle/finish", {
      win: true,
      opponent: match.opponent.username,
      problem_title: match.problem.title,
      duration_ms: elapsed,
    });
    const change = finish.success ? finish.data.elo_change : 18;
    setOver(`Sieg gegen ${match.opponent.username} (${change >= 0 ? "+" : ""}${change} ELO)`);
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_280px]">
      <div>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">{match.problem.title}</h1>
            <p className="text-sm text-zinc-500">{match.problem.description}</p>
          </div>
          <p className="font-mono text-2xl text-emerald-300">{formatDuration(left)}</p>
        </div>
        <CodeEditor value={code} onChange={setCode} />
        <button
          disabled={pending || Boolean(over) || left <= 0}
          onClick={() => void submit()}
          className="mt-4 rounded-xl bg-emerald-400 px-5 py-2.5 font-medium text-[#07110b] disabled:opacity-50"
        >
          {pending ? "Submit…" : "Lösung senden"}
        </button>
        {over ? <p className="mt-4 text-emerald-300">{over}</p> : null}
      </div>
      <Panel className="p-5">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Gegner</p>
        <p className="mt-1 text-lg text-white">{match.opponent.username}</p>
        <p className="font-mono text-sm text-zinc-400">{match.opponent.elo} ELO</p>
        <div className="mt-6 space-y-2 text-sm text-zinc-400">
          {log.length === 0 ? <p>Warte auf Live-Updates…</p> : null}
          {log.map((line) => (
            <p key={line} className="rounded-lg bg-black/30 px-3 py-2">
              {line}
            </p>
          ))}
        </div>
      </Panel>
    </main>
  );
}

export default function BattleMatchPage() {
  return (
    <Protected>
      <Arena />
    </Protected>
  );
}
