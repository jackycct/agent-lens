import { runCommand } from "./process.js";

export async function currentCommit(repoPath: string): Promise<string | null> {
  const result = await runCommand("git", ["rev-parse", "HEAD"], { cwd: repoPath });
  return result.exitCode === 0 ? result.stdout.trim() : null;
}

export async function resetRepo(repoPath: string): Promise<void> {
  await runCommand("git", ["reset", "--hard", "HEAD"], { cwd: repoPath });
  await runCommand("git", ["clean", "-fd"], { cwd: repoPath });
}

export async function gitDiff(repoPath: string): Promise<string> {
  const result = await runCommand("git", ["diff", "--binary"], { cwd: repoPath });
  return result.stdout;
}

export async function gitDiffNumstat(repoPath: string): Promise<string> {
  const result = await runCommand("git", ["diff", "--numstat"], { cwd: repoPath });
  return result.stdout;
}

export interface DiffStats {
  files: number;
  added: number;
  deleted: number;
}

export function parseNumstat(output: string): DiffStats {
  const stats: DiffStats = { files: 0, added: 0, deleted: 0 };
  for (const line of output.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const [added, deleted] = line.split(/\s+/);
    stats.files += 1;
    stats.added += added === "-" ? 0 : Number.parseInt(added, 10) || 0;
    stats.deleted += deleted === "-" ? 0 : Number.parseInt(deleted, 10) || 0;
  }
  return stats;
}
