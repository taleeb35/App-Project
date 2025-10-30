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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      clinic_employees: {
        Row: {
          clinic_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_employees_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          license_number: string | null
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          license_number?: string | null
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          license_number?: string | null
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      data_uploads: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          file_name: string
          id: string
          records_count: number | null
          status: string | null
          upload_type: string
          uploaded_by: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          file_name: string
          id?: string
          records_count?: number | null
          status?: string | null
          upload_type: string
          uploaded_by?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          file_name?: string
          id?: string
          records_count?: number | null
          status?: string | null
          upload_type?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_uploads_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_purchases: {
        Row: {
          amount: number
          created_at: string | null
          grams: number | null
          id: string
          patient_id: string
          product_type: string | null
          purchase_date: string
          vendor_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          grams?: number | null
          id?: string
          patient_id: string
          product_type?: string | null
          purchase_date: string
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          grams?: number | null
          id?: string
          patient_id?: string
          product_type?: string | null
          purchase_date?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_purchases_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_purchases_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_vendor_usage: {
        Row: {
          amount_spent: number | null
          clinic_id: string
          created_at: string | null
          grams_purchased: number | null
          id: string
          patient_id: string
          updated_at: string | null
          usage_month: string
          vendor_id: string
        }
        Insert: {
          amount_spent?: number | null
          clinic_id: string
          created_at?: string | null
          grams_purchased?: number | null
          id?: string
          patient_id: string
          updated_at?: string | null
          usage_month: string
          vendor_id: string
        }
        Update: {
          amount_spent?: number | null
          clinic_id?: string
          created_at?: string | null
          grams_purchased?: number | null
          id?: string
          patient_id?: string
          updated_at?: string | null
          usage_month?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_vendor_usage_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_vendor_usage_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_vendor_usage_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_vendors: {
        Row: {
          created_at: string | null
          id: string
          patient_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          patient_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          patient_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_vendors_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_vendors_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          clinic_id: string
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          first_name: string
          id: string
          is_dummy: boolean | null
          is_veteran: boolean | null
          k_number: string
          last_name: string
          patient_type: string
          phone: string | null
          preferred_vendor_id: string | null
          prescription_status: string | null
          status: string | null
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          address?: string | null
          clinic_id: string
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          id?: string
          is_dummy?: boolean | null
          is_veteran?: boolean | null
          k_number: string
          last_name: string
          patient_type?: string
          phone?: string | null
          preferred_vendor_id?: string | null
          prescription_status?: string | null
          status?: string | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          address?: string | null
          clinic_id?: string
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          id?: string
          is_dummy?: boolean | null
          is_veteran?: boolean | null
          k_number?: string
          last_name?: string
          patient_type?: string
          phone?: string | null
          preferred_vendor_id?: string | null
          prescription_status?: string | null
          status?: string | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_preferred_vendor_id_fkey"
            columns: ["preferred_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacies: {
        Row: {
          address: string | null
          clinic_id: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          license_number: string | null
          name: string
          phone: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          clinic_id?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          license_number?: string | null
          name: string
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          clinic_id?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          license_number?: string | null
          name?: string
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacies_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_reports: {
        Row: {
          amount: number | null
          clinic_id: string
          created_at: string | null
          grams_sold: number | null
          id: string
          patient_id: string
          pharmacy_id: string
          product_name: string | null
          report_month: string
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          amount?: number | null
          clinic_id: string
          created_at?: string | null
          grams_sold?: number | null
          id?: string
          patient_id: string
          pharmacy_id: string
          product_name?: string | null
          report_month: string
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          amount?: number | null
          clinic_id?: string
          created_at?: string | null
          grams_sold?: number | null
          id?: string
          patient_id?: string
          pharmacy_id?: string
          product_name?: string | null
          report_month?: string
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_reports_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_reports_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_reports_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_reports: {
        Row: {
          amount: number | null
          clinic_id: string
          created_at: string | null
          grams_sold: number | null
          id: string
          is_dummy: boolean | null
          patient_id: string
          product_name: string | null
          report_month: string
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          amount?: number | null
          clinic_id: string
          created_at?: string | null
          grams_sold?: number | null
          id?: string
          is_dummy?: boolean | null
          patient_id: string
          product_name?: string | null
          report_month: string
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          amount?: number | null
          clinic_id?: string
          created_at?: string | null
          grams_sold?: number | null
          id?: string
          is_dummy?: boolean | null
          patient_id?: string
          product_name?: string | null
          report_month?: string
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_reports_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_reports_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          clinic_id: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          is_dummy: boolean | null
          license_number: string | null
          name: string
          phone: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          clinic_id?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_dummy?: boolean | null
          license_number?: string | null
          name: string
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          clinic_id?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_dummy?: boolean | null
          license_number?: string | null
          name?: string
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "clinic_staff"
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
      app_role: ["admin", "clinic_staff"],
    },
  },
} as const
