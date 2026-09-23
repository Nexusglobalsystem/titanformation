import { createRequire } from "node:module";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(root + ".verification/package.json");
const { PGlite } = require("@electric-sql/pglite");
const { citext } = require("@electric-sql/pglite/contrib/citext");
const db = new PGlite({ extensions: { citext } });
await db.exec(`
create role anon; create role authenticated; create role service_role bypassrls;
create schema auth; create schema storage;
create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create table storage.buckets(id text primary key,name text,public boolean default false);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
alter table storage.objects enable row level security;
create function storage.foldername(text) returns text[] language sql as $$ select string_to_array($1,'/') $$;
grant usage on schema public,auth,storage to anon,authenticated;
grant execute on function auth.uid() to anon,authenticated;
alter default privileges in schema public grant select,insert,update,delete on tables to authenticated;
alter default privileges in schema public grant select on tables to anon;
`);
for (const name of (await readdir(root + "supabase/migrations"))
  .filter((n) => n.endsWith(".sql"))
  .sort()) {
  try {
    await db.exec(
      (await readFile(root + "supabase/migrations/" + name, "utf8")).replace(
        'create extension if not exists "pgcrypto";',
        "",
      ),
    );
  } catch (e) {
    console.error("Migration failed:", name, e.message);
    await db.close();
    process.exit(1);
  }
}
console.log("PASS: all migrations applied to isolated Postgres (PGlite).");

const id = (n) => "00000000-0000-4000-8000-" + String(n).padStart(12, "0");
const learner = id(1),
  other = id(2),
  manager = id(3),
  training = id(10),
  session = id(20),
  enrollment = id(30),
  module = id(40),
  lesson = id(50),
  quiz = id(60);
await db.query(
  "insert into auth.users(id,email) values ($1,$2),($3,$4),($5,$6)",
  [
    learner,
    "learner@test.invalid",
    other,
    "other@test.invalid",
    manager,
    "manager@test.invalid",
  ],
);
await db.query(
  "insert into user_roles(user_id,role) values($1,'gestionnaire')",
  [manager],
);
await db.query(
  `insert into trainings(id,slug,title,summary,objectives,prerequisites,target_audience,duration_hours,price_ht,modalities,access_delay,pedagogical_means,assessment_methods,accessibility_info,status)
values($1,'test','Test','Test','Test','Test','Test',1,0,'Test','Test','Test','Test','Test','publiee')`,
  [training],
);
await db.query(
  "insert into sessions(id,training_id,reference,status,starts_on,ends_on) values($1,$2,'TEST','ouverte','2026-01-01','2026-01-02')",
  [session, training],
);
await db.query(
  "insert into enrollments(id,session_id,learner_id,status,funding) values($1,$2,$3,'confirme','interne')",
  [enrollment, session, learner],
);
await db.query(
  "insert into modules(id,training_id,title,position) values($1,$2,'Module',0)",
  [module, training],
);
await db.query(
  "insert into lessons(id,module_id,title,type) values($1,$2,'Quiz','quiz')",
  [lesson, module],
);
await db.query(
  "insert into quizzes(id,lesson_id,questions_drawn,time_limit_minutes) values($1,$2,2,5)",
  [quiz, lesson],
);
for (let n = 0; n < 4; n++) {
  await db.query(
    "insert into questions(id,statement,kind) values($1,$2,'qcu')",
    [id(100 + n), "Question " + n],
  );
  await db.query(
    "insert into question_options(id,question_id,label,is_correct) values($1,$2,'Correct',true),($3,$2,'Wrong',false)",
    [id(200 + n), id(100 + n), id(300 + n)],
  );
  await db.query(
    "insert into quiz_items(quiz_id,question_id,position) values($1,$2,$3)",
    [quiz, id(100 + n), n],
  );
}
async function user(who, fn) {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [who]);
  await db.exec("set role authenticated");
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
    await db.exec("select set_config('request.jwt.claim.sub','',false)");
  }
}
async function denied(fn) {
  await assert.rejects(fn);
}
async function rpc(name, values) {
  return (
    await db.query(
      "select " +
        name +
        "(" +
        values.map((_, i) => "$" + (i + 1)).join(",") +
        ") as result",
      values,
    )
  ).rows[0].result;
}
await user(learner, () =>
  denied(() =>
    db.query(
      "insert into certificates(enrollment_id,certificate_number) values($1,$2)",
      [enrollment, "FAKE"],
    ),
  ),
);
console.log("PASS: certificate refused before completion.");
await user(learner, () =>
  denied(() =>
    db.query(
      "insert into learner_progress(enrollment_id,lesson_id,completed_at) values($1,$2,now())",
      [enrollment, lesson],
    ),
  ),
);
console.log("PASS: quiz completion cannot be forged.");
const first = await user(learner, () =>
  rpc("start_quiz_attempt", [lesson, enrollment]),
);
assert.equal(first.questions.length, 2);
assert(!JSON.stringify(first).includes("is_correct"));
const resumed = await user(learner, () =>
  rpc("start_quiz_attempt", [lesson, enrollment]),
);
assert.deepEqual(resumed, first);
console.log("PASS: draw persists across reloads and answer keys stay private.");
await user(other, () =>
  denied(() => rpc("submit_quiz_attempt", [first.attemptId, "[]"])),
);
await user(learner, () =>
  denied(() => db.query("select * from private.quiz_snapshots")),
);
console.log("PASS: ownership and private answer-key isolation.");
const answers = first.questions.map((q) => ({
  questionId: q.id,
  selectedOptionIds: [q.options.find((o) => o.label === "Correct").id],
}));
const result = await user(learner, () =>
  rpc("submit_quiz_attempt", [first.attemptId, JSON.stringify(answers)]),
);
assert.equal(result.score, 2);
assert.equal(result.maxScore, 2);
assert.equal(result.passed, true);
await user(learner, () =>
  denied(() =>
    rpc("submit_quiz_attempt", [first.attemptId, JSON.stringify(answers)]),
  ),
);
console.log(
  "PASS: sampled questions score 100%, completion is atomic, resubmission refused.",
);
const second = await user(learner, () =>
  rpc("start_quiz_attempt", [lesson, enrollment]),
);
await db.query(
  "update private.quiz_snapshots set expires_at=now()-interval '1 minute' where attempt_id=$1",
  [second.attemptId],
);
const expired = await user(learner, () =>
  rpc("submit_quiz_attempt", [
    second.attemptId,
    JSON.stringify(
      second.questions.map((q) => ({
        questionId: q.id,
        selectedOptionIds: [q.options.find((o) => o.label === "Correct").id],
      })),
    ),
  ]),
);
assert.equal(expired.passed, false);
assert.equal(expired.expired, true);
assert.equal(expired.score, 0);
console.log("PASS: server deadline rejects late success.");
await user(learner, () =>
  db.query(
    "insert into certificates(enrollment_id,certificate_number,issued_at) values($1,$2,$3)",
    [enrollment, "FORGED", "2000-01-01"],
  ),
);
const certificate = (
  await db.query("select * from certificates where enrollment_id=$1", [
    enrollment,
  ])
).rows[0];
assert.notEqual(certificate.certificate_number, "FORGED");
await user(learner, () =>
  denied(() =>
    db.query(
      "update certificates set certificate_number='EDITED' where enrollment_id=$1",
      [enrollment],
    ),
  ),
);
console.log("PASS: eligible certificate issued canonically and immutable.");
await db.exec(
  "delete from role_permissions where role='gestionnaire' and permission_key='formations.edit'",
);
const updated = await user(manager, () =>
  db.query("update trainings set title='FORBIDDEN' where id=$1 returning id", [
    training,
  ]),
);
assert.equal(updated.rows.length, 0);
const settings = await user(manager, () =>
  db.query(
    "update organization_settings set legal_name='FORBIDDEN' where id=1 returning id",
  ),
);
assert.equal(settings.rows.length, 0);
console.log(
  "PASS: revoked fine permissions enforced through direct SQL/API access.",
);
await db.query(
  "insert into lessons(id,module_id,title,type) values($1,$2,'Second quiz','quiz')",
  [id(51), module],
);
await db.query("insert into quizzes(id,lesson_id) values($1,$2)", [
  id(61),
  id(51),
]);
await db.query(
  "insert into quiz_attempts(quiz_id,enrollment_id,score,max_score,passed,submitted_at) values($1,$2,0,1,false,now())",
  [id(61), enrollment],
);
await db.query(
  "insert into certification_requirements(training_id,min_grade) values($1,70)",
  [training],
);
// Remove the previous certificate as the database owner, then verify eligibility anew.
await db.query("delete from certificates where enrollment_id=$1", [enrollment]);
await db.query("update lessons set is_mandatory=false where id=$1", [id(51)]);
await user(learner, () =>
  denied(() =>
    db.query(
      "insert into certificates(enrollment_id,certificate_number) values($1,$2)",
      [enrollment, "ZERO-EXCLUDED"],
    ),
  ),
);
console.log("PASS: 100% + 0% does not meet a 70% certificate threshold.");
await db.query(
  "insert into modules(id,training_id,title,position) values($1,$2,$3,1)",
  [id(41), training, "Locked module"],
);
await db.query(
  "insert into lessons(id,module_id,title,type) values($1,$2,'Read','texte')",
  [id(52), id(41)],
);
await db.query("update trainings set sequential_unlock=true where id=$1", [
  training,
]);
await user(learner, () =>
  denied(() =>
    db.query(
      "insert into learner_progress(enrollment_id,lesson_id,completed_at) values($1,$2,now())",
      [enrollment, id(52)],
    ),
  ),
);
console.log("PASS: sequential unlock enforced for direct writes.");
console.log("All isolated database regression checks passed.");

await db.close();
