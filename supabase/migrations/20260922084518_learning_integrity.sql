-- Learning integrity: authoritative checks in Postgres, shared by web and mobile.
-- Apply before deploying the updated quiz-attempt Edge Function.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.assert_lesson_access(p_enrollment uuid, p_lesson uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_training uuid; v_module modules%rowtype; v_sequential boolean;
begin
  select s.training_id into v_training from enrollments e join sessions s on s.id=e.session_id
    where e.id=p_enrollment and e.learner_id=auth.uid() and e.status in ('confirme','termine');
  if v_training is null then raise exception 'Inscription non autorisée.' using errcode='42501'; end if;
  select m.* into v_module from modules m join lessons l on l.module_id=m.id where l.id=p_lesson and m.training_id=v_training;
  if v_module.id is null then raise exception 'Leçon étrangère à cette formation.' using errcode='42501'; end if;
  select sequential_unlock into v_sequential from trainings where id=v_training;
  if v_sequential and exists (
    select 1 from modules m join lessons l on l.module_id=m.id
    where m.training_id=v_training and m.position<v_module.position and not exists (
      select 1 from learner_progress p where p.enrollment_id=p_enrollment and p.lesson_id=l.id and p.completed_at is not null
    )
  ) then raise exception 'Terminez les modules précédents.' using errcode='42501'; end if;
end $$;
revoke all on function private.assert_lesson_access(uuid,uuid) from public;

create or replace function private.guard_progress()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  perform private.assert_lesson_access(new.enrollment_id,new.lesson_id);
  if tg_op='UPDATE' and (new.enrollment_id<>old.enrollment_id or new.lesson_id<>old.lesson_id) then
    raise exception 'La progression ne peut pas être réaffectée.';
  end if;
  if new.completed_at is not null and exists (select 1 from lessons where id=new.lesson_id and type='quiz')
    and not exists (select 1 from quiz_attempts a join quizzes q on q.id=a.quiz_id
      where a.enrollment_id=new.enrollment_id and q.lesson_id=new.lesson_id and a.passed and a.submitted_at is not null)
  then raise exception 'Validez le quiz pour terminer cette leçon.' using errcode='42501'; end if;
  if new.completed_at is not null then new.completed_at:=coalesce(case when tg_op='UPDATE' then old.completed_at end,now()); end if;
  return new;
end $$;
revoke all on function private.guard_progress() from public;
create trigger guard_learning_progress before insert or update on learner_progress for each row execute function private.guard_progress();

-- A certificate can only be issued once and only after database-side validation.
drop policy "apprenant gere son certificat" on certificates;
create policy "learner reads own certificate" on certificates for select to authenticated
  using (exists(select 1 from enrollments e where e.id=enrollment_id and e.learner_id=auth.uid()));
create policy "learner requests own certificate" on certificates for insert to authenticated
  with check (exists(select 1 from enrollments e where e.id=enrollment_id and e.learner_id=auth.uid()));
revoke update, delete on certificates from authenticated;
create or replace function private.validate_certificate()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_training uuid; r certification_requirements%rowtype; v_total int; v_missing int; v_pct numeric;
begin
  select s.training_id into v_training from enrollments e join sessions s on s.id=e.session_id
    where e.id=new.enrollment_id and e.learner_id=auth.uid() and e.status in ('confirme','termine') for update of e;
  if v_training is null then raise exception 'Inscription non autorisée.' using errcode='42501'; end if;
  select * into r from certification_requirements where training_id=v_training;
  select count(*),count(*) filter(where p.completed_at is null) into v_total,v_missing
    from lessons l join modules m on m.id=l.module_id
    left join learner_progress p on p.lesson_id=l.id and p.enrollment_id=new.enrollment_id
    where m.training_id=v_training and l.is_mandatory and (
      r.id is null or not exists(select 1 from certification_required_modules where requirement_id=r.id)
      or m.id in(select module_id from certification_required_modules where requirement_id=r.id));
  if v_total=0 or v_missing>0 then raise exception 'Les leçons obligatoires ne sont pas terminées.' using errcode='42501'; end if;
  if r.min_attendance_pct is not null then
    select coalesce(100.0*count(*) filter(where present)/nullif(count(*),0),100) into v_pct from attendances where enrollment_id=new.enrollment_id;
    if v_pct<r.min_attendance_pct then raise exception 'Assiduité insuffisante.' using errcode='42501'; end if;
  end if;
  if r.min_grade is not null then
    select avg(coalesce((select max(100.0*a.score/nullif(a.max_score,0)) from quiz_attempts a
      where a.quiz_id=q.id and a.enrollment_id=new.enrollment_id and a.submitted_at is not null),0)) into v_pct
    from quizzes q join lessons l on l.id=q.lesson_id join modules m on m.id=l.module_id where m.training_id=v_training;
    if v_pct is not null and v_pct<r.min_grade then raise exception 'Note moyenne insuffisante.' using errcode='42501'; end if;
  end if;
  if r.requires_final_exam and not exists(select 1 from quiz_attempts a join quizzes q on q.id=a.quiz_id
    join lessons l on l.id=q.lesson_id join modules m on m.id=l.module_id
    where a.enrollment_id=new.enrollment_id and q.lesson_id=r.final_exam_lesson_id and m.training_id=v_training and a.passed and a.submitted_at is not null)
  then raise exception 'Examen final non validé.' using errcode='42501'; end if;
  if r.requires_pedagogical_signoff and not exists(select 1 from certification_signoffs where enrollment_id=new.enrollment_id)
  then raise exception 'Validation pédagogique requise.' using errcode='42501'; end if;
  new.certificate_number:='CERT-'||to_char(now(),'YYYY')||'-'||upper(replace(new.enrollment_id::text,'-',''));
  new.issued_at:=now();
  return new;
end $$;
revoke all on function private.validate_certificate() from public;
create trigger validate_certificate before insert on certificates for each row execute function private.validate_certificate();

-- The answer key and immutable question draw never appear in the public API.
create table private.quiz_snapshots (
  attempt_id uuid primary key references public.quiz_attempts(id) on delete cascade,
  questions jsonb not null,
  pass_threshold numeric not null,
  expires_at timestamptz,
  time_limit_minutes int
);
alter table private.quiz_snapshots enable row level security;
revoke all on private.quiz_snapshots from public,anon,authenticated;

create or replace function public.start_quiz_attempt(p_lesson_id uuid,p_enrollment_id uuid default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_enrollment uuid; q quizzes%rowtype; a quiz_attempts%rowtype; s private.quiz_snapshots%rowtype;
  v_questions jsonb; v_public jsonb; v_number int; v_count int;
begin
  if auth.uid() is null then raise exception 'Authentification requise.' using errcode='42501'; end if;
  select e.id into v_enrollment from enrollments e join sessions se on se.id=e.session_id
    join modules m on m.training_id=se.training_id join lessons l on l.module_id=m.id
    where l.id=p_lesson_id and e.learner_id=auth.uid() and e.status in ('confirme','termine')
    and (p_enrollment_id is null or e.id=p_enrollment_id) order by e.created_at desc limit 1 for update of e;
  perform private.assert_lesson_access(v_enrollment,p_lesson_id);
  select * into q from quizzes where lesson_id=p_lesson_id;
  if q.id is null then raise exception 'Quiz introuvable.'; end if;
  select * into a from quiz_attempts where enrollment_id=v_enrollment and quiz_id=q.id and submitted_at is null order by attempt_number desc limit 1;
  if a.id is not null then
    select * into s from private.quiz_snapshots where attempt_id=a.id;
    -- Legacy attempts have no reliable draw; expire them instead of guessing it.
    if s.attempt_id is null or (s.expires_at is not null and now()>s.expires_at) then
      update quiz_attempts set submitted_at=now(),score=0,max_score=0,passed=false where id=a.id;
      a.id:=null;
    end if;
  end if;
  if a.id is null then
    select coalesce(max(attempt_number),0)+1,count(*) into v_number,v_count from quiz_attempts where enrollment_id=v_enrollment and quiz_id=q.id;
    if q.max_attempts is not null and v_count>=q.max_attempts then raise exception 'Nombre maximal de tentatives atteint.'; end if;
    select jsonb_agg(item order by ord) into v_questions from (
      select jsonb_build_object('id',qu.id,'statement',qu.statement,'kind',qu.kind,'explanation',qu.explanation,'points',qi.points,
        'options',(select jsonb_agg(jsonb_build_object('id',o.id,'label',o.label,'is_correct',o.is_correct) order by o.position,o.id) from question_options o where o.question_id=qu.id)) item,
        case when q.shuffle_questions or q.questions_drawn is not null then random() else qi.position::float end ord
      from quiz_items qi join questions qu on qu.id=qi.question_id where qi.quiz_id=q.id
      order by ord,qu.id limit q.questions_drawn
    ) drawn;
    if v_questions is null or jsonb_array_length(v_questions)=0 then raise exception 'Quiz sans questions.'; end if;
    if exists(select 1 from jsonb_array_elements(v_questions) x where x->>'kind'='texte_libre' or
      not exists(select 1 from jsonb_array_elements(x->'options') o where (o->>'is_correct')::boolean))
    then raise exception 'Le quiz contient une question non configurée pour la correction automatique.'; end if;
    insert into quiz_attempts(quiz_id,enrollment_id,attempt_number) values(q.id,v_enrollment,v_number) returning * into a;
    insert into private.quiz_snapshots values(a.id,v_questions,q.pass_threshold,
      case when q.time_limit_minutes is not null then a.started_at+make_interval(mins=>q.time_limit_minutes) end,q.time_limit_minutes) returning * into s;
  end if;
  select jsonb_agg(jsonb_build_object('id',x->'id','statement',x->'statement','kind',x->'kind','options',
    (select jsonb_agg(o-'is_correct') from jsonb_array_elements(x->'options') o))) into v_public from jsonb_array_elements(s.questions) x;
  return jsonb_build_object('attemptId',a.id,'passThreshold',s.pass_threshold,'timeLimitMinutes',s.time_limit_minutes,
    'expiresAt',s.expires_at,'questions',v_public);
end $$;
revoke all on function public.start_quiz_attempt(uuid,uuid) from public,anon;
grant execute on function public.start_quiz_attempt(uuid,uuid) to authenticated;

create or replace function public.submit_quiz_attempt(p_attempt_id uuid,p_answers jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare a quiz_attempts%rowtype; s private.quiz_snapshots%rowtype; x jsonb; v_selected jsonb; v_correct jsonb;
  v_ok boolean; v_expired boolean; v_score numeric:=0; v_max numeric:=0; v_results jsonb:='[]'; v_passed boolean; v_lesson uuid;
begin
  if auth.uid() is null then raise exception 'Authentification requise.' using errcode='42501'; end if;
  select qa.* into a from quiz_attempts qa join enrollments e on e.id=qa.enrollment_id
    where qa.id=p_attempt_id and e.learner_id=auth.uid() and e.status in ('confirme','termine') for update of qa;
  if a.id is null then raise exception 'Tentative non autorisée.' using errcode='42501'; end if;
  if a.submitted_at is not null then raise exception 'Cette tentative a déjà été soumise.'; end if;
  select * into s from private.quiz_snapshots where attempt_id=a.id;
  if s.attempt_id is null then raise exception 'Redémarrez le quiz pour créer une nouvelle tentative.'; end if;
  if jsonb_typeof(p_answers) is distinct from 'array' or jsonb_array_length(p_answers)>jsonb_array_length(s.questions)
    then raise exception 'Réponses invalides.'; end if;
  if exists(select 1 from jsonb_array_elements(p_answers) ans where
    jsonb_typeof(ans->'selectedOptionIds') is distinct from 'array' or not exists(select 1 from jsonb_array_elements(s.questions) sq where sq->>'id'=ans->>'questionId'))
    or exists(select 1 from jsonb_array_elements(p_answers) ans group by ans->>'questionId' having count(*)>1)
    then raise exception 'Réponses invalides ou dupliquées.'; end if;
  v_expired:=s.expires_at is not null and now()>s.expires_at;
  for x in select value from jsonb_array_elements(s.questions) loop
    select coalesce(jsonb_agg(o->'id'),'[]') into v_correct from jsonb_array_elements(x->'options') o where (o->>'is_correct')::boolean;
    select ans->'selectedOptionIds' into v_selected from jsonb_array_elements(p_answers) ans where ans->>'questionId'=x->>'id';
    v_selected:=coalesce(v_selected,'[]');
    if exists(select 1 from jsonb_array_elements_text(v_selected) sel where not exists(select 1 from jsonb_array_elements(x->'options') o where o->>'id'=sel))
      then raise exception 'Option étrangère à la question.'; end if;
    v_ok:=not v_expired and v_selected @> v_correct and v_correct @> v_selected;
    v_max:=v_max+(x->>'points')::numeric;
    if v_ok then v_score:=v_score+(x->>'points')::numeric; end if;
    insert into quiz_answers(attempt_id,question_id,selected_option_ids,is_correct,points_awarded)
      values(a.id,(x->>'id')::uuid,array(select value::uuid from jsonb_array_elements_text(v_selected)),v_ok,case when v_ok then (x->>'points')::numeric else 0 end);
    v_results:=v_results||jsonb_build_array(jsonb_build_object('questionId',x->'id','isCorrect',v_ok,'correctOptionIds',v_correct,'explanation',x->'explanation'));
  end loop;
  v_passed:=not v_expired and v_max>0 and 100*v_score/v_max>=s.pass_threshold;
  update quiz_attempts set score=v_score,max_score=v_max,passed=v_passed,submitted_at=now() where id=a.id;
  if v_passed then
    select lesson_id into v_lesson from quizzes where id=a.quiz_id;
    insert into learner_progress(enrollment_id,lesson_id,started_at,completed_at) values(a.enrollment_id,v_lesson,a.started_at,now())
      on conflict(enrollment_id,lesson_id) do update set completed_at=coalesce(learner_progress.completed_at,excluded.completed_at);
  end if;
  return jsonb_build_object('score',v_score,'maxScore',v_max,'passed',v_passed,'expired',v_expired,'passThreshold',s.pass_threshold,'results',v_results);
end $$;
revoke all on function public.submit_quiz_attempt(uuid,jsonb) from public,anon;
grant execute on function public.submit_quiz_attempt(uuid,jsonb) to authenticated;

-- Restrictive policies intersect the existing ownership/RLS rules rather than
-- introducing an alternative permissive path. Read-only access is independent.
create policy "permission_select" on public.profiles as restrictive for select to authenticated using (not public.is_staff() or public.has_permission('users.view'));
create policy "permission_insert" on public.profiles as restrictive for insert to authenticated with check (not public.is_staff() or public.has_permission('users.edit'));
create policy "permission_update" on public.profiles as restrictive for update to authenticated using (not public.is_staff() or public.has_permission('users.edit')) with check (not public.is_staff() or public.has_permission('users.edit'));
create policy "permission_delete" on public.profiles as restrictive for delete to authenticated using (not public.is_staff() or public.has_permission('users.edit'));
create policy "permission_select" on public.trainings as restrictive for select to authenticated using (not public.is_staff() or public.has_permission('formations.view'));
create policy "permission_insert" on public.trainings as restrictive for insert to authenticated with check (not public.is_staff() or public.has_permission('formations.create'));
create policy "permission_update" on public.trainings as restrictive for update to authenticated using (not public.is_staff() or public.has_permission('formations.edit')) with check (not public.is_staff() or public.has_permission('formations.edit'));
create policy "permission_delete" on public.trainings as restrictive for delete to authenticated using (not public.is_staff() or public.has_permission('formations.delete'));
create policy "permission_select" on public.modules as restrictive for select to authenticated using (not public.is_staff() or public.has_permission('formations.view'));
create policy "permission_insert" on public.modules as restrictive for insert to authenticated with check (not public.is_staff() or public.has_permission('formations.edit'));
create policy "permission_update" on public.modules as restrictive for update to authenticated using (not public.is_staff() or public.has_permission('formations.edit')) with check (not public.is_staff() or public.has_permission('formations.edit'));
create policy "permission_delete" on public.modules as restrictive for delete to authenticated using (not public.is_staff() or public.has_permission('formations.edit'));
create policy "permission_select" on public.lessons as restrictive for select to authenticated using (not public.is_staff() or public.has_permission('formations.view'));
create policy "permission_insert" on public.lessons as restrictive for insert to authenticated with check (not public.is_staff() or public.has_permission('formations.edit'));
create policy "permission_update" on public.lessons as restrictive for update to authenticated using (not public.is_staff() or public.has_permission('formations.edit')) with check (not public.is_staff() or public.has_permission('formations.edit'));
create policy "permission_delete" on public.lessons as restrictive for delete to authenticated using (not public.is_staff() or public.has_permission('formations.edit'));
create policy "permission_select" on public.questions as restrictive for select to authenticated using (not public.is_staff() or public.has_permission('assessments.view'));
create policy "permission_insert" on public.questions as restrictive for insert to authenticated with check (not public.is_staff() or public.has_permission('assessments.manage'));
create policy "permission_update" on public.questions as restrictive for update to authenticated using (not public.is_staff() or public.has_permission('assessments.manage')) with check (not public.is_staff() or public.has_permission('assessments.manage'));
create policy "permission_delete" on public.questions as restrictive for delete to authenticated using (not public.is_staff() or public.has_permission('assessments.manage'));
create policy "permission_select" on public.question_options as restrictive for select to authenticated using (not public.is_staff() or public.has_permission('assessments.view'));
create policy "permission_insert" on public.question_options as restrictive for insert to authenticated with check (not public.is_staff() or public.has_permission('assessments.manage'));
create policy "permission_update" on public.question_options as restrictive for update to authenticated using (not public.is_staff() or public.has_permission('assessments.manage')) with check (not public.is_staff() or public.has_permission('assessments.manage'));
create policy "permission_delete" on public.question_options as restrictive for delete to authenticated using (not public.is_staff() or public.has_permission('assessments.manage'));
create policy "permission_select" on public.quizzes as restrictive for select to authenticated using (not public.is_staff() or public.has_permission('assessments.view'));
create policy "permission_insert" on public.quizzes as restrictive for insert to authenticated with check (not public.is_staff() or public.has_permission('assessments.manage'));
create policy "permission_update" on public.quizzes as restrictive for update to authenticated using (not public.is_staff() or public.has_permission('assessments.manage')) with check (not public.is_staff() or public.has_permission('assessments.manage'));
create policy "permission_delete" on public.quizzes as restrictive for delete to authenticated using (not public.is_staff() or public.has_permission('assessments.manage'));
create policy "permission_select" on public.quiz_items as restrictive for select to authenticated using (not public.is_staff() or public.has_permission('assessments.view'));
create policy "permission_insert" on public.quiz_items as restrictive for insert to authenticated with check (not public.is_staff() or public.has_permission('assessments.manage'));
create policy "permission_update" on public.quiz_items as restrictive for update to authenticated using (not public.is_staff() or public.has_permission('assessments.manage')) with check (not public.is_staff() or public.has_permission('assessments.manage'));
create policy "permission_delete" on public.quiz_items as restrictive for delete to authenticated using (not public.is_staff() or public.has_permission('assessments.manage'));
create policy "permission_select" on public.sessions as restrictive for select to authenticated using (not public.is_staff() or public.has_permission('sessions.view'));
create policy "permission_insert" on public.sessions as restrictive for insert to authenticated with check (not public.is_staff() or public.has_permission('sessions.create'));
create policy "permission_update" on public.sessions as restrictive for update to authenticated using (not public.is_staff() or public.has_permission('sessions.edit')) with check (not public.is_staff() or public.has_permission('sessions.edit'));
create policy "permission_delete" on public.sessions as restrictive for delete to authenticated using (not public.is_staff() or public.has_permission('sessions.cancel'));
create policy "permission_select" on public.session_slots as restrictive for select to authenticated using (not public.is_staff() or public.has_permission('sessions.view'));
create policy "permission_insert" on public.session_slots as restrictive for insert to authenticated with check (not public.is_staff() or public.has_permission('sessions.edit'));
create policy "permission_update" on public.session_slots as restrictive for update to authenticated using (not public.is_staff() or public.has_permission('sessions.edit')) with check (not public.is_staff() or public.has_permission('sessions.edit'));
create policy "permission_delete" on public.session_slots as restrictive for delete to authenticated using (not public.is_staff() or public.has_permission('sessions.edit'));
create policy "permission_select" on public.session_trainers as restrictive for select to authenticated using (not public.is_staff() or public.has_permission('trainers.view'));
create policy "permission_insert" on public.session_trainers as restrictive for insert to authenticated with check (not public.is_staff() or public.has_permission('trainers.assign'));
create policy "permission_update" on public.session_trainers as restrictive for update to authenticated using (not public.is_staff() or public.has_permission('trainers.assign')) with check (not public.is_staff() or public.has_permission('trainers.assign'));
create policy "permission_delete" on public.session_trainers as restrictive for delete to authenticated using (not public.is_staff() or public.has_permission('trainers.assign'));
create policy "permission_select" on public.enrollments as restrictive for select to authenticated using (not public.is_staff() or public.has_permission('learners.view'));
create policy "permission_insert" on public.enrollments as restrictive for insert to authenticated with check (not public.is_staff() or public.has_permission('learners.approve'));
create policy "permission_update" on public.enrollments as restrictive for update to authenticated using (not public.is_staff() or public.has_permission('learners.approve')) with check (not public.is_staff() or public.has_permission('learners.approve'));
create policy "permission_delete" on public.enrollments as restrictive for delete to authenticated using (not public.is_staff() or public.has_permission('learners.reject'));
create policy "permission_select" on public.attendances as restrictive for select to authenticated using (not public.is_staff() or public.has_permission('learners.view'));
create policy "permission_insert" on public.attendances as restrictive for insert to authenticated with check (not public.is_staff() or public.has_permission('learners.approve'));
create policy "permission_update" on public.attendances as restrictive for update to authenticated using (not public.is_staff() or public.has_permission('learners.approve')) with check (not public.is_staff() or public.has_permission('learners.approve'));
create policy "permission_delete" on public.attendances as restrictive for delete to authenticated using (not public.is_staff() or public.has_permission('learners.approve'));
create policy "permission_select" on public.documents as restrictive for select to authenticated using (not public.is_staff() or public.has_permission('documents.view'));
create policy "permission_insert" on public.documents as restrictive for insert to authenticated with check (not public.is_staff() or public.has_permission('documents.manage'));
create policy "permission_update" on public.documents as restrictive for update to authenticated using (not public.is_staff() or public.has_permission('documents.manage')) with check (not public.is_staff() or public.has_permission('documents.manage'));
create policy "permission_delete" on public.documents as restrictive for delete to authenticated using (not public.is_staff() or public.has_permission('documents.manage'));
create policy "permission_select" on public.claims as restrictive for select to authenticated using (not public.is_staff() or public.has_permission('claims.view'));
create policy "permission_insert" on public.claims as restrictive for insert to authenticated with check (not public.is_staff() or public.has_permission('claims.manage'));
create policy "permission_update" on public.claims as restrictive for update to authenticated using (not public.is_staff() or public.has_permission('claims.manage')) with check (not public.is_staff() or public.has_permission('claims.manage'));
create policy "permission_delete" on public.claims as restrictive for delete to authenticated using (not public.is_staff() or public.has_permission('claims.manage'));
create policy "permission_select" on public.evaluation_forms as restrictive for select to authenticated using (not public.is_staff() or public.has_permission('assessments.view'));
create policy "permission_insert" on public.evaluation_forms as restrictive for insert to authenticated with check (not public.is_staff() or public.has_permission('assessments.manage'));
create policy "permission_update" on public.evaluation_forms as restrictive for update to authenticated using (not public.is_staff() or public.has_permission('assessments.manage')) with check (not public.is_staff() or public.has_permission('assessments.manage'));
create policy "permission_delete" on public.evaluation_forms as restrictive for delete to authenticated using (not public.is_staff() or public.has_permission('assessments.manage'));
create policy "permission_select" on public.organization_settings as restrictive for select to authenticated using (not public.is_staff() or public.has_permission('settings.view'));
create policy "permission_insert" on public.organization_settings as restrictive for insert to authenticated with check (not public.is_staff() or public.has_permission('settings.edit'));
create policy "permission_update" on public.organization_settings as restrictive for update to authenticated using (not public.is_staff() or public.has_permission('settings.edit')) with check (not public.is_staff() or public.has_permission('settings.edit'));
create policy "permission_delete" on public.organization_settings as restrictive for delete to authenticated using (not public.is_staff() or public.has_permission('settings.edit'));
create policy "permission_select" on public.certification_requirements as restrictive for select to authenticated using (not public.is_staff() or public.has_permission('formations.view'));
create policy "permission_insert" on public.certification_requirements as restrictive for insert to authenticated with check (not public.is_staff() or public.has_permission('assessments.manage'));
create policy "permission_update" on public.certification_requirements as restrictive for update to authenticated using (not public.is_staff() or public.has_permission('assessments.manage')) with check (not public.is_staff() or public.has_permission('assessments.manage'));
create policy "permission_delete" on public.certification_requirements as restrictive for delete to authenticated using (not public.is_staff() or public.has_permission('assessments.manage'));
create policy "permission_select" on public.certification_required_modules as restrictive for select to authenticated using (not public.is_staff() or public.has_permission('formations.view'));
create policy "permission_insert" on public.certification_required_modules as restrictive for insert to authenticated with check (not public.is_staff() or public.has_permission('assessments.manage'));
create policy "permission_update" on public.certification_required_modules as restrictive for update to authenticated using (not public.is_staff() or public.has_permission('assessments.manage')) with check (not public.is_staff() or public.has_permission('assessments.manage'));
create policy "permission_delete" on public.certification_required_modules as restrictive for delete to authenticated using (not public.is_staff() or public.has_permission('assessments.manage'));
create policy "permission_select" on public.certification_signoffs as restrictive for select to authenticated using (not public.is_staff() or public.has_permission('learners.view'));
create policy "permission_insert" on public.certification_signoffs as restrictive for insert to authenticated with check (not public.is_staff() or public.has_permission('assessments.manage'));
create policy "permission_update" on public.certification_signoffs as restrictive for update to authenticated using (not public.is_staff() or public.has_permission('assessments.manage')) with check (not public.is_staff() or public.has_permission('assessments.manage'));
create policy "permission_delete" on public.certification_signoffs as restrictive for delete to authenticated using (not public.is_staff() or public.has_permission('assessments.manage'));
create policy "permission_select" on public.programmes as restrictive for select to authenticated using (not public.is_staff() or public.has_permission('formations.view'));
create policy "permission_insert" on public.programmes as restrictive for insert to authenticated with check (not public.is_staff() or public.has_permission('formations.create'));
create policy "permission_update" on public.programmes as restrictive for update to authenticated using (not public.is_staff() or public.has_permission('formations.edit')) with check (not public.is_staff() or public.has_permission('formations.edit'));
create policy "permission_delete" on public.programmes as restrictive for delete to authenticated using (not public.is_staff() or public.has_permission('formations.delete'));
create policy "permission_select" on public.programme_trainings as restrictive for select to authenticated using (not public.is_staff() or public.has_permission('formations.view'));
create policy "permission_insert" on public.programme_trainings as restrictive for insert to authenticated with check (not public.is_staff() or public.has_permission('formations.edit'));
create policy "permission_update" on public.programme_trainings as restrictive for update to authenticated using (not public.is_staff() or public.has_permission('formations.edit')) with check (not public.is_staff() or public.has_permission('formations.edit'));
create policy "permission_delete" on public.programme_trainings as restrictive for delete to authenticated using (not public.is_staff() or public.has_permission('formations.edit'));
create policy "permission_select" on public.training_steps as restrictive for select to authenticated using (not public.is_staff() or public.has_permission('formations.view'));
create policy "permission_insert" on public.training_steps as restrictive for insert to authenticated with check (not public.is_staff() or public.has_permission('formations.edit'));
create policy "permission_update" on public.training_steps as restrictive for update to authenticated using (not public.is_staff() or public.has_permission('formations.edit')) with check (not public.is_staff() or public.has_permission('formations.edit'));
create policy "permission_delete" on public.training_steps as restrictive for delete to authenticated using (not public.is_staff() or public.has_permission('formations.edit'));
create policy "permission_select" on public.access_grants as restrictive for select to authenticated using (not public.is_staff() or public.has_permission('learners.view'));
create policy "permission_insert" on public.access_grants as restrictive for insert to authenticated with check (not public.is_staff() or public.has_permission('learners.approve'));
create policy "permission_update" on public.access_grants as restrictive for update to authenticated using (not public.is_staff() or public.has_permission('learners.approve')) with check (not public.is_staff() or public.has_permission('learners.approve'));
create policy "permission_delete" on public.access_grants as restrictive for delete to authenticated using (not public.is_staff() or public.has_permission('learners.reject'));
create policy "permission_select" on public.bookings as restrictive for select to authenticated using (not public.is_staff() or public.has_permission('bookings.view'));
create policy "permission_insert" on public.bookings as restrictive for insert to authenticated with check (not public.is_staff() or public.has_permission('bookings.manage'));
create policy "permission_update" on public.bookings as restrictive for update to authenticated using (not public.is_staff() or public.has_permission('bookings.manage')) with check (not public.is_staff() or public.has_permission('bookings.manage'));
create policy "permission_delete" on public.bookings as restrictive for delete to authenticated using (not public.is_staff() or public.has_permission('bookings.manage'));
create policy "permission_select" on public.trainer_availabilities as restrictive for select to authenticated using (not public.is_staff() or public.has_permission('trainers.view'));
create policy "permission_insert" on public.trainer_availabilities as restrictive for insert to authenticated with check (not public.is_staff() or public.has_permission('trainers.manage_availability'));
create policy "permission_update" on public.trainer_availabilities as restrictive for update to authenticated using (not public.is_staff() or public.has_permission('trainers.manage_availability')) with check (not public.is_staff() or public.has_permission('trainers.manage_availability'));
create policy "permission_delete" on public.trainer_availabilities as restrictive for delete to authenticated using (not public.is_staff() or public.has_permission('trainers.manage_availability'));
create policy "permission_select" on public.availability_exceptions as restrictive for select to authenticated using (not public.is_staff() or public.has_permission('trainers.view'));
create policy "permission_insert" on public.availability_exceptions as restrictive for insert to authenticated with check (not public.is_staff() or public.has_permission('trainers.manage_availability'));
create policy "permission_update" on public.availability_exceptions as restrictive for update to authenticated using (not public.is_staff() or public.has_permission('trainers.manage_availability')) with check (not public.is_staff() or public.has_permission('trainers.manage_availability'));
create policy "permission_delete" on public.availability_exceptions as restrictive for delete to authenticated using (not public.is_staff() or public.has_permission('trainers.manage_availability'));

create or replace function private.guard_staff_transitions()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare permission_key text; changed boolean;
begin
  if not is_staff() then return new; end if;
  if tg_table_name='trainings' then
    if new.status='publiee' and (tg_op='INSERT' or old.status is distinct from new.status) then permission_key:='formations.publish'; end if;
    if tg_op='UPDATE' and old.status='publiee' and new.status<>old.status then permission_key:='formations.publish'; end if;
  elsif tg_table_name='sessions' and new.status='annulee' then permission_key:='sessions.cancel';
  elsif tg_table_name='enrollments' and new.status='annule' then permission_key:='learners.reject';
  elsif tg_table_name='orders' then
    changed:=tg_op='INSERT' or old.status is distinct from new.status;
    if changed then permission_key:=case new.status::text when 'en_attente_paiement' then 'devis.accept' when 'annulee' then 'devis.reject' when 'facturee' then 'devis.invoice' when 'payee' then 'devis.mark_paid' else 'devis.invoice' end;
    else permission_key:='devis.invoice'; end if;
  elsif tg_table_name='invoices' then
    if new.paid_at is not null and (tg_op='INSERT' or new.paid_at is distinct from old.paid_at) then permission_key:='devis.mark_paid';
    else permission_key:='devis.invoice'; end if;
  end if;
  if permission_key is not null and not has_permission(permission_key) then raise exception 'Permission requise : %',permission_key using errcode='42501'; end if;
  return new;
end $$;
revoke all on function private.guard_staff_transitions() from public;
create trigger staff_training_state before insert or update on trainings for each row execute function private.guard_staff_transitions();
create trigger staff_session_state before insert or update on sessions for each row execute function private.guard_staff_transitions();
create trigger staff_enrollment_state before insert or update on enrollments for each row execute function private.guard_staff_transitions();
create trigger staff_order_state before insert or update on orders for each row execute function private.guard_staff_transitions();
create trigger staff_invoice_state before insert or update on invoices for each row execute function private.guard_staff_transitions();
create policy "permission_delete" on orders as restrictive for delete to authenticated using (not is_staff() or has_permission('devis.reject'));
create policy "permission_delete" on invoices as restrictive for delete to authenticated using (not is_staff() or has_permission('devis.invoice'));
create policy "staff_storage_read" on storage.objects as restrictive for select to authenticated using (not is_staff() or case bucket_id when 'documents' then has_permission('documents.view') when 'lesson-files' then has_permission('formations.view') when 'training-images' then has_permission('formations.view') else true end);
create policy "staff_storage_insert" on storage.objects as restrictive for insert to authenticated with check (not is_staff() or case bucket_id when 'documents' then has_permission('documents.manage') when 'lesson-files' then has_permission('formations.edit') when 'training-images' then has_permission('formations.edit') else true end);
create policy "staff_storage_update" on storage.objects as restrictive for update to authenticated using (not is_staff() or case bucket_id when 'documents' then has_permission('documents.manage') when 'lesson-files' then has_permission('formations.edit') when 'training-images' then has_permission('formations.edit') else true end) with check (not is_staff() or case bucket_id when 'documents' then has_permission('documents.manage') when 'lesson-files' then has_permission('formations.edit') when 'training-images' then has_permission('formations.edit') else true end);
create policy "staff_storage_delete" on storage.objects as restrictive for delete to authenticated using (not is_staff() or case bucket_id when 'documents' then has_permission('documents.manage') when 'lesson-files' then has_permission('formations.edit') when 'training-images' then has_permission('formations.edit') else true end);

create or replace function public.next_invoice_number() returns text language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if not has_permission('devis.invoice') then raise exception 'Permission requise : devis.invoice' using errcode='42501'; end if;
 return 'FACT-'||to_char(now(),'YYYY')||'-'||lpad(nextval('invoice_number_seq')::text,5,'0');
end $$;
revoke all on function public.next_invoice_number() from public,anon;
grant execute on function public.next_invoice_number() to authenticated;
alter function public.set_withdrawal_deadline() set search_path = public, pg_temp;
commit;
