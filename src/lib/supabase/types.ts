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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          id: string
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      bank_import_rows: {
        Row: {
          amount_grosz: number
          created_at: string
          first_name: string | null
          id: string
          import_id: string
          last_name: string | null
          match_status: Database["public"]["Enums"]["match_status"]
          matched_member_id: string | null
          other: string | null
          paid_on: string
        }
        Insert: {
          amount_grosz: number
          created_at?: string
          first_name?: string | null
          id?: string
          import_id: string
          last_name?: string | null
          match_status?: Database["public"]["Enums"]["match_status"]
          matched_member_id?: string | null
          other?: string | null
          paid_on: string
        }
        Update: {
          amount_grosz?: number
          created_at?: string
          first_name?: string | null
          id?: string
          import_id?: string
          last_name?: string | null
          match_status?: Database["public"]["Enums"]["match_status"]
          matched_member_id?: string | null
          other?: string | null
          paid_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_import_rows_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "bank_imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_import_rows_matched_member_id_fkey"
            columns: ["matched_member_id"]
            isOneToOne: false
            referencedRelation: "member_dues_status"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "bank_import_rows_matched_member_id_fkey"
            columns: ["matched_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_imports: {
        Row: {
          created_at: string
          file_name: string
          file_path: string | null
          id: string
          rows_matched: number
          rows_total: number
          status: Database["public"]["Enums"]["import_status"]
          updated_at: string
          updated_by: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path?: string | null
          id?: string
          rows_matched?: number
          rows_total?: number
          status?: Database["public"]["Enums"]["import_status"]
          updated_at?: string
          updated_by?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string | null
          id?: string
          rows_matched?: number
          rows_total?: number
          status?: Database["public"]["Enums"]["import_status"]
          updated_at?: string
          updated_by?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_imports_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "member_dues_status"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "bank_imports_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_imports_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "member_dues_status"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "bank_imports_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      benefit_requests: {
        Row: {
          active_from: string | null
          benefit_id: string
          card_number: string | null
          value_grosz: number | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          member_id: string
          requested_at: string
          status: Database["public"]["Enums"]["benefit_request_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active_from?: string | null
          benefit_id: string
          card_number?: string | null
          value_grosz?: number | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          member_id: string
          requested_at?: string
          status?: Database["public"]["Enums"]["benefit_request_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active_from?: string | null
          benefit_id?: string
          card_number?: string | null
          value_grosz?: number | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          member_id?: string
          requested_at?: string
          status?: Database["public"]["Enums"]["benefit_request_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "benefit_requests_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "benefits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benefit_requests_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "member_dues_status"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "benefit_requests_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benefit_requests_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_dues_status"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "benefit_requests_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benefit_requests_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "member_dues_status"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "benefit_requests_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      benefits: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_visible: boolean
          name: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_visible?: boolean
          name: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_visible?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "benefits_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "member_dues_status"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "benefits_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      board_roles: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      declarations: {
        Row: {
          consent_rodo: boolean
          consent_statute: boolean
          created_at: string
          decided_at: string | null
          decided_by: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          member_id: string | null
          position: string | null
          status: Database["public"]["Enums"]["declaration_status"]
          unit: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          consent_rodo: boolean
          consent_statute: boolean
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          member_id?: string | null
          position?: string | null
          status?: Database["public"]["Enums"]["declaration_status"]
          unit?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          consent_rodo?: boolean
          consent_statute?: boolean
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          member_id?: string | null
          position?: string | null
          status?: Database["public"]["Enums"]["declaration_status"]
          unit?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "declarations_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "member_dues_status"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "declarations_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "declarations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_dues_status"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "declarations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "declarations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "member_dues_status"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "declarations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      document_acks: {
        Row: {
          acked_at: string
          document_id: string
          member_id: string
        }
        Insert: {
          acked_at?: string
          document_id: string
          member_id: string
        }
        Update: {
          acked_at?: string
          document_id?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_acks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_acks_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_dues_status"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "document_acks_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      document_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      documents: {
        Row: {
          category_id: string | null
          created_at: string
          file_path: string
          id: string
          is_published: boolean
          published_at: string
          requires_ack: boolean
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          file_path: string
          id?: string
          is_published?: boolean
          published_at?: string
          requires_ack?: boolean
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          file_path?: string
          id?: string
          is_published?: boolean
          published_at?: string
          requires_ack?: boolean
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "member_dues_status"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "documents_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      dues_payments: {
        Row: {
          amount_grosz: number
          created_at: string
          id: string
          import_row_id: string | null
          member_id: string
          note: string | null
          paid_on: string
          period_from: string
          period_to: string
          source: Database["public"]["Enums"]["payment_source"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount_grosz: number
          created_at?: string
          id?: string
          import_row_id?: string | null
          member_id: string
          note?: string | null
          paid_on: string
          period_from: string
          period_to: string
          source: Database["public"]["Enums"]["payment_source"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount_grosz?: number
          created_at?: string
          id?: string
          import_row_id?: string | null
          member_id?: string
          note?: string | null
          paid_on?: string
          period_from?: string
          period_to?: string
          source?: Database["public"]["Enums"]["payment_source"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dues_payments_import_row_id_fkey"
            columns: ["import_row_id"]
            isOneToOne: false
            referencedRelation: "bank_import_rows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dues_payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_dues_status"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "dues_payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dues_payments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "member_dues_status"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "dues_payments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      dues_rates: {
        Row: {
          amount_grosz: number
          created_at: string
          id: string
          valid_from: string
        }
        Insert: {
          amount_grosz: number
          created_at?: string
          id?: string
          valid_from: string
        }
        Update: {
          amount_grosz?: number
          created_at?: string
          id?: string
          valid_from?: string
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          event_id: string
          member_id: string
          registered_at: string
        }
        Insert: {
          event_id: string
          member_id: string
          registered_at?: string
        }
        Update: {
          event_id?: string
          member_id?: string
          registered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_dues_status"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "event_registrations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number | null
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          is_published: boolean
          place: string | null
          registration_open: boolean
          starts_at: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_published?: boolean
          place?: string | null
          registration_open?: boolean
          starts_at: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_published?: boolean
          place?: string | null
          registration_open?: boolean
          starts_at?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "member_dues_status"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "events_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_board_roles: {
        Row: {
          board_role_id: string
          created_at: string
          member_id: string
        }
        Insert: {
          board_role_id: string
          created_at?: string
          member_id: string
        }
        Update: {
          board_role_id?: string
          created_at?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_board_roles_board_role_id_fkey"
            columns: ["board_role_id"]
            isOneToOne: false
            referencedRelation: "board_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_board_roles_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_dues_status"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "member_board_roles_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          card_valid_until: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          is_board: boolean
          joined_at: string
          last_name: string
          last_seen_at: string | null
          login: string
          member_no: string | null
          must_change_password: boolean
          photo_path: string | null
          position: string | null
          status: Database["public"]["Enums"]["member_status"]
          unit: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          card_valid_until?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id: string
          is_board?: boolean
          joined_at?: string
          last_name: string
          last_seen_at?: string | null
          login: string
          member_no?: string | null
          must_change_password?: boolean
          photo_path?: string | null
          position?: string | null
          status?: Database["public"]["Enums"]["member_status"]
          unit?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          card_valid_until?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          is_board?: boolean
          joined_at?: string
          last_name?: string
          last_seen_at?: string | null
          login?: string
          member_no?: string | null
          must_change_password?: boolean
          photo_path?: string | null
          position?: string | null
          status?: Database["public"]["Enums"]["member_status"]
          unit?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "member_dues_status"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "members_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      message_threads: {
        Row: {
          board_folder: Database["public"]["Enums"]["board_folder"]
          created_at: string
          id: string
          last_message_at: string
          member_id: string
          member_last_read_at: string
          subject: string
          to_board_role_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          board_folder?: Database["public"]["Enums"]["board_folder"]
          created_at?: string
          id?: string
          last_message_at?: string
          member_id: string
          member_last_read_at?: string
          subject: string
          to_board_role_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          board_folder?: Database["public"]["Enums"]["board_folder"]
          created_at?: string
          id?: string
          last_message_at?: string
          member_id?: string
          member_last_read_at?: string
          subject?: string
          to_board_role_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_threads_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_dues_status"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "message_threads_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_to_board_role_id_fkey"
            columns: ["to_board_role_id"]
            isOneToOne: false
            referencedRelation: "board_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "member_dues_status"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "message_threads_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          thread_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          thread_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "member_dues_status"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          author_id: string | null
          body: string | null
          created_at: string
          id: string
          is_published: boolean
          lead: string | null
          published_at: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          author_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          lead?: string | null
          published_at?: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          author_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          lead?: string | null
          published_at?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "member_dues_status"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "news_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "member_dues_status"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "news_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      news_reads: {
        Row: {
          member_id: string
          news_id: string
          read_at: string
        }
        Insert: {
          member_id: string
          news_id: string
          read_at?: string
        }
        Update: {
          member_id?: string
          news_id?: string
          read_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_reads_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_dues_status"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "news_reads_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_reads_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_ballots: {
        Row: {
          member_id: string
          poll_id: string
          voted_at: string
        }
        Insert: {
          member_id: string
          poll_id: string
          voted_at?: string
        }
        Update: {
          member_id?: string
          poll_id?: string
          voted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_ballots_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_dues_status"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "poll_ballots_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_ballots_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_options: {
        Row: {
          created_at: string
          id: string
          label: string
          poll_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          poll_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          poll_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          id: string
          member_id: string | null
          option_id: string
          poll_id: string
        }
        Insert: {
          id?: string
          member_id?: string | null
          option_id: string
          poll_id: string
        }
        Update: {
          id?: string
          member_id?: string | null
          option_id?: string
          poll_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_dues_status"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "poll_votes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          created_at: string
          description: string | null
          document_id: string | null
          eligible_count: number | null
          ends_at: string
          id: string
          majority: Database["public"]["Enums"]["poll_majority"]
          mode: Database["public"]["Enums"]["poll_mode"]
          quorum_pct: number
          starts_at: string
          status: Database["public"]["Enums"]["poll_status"]
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_id?: string | null
          eligible_count?: number | null
          ends_at: string
          id?: string
          majority?: Database["public"]["Enums"]["poll_majority"]
          mode: Database["public"]["Enums"]["poll_mode"]
          quorum_pct?: number
          starts_at: string
          status?: Database["public"]["Enums"]["poll_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          document_id?: string | null
          eligible_count?: number | null
          ends_at?: string
          id?: string
          majority?: Database["public"]["Enums"]["poll_majority"]
          mode?: Database["public"]["Enums"]["poll_mode"]
          quorum_pct?: number
          starts_at?: string
          status?: Database["public"]["Enums"]["poll_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "polls_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "polls_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "member_dues_status"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "polls_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string
          created_at: string
          created_by: string | null
          description: string | null
          done_at: string | null
          due_on: string | null
          id: string
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          assignee_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          done_at?: string | null
          due_on?: string | null
          id?: string
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          assignee_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          done_at?: string | null
          due_on?: string | null
          id?: string
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "member_dues_status"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "member_dues_status"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "member_dues_status"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "tasks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      member_dues_status: {
        Row: {
          member_id: string | null
          member_no: string | null
          months_due: number | null
          paid_until: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      board_contacts: {
        Args: never
        Returns: {
          first_name: string
          last_name: string
          member_id: string
          roles: string[]
        }[]
      }
      cast_vote: {
        Args: { p_option: string; p_poll: string }
        Returns: undefined
      }
      event_counts: {
        Args: never
        Returns: {
          event_id: string
          registered: number
        }[]
      }
      is_active_member: { Args: never; Returns: boolean }
      is_board: { Args: never; Returns: boolean }
      log_event: {
        Args: { p_action: string; p_details?: Json }
        Returns: undefined
      }
      mark_password_changed: { Args: never; Returns: undefined }
      poll_named_votes: {
        Args: { p_poll: string }
        Returns: {
          first_name: string
          last_name: string
          member_no: string
          option_label: string
        }[]
      }
      poll_results: {
        Args: { p_poll: string }
        Returns: {
          label: string
          option_id: string
          sort_order: number
          votes: number
        }[]
      }
      poll_turnout: {
        Args: { p_poll: string }
        Returns: {
          eligible: number
          votes: number
        }[]
      }
      touch_last_seen: { Args: never; Returns: string }
    }
    Enums: {
      benefit_request_status:
        | "zgloszony"
        | "przyznany"
        | "odrzucony"
        | "zakonczony"
      board_folder: "aktualne" | "przeczytane" | "archiwalne"
      declaration_status: "oczekuje" | "zatwierdzona" | "odrzucona"
      import_status: "podglad" | "zaksiegowany" | "anulowany"
      match_status: "auto" | "reczne" | "pominiete" | "brak"
      member_status: "aktywny" | "zablokowany" | "byly"
      payment_source: "import" | "reczny"
      poll_majority: "zwykla" | "bezwzgledna" | "dwie_trzecie"
      poll_mode: "jawne" | "tajne"
      poll_status: "szkic" | "trwa" | "zakonczone"
      task_status: "w_toku" | "wykonane"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      benefit_request_status: [
        "zgloszony",
        "przyznany",
        "odrzucony",
        "zakonczony",
      ],
      board_folder: ["aktualne", "przeczytane", "archiwalne"],
      declaration_status: ["oczekuje", "zatwierdzona", "odrzucona"],
      import_status: ["podglad", "zaksiegowany", "anulowany"],
      match_status: ["auto", "reczne", "pominiete", "brak"],
      member_status: ["aktywny", "zablokowany", "byly"],
      payment_source: ["import", "reczny"],
      poll_majority: ["zwykla", "bezwzgledna", "dwie_trzecie"],
      poll_mode: ["jawne", "tajne"],
      poll_status: ["szkic", "trwa", "zakonczone"],
      task_status: ["w_toku", "wykonane"],
    },
  },
} as const
