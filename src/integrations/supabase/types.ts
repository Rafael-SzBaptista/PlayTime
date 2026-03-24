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
      game_participants: {
        Row: {
          created_at: string
          drawn_participant_id: string | null
          email: string | null
          game_id: string
          id: string
          name: string
          phone: string | null
          rouba_gift_in_hands: boolean
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          drawn_participant_id?: string | null
          email?: string | null
          game_id: string
          id?: string
          name: string
          phone?: string | null
          rouba_gift_in_hands?: boolean
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          drawn_participant_id?: string | null
          email?: string | null
          game_id?: string
          id?: string
          name?: string
          phone?: string | null
          rouba_gift_in_hands?: boolean
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_participants_drawn_participant_id_fkey"
            columns: ["drawn_participant_id"]
            isOneToOne: false
            referencedRelation: "game_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_participants_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      rouba_participant_gift: {
        Row: {
          game_id: string
          gift_choice: string | null
          participant_id: string
          updated_at: string
        }
        Insert: {
          game_id: string
          gift_choice?: string | null
          participant_id: string
          updated_at?: string
        }
        Update: {
          game_id?: string
          gift_choice?: string | null
          participant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rouba_participant_gift_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rouba_participant_gift_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: true
            referencedRelation: "game_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      rouba_participant_ready: {
        Row: {
          game_id: string
          gift_in_hands: boolean
          participant_id: string
          updated_at: string
        }
        Insert: {
          game_id: string
          gift_in_hands?: boolean
          participant_id: string
          updated_at?: string
        }
        Update: {
          game_id?: string
          gift_in_hands?: boolean
          participant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rouba_participant_ready_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rouba_participant_ready_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: true
            referencedRelation: "game_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          allow_suggestions: boolean
          bingo_gift_mode: string
          bingo_min_gifts_per_participant: number
          created_at: string
          draw_date: string | null
          emoji: string
          exchange_date: string | null
          game_type: string
          id: string
          max_value: number | null
          min_value: number | null
          name: string
          owner_id: string
          rules: string | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          allow_suggestions?: boolean
          bingo_gift_mode?: string
          bingo_min_gifts_per_participant?: number
          created_at?: string
          draw_date?: string | null
          emoji?: string
          exchange_date?: string | null
          game_type: string
          id?: string
          max_value?: number | null
          min_value?: number | null
          name: string
          owner_id: string
          rules?: string | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          allow_suggestions?: boolean
          bingo_gift_mode?: string
          bingo_min_gifts_per_participant?: number
          created_at?: string
          draw_date?: string | null
          emoji?: string
          exchange_date?: string | null
          game_type?: string
          id?: string
          max_value?: number | null
          min_value?: number | null
          name?: string
          owner_id?: string
          rules?: string | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
