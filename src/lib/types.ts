export type Difficulty = "easy" | "medium" | "hard";

export type User = {
  id: string;
  username: string;
  email: string;
  elo: number;
  created_at: string;
};

export type ProblemListItem = {
  id: string;
  title: string;
  difficulty: Difficulty;
  test_case_count: number;
  solved: boolean;
  best_score: number | null;
};

export type Problem = ProblemListItem & {
  description: string;
  starter_code: string;
  example_input: string;
  example_output: string;
};

export type SoloSession = {
  session_id: string;
  problem: Problem;
  started_at: string;
};

export type SoloSubmitResult = {
  correct: boolean;
  compile_error?: string;
  tests_passed: number;
  tests_total: number;
  duration_ms?: number;
  status?: "completed" | "failed" | "timeout";
  best_score?: number | null;
};

export type SoloStats = {
  solved: number;
  attempts: number;
  best_times: { problem_id: string; title: string; duration_ms: number }[];
};

export type MatchHistoryItem = {
  id: string;
  opponent: string;
  problem_title: string;
  result: "win" | "loss";
  duration_ms: number;
  elo_change: number;
  finished_at: string;
};

export type LeaderboardEntry = {
  rank: number;
  username: string;
  elo: number;
  wins: number;
  losses: number;
};

export type BattleMatch = {
  id: string;
  problem: Problem;
  opponent: { username: string; elo: number };
  started_at: string;
  time_limit_ms: number;
};

export type BattleEvent = {
  type: "opponent_fail" | "opponent_progress" | "win" | "loss" | "timeout";
  message: string;
  tests_passed?: number;
  tests_total?: number;
  elo_change?: number;
};

export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = { success: false; error: string };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
