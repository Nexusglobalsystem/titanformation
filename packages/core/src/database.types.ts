export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      attendances: {
        Row: {
          absence_reason: string | null
          enrollment_id: string
          id: string
          livekit_duration_s: number
          livekit_joined_at: string | null
          livekit_left_at: string | null
          present: boolean | null
          signature_ip: unknown
          signature_path: string | null
          signed_at: string | null
          slot_id: string
        }
        Insert: {
          absence_reason?: string | null
          enrollment_id: string
          id?: string
          livekit_duration_s?: number
          livekit_joined_at?: string | null
          livekit_left_at?: string | null
          present?: boolean | null
          signature_ip?: unknown
          signature_path?: string | null
          signed_at?: string | null
          slot_id: string
        }
        Update: {
          absence_reason?: string | null
          enrollment_id?: string
          id?: string
          livekit_duration_s?: number
          livekit_joined_at?: string | null
          livekit_left_at?: string | null
          present?: boolean | null
          signature_ip?: unknown
          signature_path?: string | null
          signed_at?: string | null
          slot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendances_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "session_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          diff: Json | null
          entity: string
          entity_id: string | null
          id: number
          ip: unknown
          occurred_at: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          diff?: Json | null
          entity: string
          entity_id?: string | null
          id?: number
          ip?: unknown
          occurred_at?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          diff?: Json | null
          entity?: string
          entity_id?: string | null
          id?: number
          ip?: unknown
          occurred_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_exceptions: {
        Row: {
          created_at: string
          end_time: string | null
          exception_date: string
          id: string
          reason: string | null
          start_time: string | null
          trainer_id: string
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          exception_date: string
          id?: string
          reason?: string | null
          start_time?: string | null
          trainer_id: string
        }
        Update: {
          created_at?: string
          end_time?: string | null
          exception_date?: string
          id?: string
          reason?: string | null
          start_time?: string | null
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_exceptions_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_date: string
          created_at: string
          end_time: string
          id: string
          learner_id: string
          reason: string | null
          start_time: string
          status: string
          trainer_id: string
        }
        Insert: {
          booking_date: string
          created_at?: string
          end_time: string
          id?: string
          learner_id: string
          reason?: string | null
          start_time: string
          status?: string
          trainer_id: string
        }
        Update: {
          booking_date?: string
          created_at?: string
          end_time?: string
          id?: string
          learner_id?: string
          reason?: string | null
          start_time?: string
          status?: string
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_number: string
          enrollment_id: string
          id: string
          issued_at: string
        }
        Insert: {
          certificate_number: string
          enrollment_id: string
          id?: string
          issued_at?: string
        }
        Update: {
          certificate_number?: string
          enrollment_id?: string
          id?: string
          issued_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: true
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      certification_required_modules: {
        Row: {
          module_id: string
          requirement_id: string
        }
        Insert: {
          module_id: string
          requirement_id: string
        }
        Update: {
          module_id?: string
          requirement_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certification_required_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_required_modules_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "certification_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      certification_requirements: {
        Row: {
          created_at: string
          final_exam_lesson_id: string | null
          id: string
          min_attendance_pct: number | null
          min_grade: number | null
          requires_final_exam: boolean
          requires_pedagogical_signoff: boolean
          training_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          final_exam_lesson_id?: string | null
          id?: string
          min_attendance_pct?: number | null
          min_grade?: number | null
          requires_final_exam?: boolean
          requires_pedagogical_signoff?: boolean
          training_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          final_exam_lesson_id?: string | null
          id?: string
          min_attendance_pct?: number | null
          min_grade?: number | null
          requires_final_exam?: boolean
          requires_pedagogical_signoff?: boolean
          training_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certification_requirements_final_exam_lesson_id_fkey"
            columns: ["final_exam_lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_requirements_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: true
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      certification_signoffs: {
        Row: {
          comment: string | null
          enrollment_id: string
          id: string
          signed_at: string
          signed_by: string
        }
        Insert: {
          comment?: string | null
          enrollment_id: string
          id?: string
          signed_at?: string
          signed_by: string
        }
        Update: {
          comment?: string | null
          enrollment_id?: string
          id?: string
          signed_at?: string
          signed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "certification_signoffs_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: true
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_signoffs_signed_by_fkey"
            columns: ["signed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      claims: {
        Row: {
          assigned_to: string | null
          body: string
          corrective_action: string | null
          enrollment_id: string | null
          id: string
          resolution: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["claim_status"]
          subject: string
          submitted_at: string
          submitted_by: string | null
        }
        Insert: {
          assigned_to?: string | null
          body: string
          corrective_action?: string | null
          enrollment_id?: string | null
          id?: string
          resolution?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          subject: string
          submitted_at?: string
          submitted_by?: string | null
        }
        Update: {
          assigned_to?: string | null
          body?: string
          corrective_action?: string | null
          enrollment_id?: string | null
          id?: string
          resolution?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          subject?: string
          submitted_at?: string
          submitted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claims_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          billing_email: string | null
          city: string | null
          country: string
          created_at: string
          id: string
          name: string
          opco_name: string | null
          postal_code: string | null
          siret: string | null
          vat_number: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          billing_email?: string | null
          city?: string | null
          country?: string
          created_at?: string
          id?: string
          name: string
          opco_name?: string | null
          postal_code?: string | null
          siret?: string | null
          vat_number?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          billing_email?: string | null
          city?: string | null
          country?: string
          created_at?: string
          id?: string
          name?: string
          opco_name?: string | null
          postal_code?: string | null
          siret?: string | null
          vat_number?: string | null
        }
        Relationships: []
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          role: Database["public"]["Enums"]["company_member_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          role?: Database["public"]["Enums"]["company_member_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          role?: Database["public"]["Enums"]["company_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          company_id: string | null
          enrollment_id: string | null
          generated_at: string
          id: string
          session_id: string | null
          signed_at: string | null
          storage_path: string
          type: Database["public"]["Enums"]["document_type"]
          version: number
        }
        Insert: {
          company_id?: string | null
          enrollment_id?: string | null
          generated_at?: string
          id?: string
          session_id?: string | null
          signed_at?: string | null
          storage_path: string
          type: Database["public"]["Enums"]["document_type"]
          version?: number
        }
        Update: {
          company_id?: string | null
          enrollment_id?: string | null
          generated_at?: string
          id?: string
          session_id?: string | null
          signed_at?: string | null
          storage_path?: string
          type?: Database["public"]["Enums"]["document_type"]
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          company_id: string | null
          completed_at: string | null
          contract_signed_at: string | null
          created_at: string
          funding: Database["public"]["Enums"]["funding_type"]
          id: string
          learner_id: string
          opco_dossier_number: string | null
          opco_name: string | null
          positioning_done_at: string | null
          program_snapshot: Json | null
          session_id: string
          status: Database["public"]["Enums"]["enrollment_status"]
          subrogation: boolean
          updated_at: string
          withdrawal_deadline: string | null
          withdrawn_at: string | null
        }
        Insert: {
          company_id?: string | null
          completed_at?: string | null
          contract_signed_at?: string | null
          created_at?: string
          funding: Database["public"]["Enums"]["funding_type"]
          id?: string
          learner_id: string
          opco_dossier_number?: string | null
          opco_name?: string | null
          positioning_done_at?: string | null
          program_snapshot?: Json | null
          session_id: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          subrogation?: boolean
          updated_at?: string
          withdrawal_deadline?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          company_id?: string | null
          completed_at?: string | null
          contract_signed_at?: string | null
          created_at?: string
          funding?: Database["public"]["Enums"]["funding_type"]
          id?: string
          learner_id?: string
          opco_dossier_number?: string | null
          opco_name?: string | null
          positioning_done_at?: string | null
          program_snapshot?: Json | null
          session_id?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          subrogation?: boolean
          updated_at?: string
          withdrawal_deadline?: string | null
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_forms: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["evaluation_kind"]
          schema: Json
          title: string
          training_id: string | null
          trigger_offset_days: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["evaluation_kind"]
          schema: Json
          title: string
          training_id?: string | null
          trigger_offset_days?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["evaluation_kind"]
          schema?: Json
          title?: string
          training_id?: string | null
          trigger_offset_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_forms_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_responses: {
        Row: {
          answers: Json
          enrollment_id: string
          form_id: string
          id: string
          respondent_id: string | null
          score: number | null
          submitted_at: string
        }
        Insert: {
          answers: Json
          enrollment_id: string
          form_id: string
          id?: string
          respondent_id?: string | null
          score?: number | null
          submitted_at?: string
        }
        Update: {
          answers?: Json
          enrollment_id?: string
          form_id?: string
          id?: string
          respondent_id?: string | null
          score?: number | null
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_responses_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_responses_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "evaluation_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_responses_respondent_id_fkey"
            columns: ["respondent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          billed_to: string
          due_on: string | null
          id: string
          issued_on: string
          number: string
          order_id: string
          paid_at: string | null
          storage_path: string | null
        }
        Insert: {
          billed_to: string
          due_on?: string | null
          id?: string
          issued_on?: string
          number: string
          order_id: string
          paid_at?: string | null
          storage_path?: string | null
        }
        Update: {
          billed_to?: string
          due_on?: string | null
          id?: string
          issued_on?: string
          number?: string
          order_id?: string
          paid_at?: string | null
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_progress: {
        Row: {
          completed_at: string | null
          enrollment_id: string
          id: string
          last_position_s: number
          lesson_id: string
          started_at: string | null
          time_spent_s: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          enrollment_id: string
          id?: string
          last_position_s?: number
          lesson_id: string
          started_at?: string | null
          time_spent_s?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          enrollment_id?: string
          id?: string
          last_position_s?: number
          lesson_id?: string
          started_at?: string | null
          time_spent_s?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learner_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          body: string | null
          created_at: string
          document_path: string | null
          duration_minutes: number
          id: string
          is_mandatory: boolean
          module_id: string
          position: number
          title: string
          type: Database["public"]["Enums"]["lesson_type"]
          video_asset_id: string | null
          video_provider: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          document_path?: string | null
          duration_minutes?: number
          id?: string
          is_mandatory?: boolean
          module_id: string
          position?: number
          title: string
          type: Database["public"]["Enums"]["lesson_type"]
          video_asset_id?: string | null
          video_provider?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          document_path?: string | null
          duration_minutes?: number
          id?: string
          is_mandatory?: boolean
          module_id?: string
          position?: number
          title?: string
          type?: Database["public"]["Enums"]["lesson_type"]
          video_asset_id?: string | null
          video_provider?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      media_events: {
        Row: {
          enrollment_id: string
          event: string
          id: number
          lesson_id: string
          occurred_at: string
          position_s: number
        }
        Insert: {
          enrollment_id: string
          event: string
          id?: number
          lesson_id: string
          occurred_at?: string
          position_s?: number
        }
        Update: {
          enrollment_id?: string
          event?: string
          id?: number
          lesson_id?: string
          occurred_at?: string
          position_s?: number
        }
        Relationships: [
          {
            foreignKeyName: "media_events_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_events_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string
          description: string | null
          id: string
          position: number
          title: string
          training_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          title: string
          training_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          title?: string
          training_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_log: {
        Row: {
          delivered_at: string | null
          enrollment_id: string | null
          error: string | null
          id: number
          opened_at: string | null
          recipient: string
          resend_id: string | null
          sent_at: string
          status: string
          template: string
        }
        Insert: {
          delivered_at?: string | null
          enrollment_id?: string | null
          error?: string | null
          id?: number
          opened_at?: string | null
          recipient: string
          resend_id?: string | null
          sent_at?: string
          status?: string
          template: string
        }
        Update: {
          delivered_at?: string | null
          enrollment_id?: string | null
          error?: string | null
          id?: number
          opened_at?: string | null
          recipient?: string
          resend_id?: string | null
          sent_at?: string
          status?: string
          template?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_log_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          enrollment_id: string | null
          id: string
          label: string
          order_id: string
          quantity: number
          unit_price_ht: number
          vat_rate: number
        }
        Insert: {
          enrollment_id?: string | null
          id?: string
          label: string
          order_id: string
          quantity?: number
          unit_price_ht: number
          vat_rate?: number
        }
        Update: {
          enrollment_id?: string | null
          id?: string
          label?: string
          order_id?: string
          quantity?: number
          unit_price_ht?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string | null
          company_id: string | null
          created_at: string
          funding: Database["public"]["Enums"]["funding_type"]
          id: string
          quote_valid_until: string | null
          reference: string
          status: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          total_ht: number
          total_ttc: number
          total_vat: number
        }
        Insert: {
          buyer_id?: string | null
          company_id?: string | null
          created_at?: string
          funding: Database["public"]["Enums"]["funding_type"]
          id?: string
          quote_valid_until?: string | null
          reference: string
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          total_ht?: number
          total_ttc?: number
          total_vat?: number
        }
        Update: {
          buyer_id?: string | null
          company_id?: string | null
          created_at?: string
          funding?: Database["public"]["Enums"]["funding_type"]
          id?: string
          quote_valid_until?: string | null
          reference?: string
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          total_ht?: number
          total_ttc?: number
          total_vat?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string
          description: string | null
          domain: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          domain?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          domain?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string
          key: string
          label: string
        }
        Insert: {
          category: string
          key: string
          label: string
        }
        Update: {
          category?: string
          key?: string
          label?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          accessibility_flagged: boolean
          accessibility_needs: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          rgpd_consent_at: string | null
          updated_at: string
        }
        Insert: {
          accessibility_flagged?: boolean
          accessibility_needs?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          rgpd_consent_at?: string | null
          updated_at?: string
        }
        Update: {
          accessibility_flagged?: boolean
          accessibility_needs?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          rgpd_consent_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      programme_trainings: {
        Row: {
          position: number
          programme_id: string
          training_id: string
        }
        Insert: {
          position?: number
          programme_id: string
          training_id: string
        }
        Update: {
          position?: number
          programme_id?: string
          training_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "programme_trainings_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programme_trainings_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      programmes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          slug: string
          status: string
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          slug: string
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          slug?: string
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programmes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      question_options: {
        Row: {
          id: string
          is_correct: boolean
          label: string
          position: number
          question_id: string
        }
        Insert: {
          id?: string
          is_correct?: boolean
          label: string
          position?: number
          question_id: string
        }
        Update: {
          id?: string
          is_correct?: boolean
          label?: string
          position?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          created_at: string
          created_by: string | null
          explanation: string | null
          id: string
          kind: string
          statement: string
          training_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          explanation?: string | null
          id?: string
          kind?: string
          statement: string
          training_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          explanation?: string | null
          id?: string
          kind?: string
          statement?: string
          training_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_answers: {
        Row: {
          attempt_id: string
          free_text: string | null
          id: string
          is_correct: boolean | null
          points_awarded: number
          question_id: string
          selected_option_ids: string[] | null
        }
        Insert: {
          attempt_id: string
          free_text?: string | null
          id?: string
          is_correct?: boolean | null
          points_awarded?: number
          question_id: string
          selected_option_ids?: string[] | null
        }
        Update: {
          attempt_id?: string
          free_text?: string | null
          id?: string
          is_correct?: boolean | null
          points_awarded?: number
          question_id?: string
          selected_option_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          attempt_number: number
          enrollment_id: string
          id: string
          max_score: number | null
          passed: boolean | null
          quiz_id: string
          score: number | null
          started_at: string
          submitted_at: string | null
        }
        Insert: {
          attempt_number?: number
          enrollment_id: string
          id?: string
          max_score?: number | null
          passed?: boolean | null
          quiz_id: string
          score?: number | null
          started_at?: string
          submitted_at?: string | null
        }
        Update: {
          attempt_number?: number
          enrollment_id?: string
          id?: string
          max_score?: number | null
          passed?: boolean | null
          quiz_id?: string
          score?: number | null
          started_at?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_items: {
        Row: {
          points: number
          position: number
          question_id: string
          quiz_id: string
        }
        Insert: {
          points?: number
          position?: number
          question_id: string
          quiz_id: string
        }
        Update: {
          points?: number
          position?: number
          question_id?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_items_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_items_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          id: string
          lesson_id: string
          max_attempts: number | null
          pass_threshold: number
          questions_drawn: number | null
          shuffle_questions: boolean
          time_limit_minutes: number | null
        }
        Insert: {
          id?: string
          lesson_id: string
          max_attempts?: number | null
          pass_threshold?: number
          questions_drawn?: number | null
          shuffle_questions?: boolean
          time_limit_minutes?: number | null
        }
        Update: {
          id?: string
          lesson_id?: string
          max_attempts?: number | null
          pass_threshold?: number
          questions_drawn?: number | null
          shuffle_questions?: boolean
          time_limit_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          permission_key?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["key"]
          },
        ]
      }
      session_slots: {
        Row: {
          ends_at: string
          half_day: string
          id: string
          livekit_room_name: string | null
          recording_url: string | null
          session_id: string
          slot_date: string
          starts_at: string
          trainer_signature_path: string | null
          trainer_signed_at: string | null
        }
        Insert: {
          ends_at: string
          half_day: string
          id?: string
          livekit_room_name?: string | null
          recording_url?: string | null
          session_id: string
          slot_date: string
          starts_at: string
          trainer_signature_path?: string | null
          trainer_signed_at?: string | null
        }
        Update: {
          ends_at?: string
          half_day?: string
          id?: string
          livekit_room_name?: string | null
          recording_url?: string | null
          session_id?: string
          slot_date?: string
          starts_at?: string
          trainer_signature_path?: string | null
          trainer_signed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_slots_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_trainers: {
        Row: {
          is_lead: boolean
          session_id: string
          trainer_id: string
        }
        Insert: {
          is_lead?: boolean
          session_id: string
          trainer_id: string
        }
        Update: {
          is_lead?: boolean
          session_id?: string
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_trainers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_trainers_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          ends_on: string
          id: string
          livekit_room_name: string | null
          max_seats: number
          min_seats: number
          price_ht_override: number | null
          reference: string
          starts_on: string
          status: Database["public"]["Enums"]["session_status"]
          training_id: string
        }
        Insert: {
          created_at?: string
          ends_on: string
          id?: string
          livekit_room_name?: string | null
          max_seats?: number
          min_seats?: number
          price_ht_override?: number | null
          reference: string
          starts_on: string
          status?: Database["public"]["Enums"]["session_status"]
          training_id: string
        }
        Update: {
          created_at?: string
          ends_on?: string
          id?: string
          livekit_room_name?: string | null
          max_seats?: number
          min_seats?: number
          price_ht_override?: number | null
          reference?: string
          starts_on?: string
          status?: Database["public"]["Enums"]["session_status"]
          training_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_functions: {
        Row: {
          function: string
          user_id: string
        }
        Insert: {
          function: string
          user_id: string
        }
        Update: {
          function?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_functions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignees: {
        Row: {
          task_id: string
          user_id: string
        }
        Insert: {
          task_id: string
          user_id: string
        }
        Update: {
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "organization_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          task_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "organization_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_availabilities: {
        Row: {
          created_at: string
          end_time: string
          id: string
          slot_duration_minutes: number
          start_time: string
          trainer_id: string
          weekday: number
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          slot_duration_minutes?: number
          start_time: string
          trainer_id: string
          weekday: number
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          slot_duration_minutes?: number
          start_time?: string
          trainer_id?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "trainer_availabilities_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_credentials: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          issued_at: string | null
          label: string
          storage_path: string
          trainer_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          label: string
          storage_path: string
          trainer_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          label?: string
          storage_path?: string
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainer_credentials_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_steps: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_mandatory: boolean
          module_id: string | null
          position: number
          title: string
          training_id: string
          type: Database["public"]["Enums"]["training_step_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_mandatory?: boolean
          module_id?: string | null
          position?: number
          title: string
          training_id: string
          type: Database["public"]["Enums"]["training_step_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_mandatory?: boolean
          module_id?: string | null
          position?: number
          title?: string
          training_id?: string
          type?: Database["public"]["Enums"]["training_step_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_steps_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_steps_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      trainings: {
        Row: {
          access_delay: string
          accessibility_info: string
          assessment_methods: string
          category: string | null
          certification_name: string | null
          created_at: string
          created_by: string | null
          duration_days: number | null
          duration_hours: number
          id: string
          is_certifying: boolean
          modalities: string
          objectives: string
          pedagogical_means: string
          prerequisites: string
          price_ht: number
          published_at: string | null
          rncp_code: string | null
          satisfaction_rate: number | null
          slug: string
          stats_updated_at: string | null
          status: string
          success_rate: number | null
          summary: string
          target_audience: string
          title: string
          updated_at: string
          vat_rate: number
        }
        Insert: {
          access_delay: string
          accessibility_info: string
          assessment_methods: string
          category?: string | null
          certification_name?: string | null
          created_at?: string
          created_by?: string | null
          duration_days?: number | null
          duration_hours: number
          id?: string
          is_certifying?: boolean
          modalities: string
          objectives: string
          pedagogical_means: string
          prerequisites: string
          price_ht: number
          published_at?: string | null
          rncp_code?: string | null
          satisfaction_rate?: number | null
          slug: string
          stats_updated_at?: string | null
          status?: string
          success_rate?: number | null
          summary: string
          target_audience: string
          title: string
          updated_at?: string
          vat_rate?: number
        }
        Update: {
          access_delay?: string
          accessibility_info?: string
          assessment_methods?: string
          category?: string | null
          certification_name?: string | null
          created_at?: string
          created_by?: string | null
          duration_days?: number | null
          duration_hours?: number
          id?: string
          is_certifying?: boolean
          modalities?: string
          objectives?: string
          pedagogical_means?: string
          prerequisites?: string
          price_ht?: number
          published_at?: string | null
          rncp_code?: string | null
          satisfaction_rate?: number | null
          slug?: string
          stats_updated_at?: string | null
          status?: string
          success_rate?: number | null
          summary?: string
          target_audience?: string
          title?: string
          updated_at?: string
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "trainings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      watch_entries: {
        Row: {
          id: string
          impact: string | null
          kind: Database["public"]["Enums"]["watch_kind"]
          recorded_at: string
          recorded_by: string | null
          source_url: string | null
          summary: string | null
          title: string
        }
        Insert: {
          id?: string
          impact?: string | null
          kind: Database["public"]["Enums"]["watch_kind"]
          recorded_at?: string
          recorded_by?: string | null
          source_url?: string | null
          summary?: string | null
          title: string
        }
        Update: {
          id?: string
          impact?: string | null
          kind?: Database["public"]["Enums"]["watch_kind"]
          recorded_at?: string
          recorded_by?: string | null
          source_url?: string | null
          summary?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_entries_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_see_task: { Args: { p_task_id: string }; Returns: boolean }
      enrolled_session_ids: { Args: never; Returns: string[] }
      formateur_ids: { Args: never; Returns: string[] }
      has_permission: { Args: { p_key: string }; Returns: boolean }
      has_role: {
        Args: { target: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      is_staff: { Args: never; Returns: boolean }
      managed_company_ids: { Args: never; Returns: string[] }
      notify_booking_event: {
        Args: { p_booking_id: string; p_kind: string }
        Returns: undefined
      }
      taken_slots: {
        Args: { p_from: string; p_to: string; p_trainer_id: string }
        Returns: {
          booking_date: string
          start_time: string
        }[]
      }
      trained_session_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      app_role:
        | "admin"
        | "gestionnaire"
        | "formateur"
        | "responsable_entreprise"
        | "apprenant"
      claim_status: "ouverte" | "en_cours" | "resolue" | "refusee"
      company_member_role: "responsable" | "salarie"
      document_type:
        | "programme"
        | "convention"
        | "contrat"
        | "convocation"
        | "feuille_emargement"
        | "certificat_realisation"
        | "attestation_fin_formation"
        | "evaluation_synthese"
        | "autre"
      enrollment_status:
        | "preinscrit"
        | "en_attente_paiement"
        | "confirme"
        | "annule"
        | "termine"
        | "abandonne"
      evaluation_kind:
        | "positionnement"
        | "satisfaction_chaud"
        | "satisfaction_froid"
        | "acquis"
      funding_type:
        | "particulier_cb"
        | "entreprise_directe"
        | "opco"
        | "cpf"
        | "france_travail"
        | "interne"
      lesson_type:
        | "video"
        | "quiz"
        | "document"
        | "live_slot"
        | "texte"
        | "audio"
      order_status:
        | "devis"
        | "en_attente_paiement"
        | "payee"
        | "facturee"
        | "annulee"
        | "remboursee"
      session_status:
        | "brouillon"
        | "ouverte"
        | "complete"
        | "en_cours"
        | "terminee"
        | "annulee"
      task_priority: "low" | "normal" | "high" | "urgent"
      task_status:
        | "todo"
        | "in_progress"
        | "blocked"
        | "review"
        | "completed"
        | "cancelled"
      training_step_type:
        | "presentiel"
        | "livekit"
        | "autoapprentissage"
        | "evaluation"
        | "certification"
      watch_kind: "legale" | "metier" | "innovation_pedagogique" | "handicap"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "gestionnaire",
        "formateur",
        "responsable_entreprise",
        "apprenant",
      ],
      claim_status: ["ouverte", "en_cours", "resolue", "refusee"],
      company_member_role: ["responsable", "salarie"],
      document_type: [
        "programme",
        "convention",
        "contrat",
        "convocation",
        "feuille_emargement",
        "certificat_realisation",
        "attestation_fin_formation",
        "evaluation_synthese",
        "autre",
      ],
      enrollment_status: [
        "preinscrit",
        "en_attente_paiement",
        "confirme",
        "annule",
        "termine",
        "abandonne",
      ],
      evaluation_kind: [
        "positionnement",
        "satisfaction_chaud",
        "satisfaction_froid",
        "acquis",
      ],
      funding_type: [
        "particulier_cb",
        "entreprise_directe",
        "opco",
        "cpf",
        "france_travail",
        "interne",
      ],
      lesson_type: ["video", "quiz", "document", "live_slot", "texte", "audio"],
      order_status: [
        "devis",
        "en_attente_paiement",
        "payee",
        "facturee",
        "annulee",
        "remboursee",
      ],
      session_status: [
        "brouillon",
        "ouverte",
        "complete",
        "en_cours",
        "terminee",
        "annulee",
      ],
      task_priority: ["low", "normal", "high", "urgent"],
      task_status: [
        "todo",
        "in_progress",
        "blocked",
        "review",
        "completed",
        "cancelled",
      ],
      training_step_type: [
        "presentiel",
        "livekit",
        "autoapprentissage",
        "evaluation",
        "certification",
      ],
      watch_kind: ["legale", "metier", "innovation_pedagogique", "handicap"],
    },
  },
} as const
