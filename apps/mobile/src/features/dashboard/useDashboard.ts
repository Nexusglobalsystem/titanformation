import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

export interface AttendanceItem {
  id: string;
  signed_at: string | null;
  present: boolean | null;
  session_slots: {
    id: string;
    slot_date: string;
    half_day: string;
    starts_at: string;
    ends_at: string;
    modality: string;
    sessions: { reference: string; trainings: { title: string } | null } | null;
  } | null;
}

const HALF_DAY_ORDER: Record<string, number> = { matin: 0, apres_midi: 1 };

// Équivalent RN de apps/web/src/app/apprenant/page.tsx — mêmes requêtes
// (2 lots parallèles : profile/enrollments/attendances/nextBooking d'abord,
// puis lessonRows/progressRows qui dépendent des inscriptions confirmées)
// et mêmes dérivations (formation "à reprendre", regroupement des
// émargements par session).
export function useDashboard(userId: string | undefined) {
  return useQuery({
    queryKey: ["dashboard", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);

      const [{ data: profile }, { data: enrollments }, { data: attendancesRaw }, { data: nextBooking }] =
        await Promise.all([
          supabase.from("profiles").select("first_name").eq("id", userId!).single(),
          supabase
            .from("enrollments")
            .select("id, status, created_at, sessions(reference, starts_on, ends_on, trainings(id, title, slug))")
            .eq("learner_id", userId!)
            .order("created_at", { ascending: false }),
          supabase
            .from("attendances")
            .select(
              "id, signed_at, present, session_slots(id, slot_date, half_day, starts_at, ends_at, modality, sessions(reference, trainings(title)))",
            ),
          supabase
            .from("bookings")
            .select("booking_date, start_time, reason, profiles!bookings_trainer_id_fkey(first_name, last_name)")
            .eq("learner_id", userId!)
            .eq("status", "confirmee")
            .gte("booking_date", today)
            .order("booking_date", { ascending: true })
            .order("start_time", { ascending: true })
            .limit(1)
            .maybeSingle(),
        ]);

      const confirmedEnrollments = (enrollments ?? []).filter((e) =>
        ["confirme", "termine"].includes(e.status),
      );
      const trainingIds = [
        ...new Set(
          confirmedEnrollments.map((e) => e.sessions?.trainings?.id).filter((id): id is string => Boolean(id)),
        ),
      ];
      const enrollmentIds = confirmedEnrollments.map((e) => e.id);

      const [{ data: lessonRows }, { data: progressRows }] = await Promise.all([
        trainingIds.length
          ? supabase.from("modules").select("training_id, lessons(id)").in("training_id", trainingIds)
          : Promise.resolve({ data: [] as { training_id: string; lessons: { id: string }[] | null }[] }),
        enrollmentIds.length
          ? supabase
              .from("learner_progress")
              .select("enrollment_id, completed_at")
              .in("enrollment_id", enrollmentIds)
              .not("completed_at", "is", null)
          : Promise.resolve({ data: [] as { enrollment_id: string; completed_at: string | null }[] }),
      ]);

      const lessonCountByTraining = new Map<string, number>();
      for (const row of lessonRows ?? []) {
        lessonCountByTraining.set(
          row.training_id,
          (lessonCountByTraining.get(row.training_id) ?? 0) + (row.lessons?.length ?? 0),
        );
      }

      const completedCountByEnrollment = new Map<string, number>();
      for (const row of progressRows ?? []) {
        completedCountByEnrollment.set(
          row.enrollment_id,
          (completedCountByEnrollment.get(row.enrollment_id) ?? 0) + 1,
        );
      }

      const attendances = [...((attendancesRaw ?? []) as AttendanceItem[])].sort((a, b) => {
        const dateDiff = (a.session_slots?.slot_date ?? "").localeCompare(b.session_slots?.slot_date ?? "");
        if (dateDiff !== 0) return dateDiff;
        return (
          (HALF_DAY_ORDER[a.session_slots?.half_day ?? ""] ?? 0) -
          (HALF_DAY_ORDER[b.session_slots?.half_day ?? ""] ?? 0)
        );
      });

      const inProgress = confirmedEnrollments
        .map((e) => {
          const trainingId = e.sessions?.trainings?.id;
          const total = trainingId ? (lessonCountByTraining.get(trainingId) ?? 0) : 0;
          const completed = completedCountByEnrollment.get(e.id) ?? 0;
          return { enrollment: e, total, completed };
        })
        .find((x) => x.total > 0 && x.completed < x.total);

      const attendanceGroups = (() => {
        const map = new Map<string, { key: string; label: string; items: AttendanceItem[] }>();
        for (const a of attendances) {
          const session = a.session_slots?.sessions;
          const key = session?.reference ?? "—";
          const label = session?.trainings?.title ?? "Formation";
          if (!map.has(key)) map.set(key, { key, label, items: [] });
          map.get(key)!.items.push(a);
        }
        return Array.from(map.values());
      })();

      return {
        profile,
        enrollments: enrollments ?? [],
        confirmedEnrollments,
        attendances,
        attendanceGroups,
        unsignedCount: attendances.filter((a) => !a.signed_at).length,
        nextBooking: nextBooking ?? null,
        inProgress,
        lessonCountByTraining,
        completedCountByEnrollment,
      };
    },
  });
}
