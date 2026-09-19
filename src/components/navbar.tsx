"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Swords, Zap } from "lucide-react";
import { useAuth } from "./auth-provider";

const links = [
  { href: "/problems", label: "Probleme" },
  { href: "/battle", label: "Battle" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-[#07090d]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400 text-[#07110b]">
            <Swords className="h-4 w-4" />
          </span>
          <span>
            Py<span className="text-emerald-400">Clash</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-zinc-400 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={
                pathname.startsWith(l.href)
                  ? "text-white"
                  : "hover:text-white transition-colors"
              }
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <Link href="/profile" className="hidden items-center gap-2 sm:flex">
                <span className="text-zinc-400">{user.username}</span>
                <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 font-mono text-xs text-emerald-300">
                  {user.elo} ELO
                </span>
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-zinc-300 hover:bg-white/5"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-zinc-300 hover:text-white">
                Login
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-400 px-3 py-1.5 font-medium text-[#07110b] hover:bg-emerald-300"
              >
                <Zap className="h-3.5 w-3.5" />
                Registrieren
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
