export function averageBestQuizScores(
  quizIds: string[],
  attempts: {
    quiz_id: string;
    score: number | null;
    max_score: number | null;
  }[],
): number {
  if (!quizIds.length) return 0;
  const best = new Map<string, number>();
  for (const attempt of attempts) {
    if (attempt.score === null || !attempt.max_score || attempt.max_score <= 0)
      continue;
    const score = Math.max(
      0,
      Math.min(100, (100 * attempt.score) / attempt.max_score),
    );
    best.set(attempt.quiz_id, Math.max(best.get(attempt.quiz_id) ?? 0, score));
  }
  return (
    quizIds.reduce((total, id) => total + (best.get(id) ?? 0), 0) /
    quizIds.length
  );
}
