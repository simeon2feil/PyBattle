import Link from "next/link";
import { Swords, Shield, Timer, Trophy } from "lucide-react";

const features = [
  {
    icon: Timer,
    title: "Solo-Mode",
    text: "Der Server besitzt die Zeit. Anti-Cheat, Bestzeiten, versteckte Tests.",
  },
  {
    icon: Swords,
    title: "1v1 Battles",
    text: "Matchmaking nach ELO, Live-Status, wer zuerst alle Tests knackt, gewinnt.",
  },
  {
    icon: Shield,
    title: "Sichere Auth",
    text: "JWT + Refresh-Cookie-Flow. Frontend spricht nur mit deiner API, nie mit der DB.",
  },
  {
    icon: Trophy,
    title: "Leaderboard",
    text: "Globales Ranking, Match-Historie und Profil-Stats.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-16">
      <section className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-emerald-300">
            Python Code Arena
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Schreib Code.
            <br />
            Schlag den Gegner.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-400">
            PyClash ist eine 1v1-Plattform für Python-Aufgaben. Solo gegen die Uhr
            oder live im Battle – geprüft gegen versteckte Test-Cases.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-emerald-400 px-5 py-3 font-medium text-[#07110b] hover:bg-emerald-300"
            >
              Jetzt starten
            </Link>
            <Link
              href="/problems"
              className="rounded-xl border border-white/10 px-5 py-3 text-zinc-200 hover:bg-white/5"
            >
              Probleme ansehen
            </Link>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-[#0e141c] p-6 font-mono text-sm shadow-[0_0_80px_rgba(61,255,154,0.08)]">
          <div className="mb-4 flex items-center justify-between text-xs text-zinc-500">
            <span>battle.py</span>
            <span className="text-emerald-400">6/6 tests passed</span>
          </div>
          <pre className="overflow-x-auto text-[13px] leading-6 text-zinc-300">{`def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i`}</pre>
        </div>
      </section>
      <section className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="rounded-2xl border border-white/8 bg-[#0e141c]/70 p-5">
            <f.icon className="mb-3 h-5 w-5 text-emerald-400" />
            <h2 className="font-medium text-white">{f.title}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{f.text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
