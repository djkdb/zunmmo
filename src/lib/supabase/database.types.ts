export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      character_stats: {
        Row: {
          character_id: string;
          stat: Database["public"]["Enums"]["stat_type"];
          xp: number;
        };
        ComputedFields: never;
        Insert: {
          character_id: string;
          stat: Database["public"]["Enums"]["stat_type"];
          xp?: number;
        };
        Update: {
          character_id?: string;
          stat?: Database["public"]["Enums"]["stat_type"];
          xp?: number;
        };
        Relationships: [
          {
            foreignKeyName: "character_stats_character_id_fkey";
            columns: ["character_id"];
            isOneToOne: false;
            referencedRelation: "characters";
            referencedColumns: ["id"];
          },
        ];
      };
      characters: {
        Row: {
          appearance: NonNullable<Json>;
          created_at: string;
          id: string;
          name: string;
          total_xp: number;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          appearance: NonNullable<Json>;
          created_at?: string;
          id?: string;
          name: string;
          total_xp?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          appearance?: NonNullable<Json>;
          created_at?: string;
          id?: string;
          name?: string;
          total_xp?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          cleared_at: string | null;
          created_at: string;
          description: string | null;
          id: string;
          status: Database["public"]["Enums"]["goal_status"];
          target_date: string | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          cleared_at?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          status?: Database["public"]["Enums"]["goal_status"];
          target_date?: string | null;
          title: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          cleared_at?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          status?: Database["public"]["Enums"]["goal_status"];
          target_date?: string | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          daily_capacity_min: number;
          day_start_hour: number;
          display_name: string;
          id: string;
          locale: string;
          onboarded_at: string | null;
          timezone: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          daily_capacity_min?: number;
          day_start_hour?: number;
          display_name: string;
          id: string;
          locale?: string;
          onboarded_at?: string | null;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          daily_capacity_min?: number;
          day_start_hour?: number;
          display_name?: string;
          id?: string;
          locale?: string;
          onboarded_at?: string | null;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      quests: {
        Row: {
          completed_at: string | null;
          created_at: string;
          deadline: string | null;
          description: string | null;
          difficulty: number;
          estimated_minutes: number | null;
          goal_id: string | null;
          id: string;
          primary_stat: Database["public"]["Enums"]["stat_type"];
          repeat_rule: Json | null;
          scheduled_for: string | null;
          sort_order: number;
          source: Database["public"]["Enums"]["quest_source"];
          status: Database["public"]["Enums"]["quest_status"];
          title: string;
          type: Database["public"]["Enums"]["quest_type"];
          updated_at: string;
          user_id: string;
          xp: number;
        };
        ComputedFields: never;
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          deadline?: string | null;
          description?: string | null;
          difficulty: number;
          estimated_minutes?: number | null;
          goal_id?: string | null;
          id?: string;
          primary_stat: Database["public"]["Enums"]["stat_type"];
          repeat_rule?: Json | null;
          scheduled_for?: string | null;
          sort_order?: number;
          source?: Database["public"]["Enums"]["quest_source"];
          status?: Database["public"]["Enums"]["quest_status"];
          title: string;
          type: Database["public"]["Enums"]["quest_type"];
          updated_at?: string;
          user_id?: string;
          xp: number;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          deadline?: string | null;
          description?: string | null;
          difficulty?: number;
          estimated_minutes?: number | null;
          goal_id?: string | null;
          id?: string;
          primary_stat?: Database["public"]["Enums"]["stat_type"];
          repeat_rule?: Json | null;
          scheduled_for?: string | null;
          sort_order?: number;
          source?: Database["public"]["Enums"]["quest_source"];
          status?: Database["public"]["Enums"]["quest_status"];
          title?: string;
          type?: Database["public"]["Enums"]["quest_type"];
          updated_at?: string;
          user_id?: string;
          xp?: number;
        };
        Relationships: [
          {
            foreignKeyName: "quests_goal_id_fkey";
            columns: ["goal_id"];
            isOneToOne: false;
            referencedRelation: "goals";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_character: {
        Args: { p_appearance: Json; p_name: string };
        Returns: {
          appearance: NonNullable<Json>;
          created_at: string;
          id: string;
          name: string;
          total_xp: number;
          updated_at: string;
          user_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "characters";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      set_goal_archived: {
        Args: { p_archived: boolean; p_goal_id: string };
        Returns: {
          cleared_at: string | null;
          created_at: string;
          description: string | null;
          id: string;
          status: Database["public"]["Enums"]["goal_status"];
          target_date: string | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "goals";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      set_quest_archived: {
        Args: { p_archived: boolean; p_quest_id: string };
        Returns: {
          completed_at: string | null;
          created_at: string;
          deadline: string | null;
          description: string | null;
          difficulty: number;
          estimated_minutes: number | null;
          goal_id: string | null;
          id: string;
          primary_stat: Database["public"]["Enums"]["stat_type"];
          repeat_rule: Json | null;
          scheduled_for: string | null;
          sort_order: number;
          source: Database["public"]["Enums"]["quest_source"];
          status: Database["public"]["Enums"]["quest_status"];
          title: string;
          type: Database["public"]["Enums"]["quest_type"];
          updated_at: string;
          user_id: string;
          xp: number;
        };
        SetofOptions: {
          from: "*";
          to: "quests";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
    };
    Enums: {
      goal_status: "active" | "cleared" | "archived";
      quest_source: "manual" | "template" | "system";
      quest_status: "active" | "completed" | "expired" | "archived";
      quest_type: "main" | "daily" | "side" | "boss" | "hidden";
      stat_type: "int" | "foc" | "vit" | "soc" | "cre";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      goal_status: ["active", "cleared", "archived"],
      quest_source: ["manual", "template", "system"],
      quest_status: ["active", "completed", "expired", "archived"],
      quest_type: ["main", "daily", "side", "boss", "hidden"],
      stat_type: ["int", "foc", "vit", "soc", "cre"],
    },
  },
} as const;
