import type {
  ApiResponse,
  BattleMatch,
  LeaderboardEntry,
  MatchHistoryItem,
  Problem,
  ProblemListItem,
  SoloSession,
  SoloStats,
  SoloSubmitResult,
  User,
} from "./types";

type StoredUser = User & { password: string };

type SoloAttempt = {
  session_id: string;
  user_id: string;
  problem_id: string;
  started_at: number;
  finished_at?: number;
  duration_ms?: number;
  status: "in_progress" | "completed" | "failed" | "timeout";
  code?: string;
  last_was_compile_error?: boolean;
  submitted?: boolean;
};

type MockDb = {
  users: StoredUser[];
  refresh: Record<string, string>;
  attempts: SoloAttempt[];
  matches: MatchHistoryItem[];
};

const DB_KEY = "pyclash_mock_db";
const MIN_MS = 5_000;
const MAX_MS = 15 * 60 * 1000;

const PROBLEMS: Problem[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    title: "Two Sum",
    difficulty: "easy",
    test_case_count: 6,
    solved: false,
    best_score: null,
    description:
      "Gegeben ein Array `nums` und ein Ziel `target`, gib die Indizes zweier Zahlen zurück, die zusammen `target` ergeben.\n\nDu darfst dasselbe Element nicht zweimal verwenden. Es gibt genau eine Lösung.",
    starter_code: `def two_sum(nums, target):\n    # TODO: Indizes zurückgeben\n    pass\n`,
    example_input: "nums = [2, 7, 11, 15], target = 9",
    example_output: "[0, 1]",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    title: "Valid Parentheses",
    difficulty: "easy",
    test_case_count: 8,
    solved: false,
    best_score: null,
    description:
      "Prüfe, ob ein String aus Klammern `()[]{}` gültig ist.\n\nGültig heißt: jede öffnende Klammer hat eine schließende in der richtigen Reihenfolge.",
    starter_code: `def is_valid(s):\n    # TODO: True/False zurückgeben\n    pass\n`,
    example_input: 's = "()[]{}"',
    example_output: "True",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    title: "Longest Substring",
    difficulty: "medium",
    test_case_count: 7,
    solved: false,
    best_score: null,
    description:
      "Finde die Länge der längsten Teilzeichenkette ohne wiederholte Zeichen.",
    starter_code: `def length_of_longest_substring(s):\n    # TODO: Länge zurückgeben\n    pass\n`,
    example_input: 's = "abcabcbb"',
    example_output: "3",
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    title: "Merge Intervals",
    difficulty: "medium",
    test_case_count: 5,
    solved: false,
    best_score: null,
    description:
      "Gegeben Intervalle `[start, end]`, merge alle überlappenden Intervalle und gib die nicht-überlappenden zurück.",
    starter_code: `def merge(intervals):\n    # TODO: gemergte Intervalle\n    pass\n`,
    example_input: "intervals = [[1,3],[2,6],[8,10],[15,18]]",
    example_output: "[[1,6],[8,10],[15,18]]",
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    title: "Word Search",
    difficulty: "hard",
    test_case_count: 9,
    solved: false,
    best_score: null,
    description:
      "Ein 2D-Board aus Buchstaben. Existiert das Wort durch aufeinanderfolgende Nachbarzellen (horizontal/vertikal)? Jede Zelle darf nur einmal genutzt werden.",
    starter_code: `def exist(board, word):\n    # TODO: True/False\n    pass\n`,
    example_input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"',
    example_output: "True",
  },
];

const BOT_USERS: StoredUser[] = [
  demoUser("nova", 1420, 12),
  demoUser("bytefox", 1388, 18),
  demoUser("pyro", 1310, 40),
  demoUser("lambda", 1274, 55),
  demoUser("stackcat", 1190, 80),
  demoUser("nullptr", 1102, 120),
];

function demoUser(name: string, elo: number, daysAgo: number): StoredUser {
  const created = new Date(Date.now() - daysAgo * 86400000).toISOString();
  return {
    id: crypto.randomUUID(),
    username: name,
    email: `${name}@pyclash.dev`,
    password: "demo",
    elo,
    created_at: created,
  };
}

function loadDb(): MockDb {
  if (typeof window === "undefined") {
    return { users: [...BOT_USERS], refresh: {}, attempts: [], matches: [] };
  }
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    const db: MockDb = { users: [...BOT_USERS], refresh: {}, attempts: [], matches: [] };
    saveDb(db);
    return db;
  }
  try {
    return JSON.parse(raw) as MockDb;
  } catch {
    const db: MockDb = { users: [...BOT_USERS], refresh: {}, attempts: [], matches: [] };
    saveDb(db);
    return db;
  }
}

function saveDb(db: MockDb) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function tokenFor(user: StoredUser) {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      id: user.id,
      username: user.username,
      email: user.email,
      exp: Date.now() + 15 * 60 * 1000,
    }),
  );
  return `${header}.${payload}.mock`;
}

function ok<T>(data: T, status = 200): { status: number; body: ApiResponse<T> } {
  return { status, body: { success: true, data } };
}

function fail(error: string, status: number) {
  return { status, body: { success: false, error } as ApiResponse<never> };
}

function authUser(headers: Headers) {
  const raw = headers.get("authorization")?.split(" ")[1];
  if (!raw) return null;
  const parsed = parsePayload(raw);
  if (!parsed) return null;
  const db = loadDb();
  return db.users.find((u) => u.id === parsed.id) ?? null;
}

function parsePayload(token: string) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    return JSON.parse(atob(payload)) as { id: string; username: string; email: string; exp: number };
  } catch {
    return null;
  }
}

function bestFor(userId: string, problemId: string) {
  const db = loadDb();
  const times = db.attempts
    .filter((a) => a.user_id === userId && a.problem_id === problemId && a.status === "completed" && a.duration_ms)
    .map((a) => a.duration_ms as number);
  return times.length ? Math.min(...times) : null;
}

function withProblemMeta(userId: string | null, p: Problem): Problem {
  return {
    ...p,
    solved: userId ? bestFor(userId, p.id) !== null : false,
    best_score: userId ? bestFor(userId, p.id) : null,
  };
}

function grade(code: string, problem: Problem): SoloSubmitResult {
  const trimmed = code.trim();
  if (!trimmed.includes("def ") || trimmed.endsWith("pass")) {
    return {
      correct: false,
      compile_error: "SyntaxError: unexpected indent / empty function (Mock-Runner)",
      tests_passed: 0,
      tests_total: problem.test_case_count,
    };
  }
  if (!trimmed.includes("return")) {
    return {
      correct: false,
      tests_passed: Math.max(1, Math.floor(problem.test_case_count / 3)),
      tests_total: problem.test_case_count,
    };
  }
  const quality = Math.min(trimmed.length / 80, 1);
  if (quality < 0.35) {
    return {
      correct: false,
      tests_passed: problem.test_case_count - 2,
      tests_total: problem.test_case_count,
    };
  }
  return {
    correct: true,
    tests_passed: problem.test_case_count,
    tests_total: problem.test_case_count,
  };
}

export async function mockRequest(
  path: string,
  init: RequestInit,
): Promise<{ status: number; body: ApiResponse<unknown> }> {
  await delay(220 + Math.random() * 180);
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  const json = init.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};

  if (path === "/api/auth/register" && method === "POST") {
    const db = loadDb();
    const username = String(json.username ?? "");
    const email = String(json.email ?? "");
    const password = String(json.password ?? "");
    if (db.users.some((u) => u.email === email || u.username === username)) {
      return fail("Username oder E-Mail bereits vergeben", 400);
    }
    const user: StoredUser = {
      id: crypto.randomUUID(),
      username,
      email,
      password,
      elo: 1000,
      created_at: new Date().toISOString(),
    };
    db.users.push(user);
    const access = tokenFor(user);
    const refresh = crypto.randomUUID();
    db.refresh[refresh] = user.id;
    saveDb(db);
    localStorage.setItem("pyclash_refresh_token", refresh);
    return ok({ access_token: access, user: publicUser(user) }, 201);
  }

  if (path === "/api/auth/login" && method === "POST") {
    const db = loadDb();
    const email = String(json.email ?? "");
    const password = String(json.password ?? "");
    const user = db.users.find((u) => u.email === email && u.password === password);
    if (!user) return fail("E-Mail oder Passwort falsch", 401);
    const access = tokenFor(user);
    const refresh = crypto.randomUUID();
    db.refresh[refresh] = user.id;
    saveDb(db);
    localStorage.setItem("pyclash_refresh_token", refresh);
    return ok({ access_token: access, user: publicUser(user) });
  }

  if (path === "/api/auth/refresh" && method === "POST") {
    const db = loadDb();
    const refresh = localStorage.getItem("pyclash_refresh_token");
    if (!refresh || !db.refresh[refresh]) return fail("Refresh-Token ungültig", 401);
    const user = db.users.find((u) => u.id === db.refresh[refresh]);
    if (!user) return fail("User nicht gefunden", 401);
    return ok({ access_token: tokenFor(user) });
  }

  if (path === "/api/auth/logout" && method === "POST") {
    const db = loadDb();
    const refresh = localStorage.getItem("pyclash_refresh_token");
    if (refresh) delete db.refresh[refresh];
    localStorage.removeItem("pyclash_refresh_token");
    saveDb(db);
    return ok({ ok: true });
  }

  if (path === "/api/auth/me" && method === "GET") {
    const user = authUser(headers);
    if (!user) return fail("Nicht eingeloggt", 401);
    return ok({ user: publicUser(user) });
  }

  if (path === "/api/problems" && method === "GET") {
    const user = authUser(headers);
    const list: ProblemListItem[] = PROBLEMS.map((p) => {
      const meta = withProblemMeta(user?.id ?? null, p);
      return {
        id: meta.id,
        title: meta.title,
        difficulty: meta.difficulty,
        test_case_count: meta.test_case_count,
        solved: meta.solved,
        best_score: meta.best_score,
      };
    });
    return ok(list);
  }

  const problemMatch = path.match(/^\/api\/problems\/([^/]+)$/);
  if (problemMatch && method === "GET") {
    const user = authUser(headers);
    const problem = PROBLEMS.find((p) => p.id === problemMatch[1]);
    if (!problem) return fail("Problem nicht gefunden", 404);
    return ok(withProblemMeta(user?.id ?? null, problem));
  }

  if (path === "/api/solo/start" && method === "POST") {
    const user = authUser(headers);
    if (!user) return fail("Nicht eingeloggt", 401);
    const problem = PROBLEMS.find((p) => p.id === json.problem_id);
    if (!problem) return fail("Problem nicht gefunden", 404);
    const db = loadDb();
    const session: SoloAttempt = {
      session_id: crypto.randomUUID(),
      user_id: user.id,
      problem_id: problem.id,
      started_at: Date.now(),
      status: "in_progress",
    };
    db.attempts.push(session);
    saveDb(db);
    const data: SoloSession = {
      session_id: session.session_id,
      problem: withProblemMeta(user.id, problem),
      started_at: new Date(session.started_at).toISOString(),
    };
    return ok(data, 201);
  }

  if (path === "/api/solo/submit" && method === "POST") {
    const user = authUser(headers);
    if (!user) return fail("Nicht eingeloggt", 401);
    const db = loadDb();
    const session = db.attempts.find((a) => a.session_id === json.session_id && a.user_id === user.id);
    if (!session) return fail("Session nicht gefunden", 404);
    const problem = PROBLEMS.find((p) => p.id === session.problem_id);
    if (!problem) return fail("Problem nicht gefunden", 404);

    const now = Date.now();
    const elapsed = now - session.started_at;
    if (elapsed > MAX_MS) {
      session.status = "timeout";
      session.finished_at = session.started_at + MAX_MS;
      saveDb(db);
      return fail("Zeit abgelaufen (15 Minuten)", 400);
    }
    if (session.submitted && !session.last_was_compile_error) {
      return fail("Nur ein Submit pro Session (außer Compile-Error)", 400);
    }
    if (elapsed < MIN_MS) {
      return fail("Lösung unter 5 Sekunden – Cheating-Verdacht", 400);
    }

    const result = grade(String(json.code ?? ""), problem);
    session.code = String(json.code ?? "");
    if (result.compile_error) {
      session.last_was_compile_error = true;
      session.submitted = true;
      saveDb(db);
      return ok(result);
    }
    session.last_was_compile_error = false;
    session.submitted = true;
    if (result.correct) {
      session.status = "completed";
      session.finished_at = now;
      session.duration_ms = elapsed;
      result.duration_ms = elapsed;
      result.status = "completed";
    } else {
      session.status = "failed";
      session.finished_at = now;
      session.duration_ms = elapsed;
      result.duration_ms = elapsed;
      result.status = "failed";
    }
    saveDb(db);
    result.best_score = bestFor(user.id, problem.id);
    return ok(result);
  }

  if (path === "/api/solo/stats" && method === "GET") {
    const user = authUser(headers);
    if (!user) return fail("Nicht eingeloggt", 401);
    const db = loadDb();
    const mine = db.attempts.filter((a) => a.user_id === user.id);
    const completed = mine.filter((a) => a.status === "completed");
    const bestMap = new Map<string, number>();
    for (const a of completed) {
      if (!a.duration_ms) continue;
      const prev = bestMap.get(a.problem_id);
      if (!prev || a.duration_ms < prev) bestMap.set(a.problem_id, a.duration_ms);
    }
    const stats: SoloStats = {
      solved: bestMap.size,
      attempts: mine.length,
      best_times: [...bestMap.entries()].map(([problem_id, duration_ms]) => ({
        problem_id,
        title: PROBLEMS.find((p) => p.id === problem_id)?.title ?? "Unknown",
        duration_ms,
      })),
    };
    return ok(stats);
  }

  if (path === "/api/battle/queue" && method === "POST") {
    const user = authUser(headers);
    if (!user) return fail("Nicht eingeloggt", 401);
    return ok({ queued: true, elo: user.elo }, 201);
  }

  if (path === "/api/battle/match" && method === "POST") {
    const user = authUser(headers);
    if (!user) return fail("Nicht eingeloggt", 401);
    const problem = withProblemMeta(user.id, PROBLEMS[Math.floor(Math.random() * 3)]!);
    const opponent = BOT_USERS[Math.floor(Math.random() * BOT_USERS.length)]!;
    const match: BattleMatch = {
      id: crypto.randomUUID(),
      problem,
      opponent: { username: opponent.username, elo: opponent.elo },
      started_at: new Date().toISOString(),
      time_limit_ms: 10 * 60 * 1000,
    };
    return ok(match, 201);
  }

  if (path === "/api/battle/history" && method === "GET") {
    const user = authUser(headers);
    if (!user) return fail("Nicht eingeloggt", 401);
    const db = loadDb();
    return ok(db.matches.filter((m) => true).slice(0, 20));
  }

  if (path === "/api/battle/finish" && method === "POST") {
    const user = authUser(headers);
    if (!user) return fail("Nicht eingeloggt", 401);
    const db = loadDb();
    const win = Boolean(json.win);
    const change = win ? 18 : -18;
    user.elo += change;
    const item: MatchHistoryItem = {
      id: crypto.randomUUID(),
      opponent: String(json.opponent ?? "unknown"),
      problem_title: String(json.problem_title ?? "Battle"),
      result: win ? "win" : "loss",
      duration_ms: Number(json.duration_ms ?? 0),
      elo_change: change,
      finished_at: new Date().toISOString(),
    };
    db.matches.unshift(item);
    saveDb(db);
    return ok({ elo: user.elo, elo_change: change, result: item.result });
  }

  if (path === "/api/leaderboard" && method === "GET") {
    const db = loadDb();
    const ranked = [...db.users]
      .filter((u) => u.password !== "demo" || BOT_USERS.some((b) => b.username === u.username) || u.elo !== 1000 || true)
      .sort((a, b) => b.elo - a.elo)
      .slice(0, 20)
      .map((u, i): LeaderboardEntry => ({
        rank: i + 1,
        username: u.username,
        elo: u.elo,
        wins: Math.max(0, Math.round((u.elo - 900) / 40)),
        losses: Math.max(0, Math.round((1400 - u.elo) / 50)),
      }));
    return ok(ranked);
  }

  return fail("Route nicht gefunden", 404);
}

function publicUser(user: StoredUser): User {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    elo: user.elo,
    created_at: user.created_at,
  };
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
