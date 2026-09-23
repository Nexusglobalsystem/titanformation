import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });
const uuid = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST")
    return json({ error: "Méthode non autorisée." }, 405);
  const authorization = req.headers.get("Authorization");
  if (!authorization) return json({ error: "Authentification requise." }, 401);
  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authorization } } },
  );
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) return json({ error: "Session invalide." }, 401);
  try {
    const raw = await req.text();
    if (raw.length > 100000)
      return json({ error: "Requête trop volumineuse." }, 413);
    const body = JSON.parse(raw);
    if (!body || typeof body !== "object")
      return json({ error: "Requête invalide." }, 400);
    let response;
    if (
      body.action === "start" &&
      uuid(body.lessonId) &&
      (body.enrollmentId === undefined || uuid(body.enrollmentId))
    ) {
      response = await client.rpc("start_quiz_attempt", {
        p_lesson_id: body.lessonId,
        p_enrollment_id: body.enrollmentId ?? null,
      });
    } else if (
      body.action === "submit" &&
      uuid(body.attemptId) &&
      Array.isArray(body.answers)
    ) {
      if (
        !body.answers.every(
          (a: { questionId?: unknown; selectedOptionIds?: unknown }) =>
            a &&
            uuid(a.questionId) &&
            Array.isArray(a.selectedOptionIds) &&
            a.selectedOptionIds.every(uuid),
        )
      )
        return json({ error: "Réponses invalides." }, 400);
      response = await client.rpc("submit_quiz_attempt", {
        p_attempt_id: body.attemptId,
        p_answers: body.answers,
      });
    } else return json({ error: "Requête invalide." }, 400);
    if (response.error)
      return json(
        {
          error:
            response.error.code === "P0001" || response.error.code === "42501"
              ? response.error.message
              : "Le quiz est temporairement indisponible.",
        },
        response.error.code === "42501" ? 403 : 400,
      );
    return json(response.data);
  } catch {
    return json({ error: "Requête invalide." }, 400);
  }
});
