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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          hash: string
          id: string
          metadata: Json | null
          performed_by: string | null
          submission_id: string
        }
        Insert: {
          action: string
          created_at?: string
          hash: string
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          submission_id: string
        }
        Update: {
          action?: string
          created_at?: string
          hash?: string
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_alerts: {
        Row: {
          alert_type: string
          created_at: string
          deadline_id: string | null
          id: string
          is_read: boolean
          message: string
          organization_id: string | null
        }
        Insert: {
          alert_type?: string
          created_at?: string
          deadline_id?: string | null
          id?: string
          is_read?: boolean
          message: string
          organization_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          deadline_id?: string | null
          id?: string
          is_read?: boolean
          message?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_alerts_deadline_id_fkey"
            columns: ["deadline_id"]
            isOneToOne: false
            referencedRelation: "submission_deadlines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      emission_factors: {
        Row: {
          co2_multiplier: number
          created_at: string
          id: string
          label: string
          reference_year: number
          source: string
          source_reference: string
          unit: string
          updated_at: string
        }
        Insert: {
          co2_multiplier: number
          created_at?: string
          id?: string
          label?: string
          reference_year?: number
          source: string
          source_reference?: string
          unit: string
          updated_at?: string
        }
        Update: {
          co2_multiplier?: number
          created_at?: string
          id?: string
          label?: string
          reference_year?: number
          source?: string
          source_reference?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      esg_share_tokens: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          label: string
          organization_id: string | null
          token: string
          user_id: string
          view_count: number
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          label?: string
          organization_id?: string | null
          token?: string
          user_id: string
          view_count?: number
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          label?: string
          organization_id?: string | null
          token?: string
          user_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "esg_share_tokens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          organization_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id?: string
          organization_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          organization_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_deadlines: {
        Row: {
          created_at: string
          created_by: string
          due_date: string
          id: string
          organization_id: string
          period_label: string
        }
        Insert: {
          created_at?: string
          created_by: string
          due_date: string
          id?: string
          organization_id: string
          period_label: string
        }
        Update: {
          created_at?: string
          created_by?: string
          due_date?: string
          id?: string
          organization_id?: string
          period_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_deadlines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          audit_hash: string | null
          created_at: string
          electricity: number
          file_url: string | null
          fuel: number
          gas: number
          id: string
          organization_id: string | null
          period_end: string | null
          period_start: string | null
          reviewed_by: string | null
          revision_notes: string | null
          status: string
          total_emissions: number
          updated_at: string
          user_id: string
          verified_at: string | null
          waste: number
          water: number
        }
        Insert: {
          audit_hash?: string | null
          created_at?: string
          electricity?: number
          file_url?: string | null
          fuel?: number
          gas?: number
          id?: string
          organization_id?: string | null
          period_end?: string | null
          period_start?: string | null
          reviewed_by?: string | null
          revision_notes?: string | null
          status?: string
          total_emissions?: number
          updated_at?: string
          user_id: string
          verified_at?: string | null
          waste?: number
          water?: number
        }
        Update: {
          audit_hash?: string | null
          created_at?: string
          electricity?: number
          file_url?: string | null
          fuel?: number
          gas?: number
          id?: string
          organization_id?: string | null
          period_end?: string | null
          period_start?: string | null
          reviewed_by?: string | null
          revision_notes?: string | null
          status?: string
          total_emissions?: number
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          waste?: number
          water?: number
        }
        Relationships: [
          {
            foreignKeyName: "submissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vsme_questionnaires: {
        Row: {
          board_esg_oversight: boolean
          created_at: string
          employee_turnover_percent: number | null
          female_employees: number
          gender_pay_gap_percent: number | null
          governance_notes: string | null
          has_anti_corruption_policy: boolean
          has_code_of_conduct: boolean
          has_sustainability_officer: boolean
          has_whistleblower_channel: boolean
          health_safety_incidents: number
          id: string
          male_employees: number
          organization_id: string | null
          reporting_year: number
          status: string
          total_employees: number
          updated_at: string
          user_id: string
        }
        Insert: {
          board_esg_oversight?: boolean
          created_at?: string
          employee_turnover_percent?: number | null
          female_employees?: number
          gender_pay_gap_percent?: number | null
          governance_notes?: string | null
          has_anti_corruption_policy?: boolean
          has_code_of_conduct?: boolean
          has_sustainability_officer?: boolean
          has_whistleblower_channel?: boolean
          health_safety_incidents?: number
          id?: string
          male_employees?: number
          organization_id?: string | null
          reporting_year?: number
          status?: string
          total_employees?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          board_esg_oversight?: boolean
          created_at?: string
          employee_turnover_percent?: number | null
          female_employees?: number
          gender_pay_gap_percent?: number | null
          governance_notes?: string | null
          has_anti_corruption_policy?: boolean
          has_code_of_conduct?: boolean
          has_sustainability_officer?: boolean
          has_whistleblower_channel?: boolean
          health_safety_incidents?: number
          id?: string
          male_employees?: number
          organization_id?: string | null
          reporting_year?: number
          status?: string
          total_employees?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vsme_questionnaires_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_endpoints: {
        Row: {
          created_at: string
          created_by: string
          events: string[]
          id: string
          is_active: boolean
          label: string
          last_status_code: number | null
          last_triggered_at: string | null
          organization_id: string | null
          secret: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by: string
          events?: string[]
          id?: string
          is_active?: boolean
          label?: string
          last_status_code?: number | null
          last_triggered_at?: string | null
          organization_id?: string | null
          secret?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string
          events?: string[]
          id?: string
          is_active?: boolean
          label?: string
          last_status_code?: number | null
          last_triggered_at?: string | null
          organization_id?: string | null
          secret?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_endpoints_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string
          endpoint_id: string | null
          event: string
          id: string
          payload: Json
          response_body: string | null
          status_code: number | null
        }
        Insert: {
          created_at?: string
          endpoint_id?: string | null
          event: string
          id?: string
          payload?: Json
          response_body?: string | null
          status_code?: number | null
        }
        Update: {
          created_at?: string
          endpoint_id?: string | null
          event?: string
          id?: string
          payload?: Json
          response_body?: string | null
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "webhook_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_audit_hash: { Args: never; Returns: string }
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "supplier" | "manager"
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
      app_role: ["supplier", "manager"],
    },
  },
} as const
