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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_events: {
        Row: {
          created_at: string
          id: string
          kind: string
          payload: Json
          profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          payload?: Json
          profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          profile_id?: string
        }
        Relationships: []
      }
      activity_reactions: {
        Row: {
          created_at: string
          emoji: string
          event_id: string
          id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          event_id: string
          id?: string
          profile_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          event_id?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_reactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "activity_events"
            referencedColumns: ["id"]
          },
        ]
      }
      app_profiles: {
        Row: {
          auth_user_id: string | null
          created_at: string
          display_name: string
          id: string
          pin_hash: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          display_name: string
          id: string
          pin_hash?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          display_name?: string
          id?: string
          pin_hash?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      bundle_concepts: {
        Row: {
          concept: string
          created_at: string
          gallery: Json
          id: string
          palette: string
          shop_bundle_id: string | null
          splash_url: string | null
          tagline: string | null
          title: string
        }
        Insert: {
          concept: string
          created_at?: string
          gallery?: Json
          id?: string
          palette?: string
          shop_bundle_id?: string | null
          splash_url?: string | null
          tagline?: string | null
          title: string
        }
        Update: {
          concept?: string
          created_at?: string
          gallery?: Json
          id?: string
          palette?: string
          shop_bundle_id?: string | null
          splash_url?: string | null
          tagline?: string | null
          title?: string
        }
        Relationships: []
      }
      card_gifts: {
        Row: {
          back: string
          category: string
          created_at: string
          from_profile: string
          front: string
          id: string
          responded_at: string | null
          source_note: string | null
          status: string
          to_profile: string
        }
        Insert: {
          back: string
          category?: string
          created_at?: string
          from_profile: string
          front: string
          id?: string
          responded_at?: string | null
          source_note?: string | null
          status?: string
          to_profile: string
        }
        Update: {
          back?: string
          category?: string
          created_at?: string
          from_profile?: string
          front?: string
          id?: string
          responded_at?: string | null
          source_note?: string | null
          status?: string
          to_profile?: string
        }
        Relationships: []
      }
      changelog_entries: {
        Row: {
          body: string
          category: string
          created_at: string
          icon: string | null
          id: string
          notes: string | null
          title: string
        }
        Insert: {
          body: string
          category?: string
          created_at?: string
          icon?: string | null
          id?: string
          notes?: string | null
          title: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          icon?: string | null
          id?: string
          notes?: string | null
          title?: string
        }
        Relationships: []
      }
      daily_challenges: {
        Row: {
          challenges: Json
          created_at: string
          day: string
          id: string
          profile_id: string
          surprise_claimed: boolean
          surprise_unlocked: boolean
          updated_at: string
        }
        Insert: {
          challenges?: Json
          created_at?: string
          day: string
          id?: string
          profile_id: string
          surprise_claimed?: boolean
          surprise_unlocked?: boolean
          updated_at?: string
        }
        Update: {
          challenges?: Json
          created_at?: string
          day?: string
          id?: string
          profile_id?: string
          surprise_claimed?: boolean
          surprise_unlocked?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_challenges_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "app_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      duel_results: {
        Row: {
          accuracy: number
          completed_at: string
          correct: number
          duel_id: string
          id: string
          profile_id: string
          time_ms: number
          total: number
        }
        Insert: {
          accuracy?: number
          completed_at?: string
          correct?: number
          duel_id: string
          id?: string
          profile_id: string
          time_ms?: number
          total?: number
        }
        Update: {
          accuracy?: number
          completed_at?: string
          correct?: number
          duel_id?: string
          id?: string
          profile_id?: string
          time_ms?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "duel_results_duel_id_fkey"
            columns: ["duel_id"]
            isOneToOne: false
            referencedRelation: "duels"
            referencedColumns: ["id"]
          },
        ]
      }
      duels: {
        Row: {
          cards_snapshot: Json
          completed_at: string | null
          created_at: string
          created_by: string
          deck_name: string
          deck_source_id: string | null
          expires_at: string
          forfeit_by: string | null
          id: string
          reminded_at: string | null
          status: string
          week_key: string
          winner: string | null
        }
        Insert: {
          cards_snapshot: Json
          completed_at?: string | null
          created_at?: string
          created_by: string
          deck_name: string
          deck_source_id?: string | null
          expires_at?: string
          forfeit_by?: string | null
          id?: string
          reminded_at?: string | null
          status?: string
          week_key: string
          winner?: string | null
        }
        Update: {
          cards_snapshot?: Json
          completed_at?: string | null
          created_at?: string
          created_by?: string
          deck_name?: string
          deck_source_id?: string | null
          expires_at?: string
          forfeit_by?: string | null
          id?: string
          reminded_at?: string | null
          status?: string
          week_key?: string
          winner?: string | null
        }
        Relationships: []
      }
      journey_shared: {
        Row: {
          claimed: Json
          contributions: Json
          created_at: string
          id: string
          updated_at: string
          xp: number
        }
        Insert: {
          claimed?: Json
          contributions?: Json
          created_at?: string
          id: string
          updated_at?: string
          xp?: number
        }
        Update: {
          claimed?: Json
          contributions?: Json
          created_at?: string
          id?: string
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      notification_reads: {
        Row: {
          notification_id: string
          profile_id: string
          read_at: string
        }
        Insert: {
          notification_id: string
          profile_id: string
          read_at?: string
        }
        Update: {
          notification_id?: string
          profile_id?: string
          read_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_label: string | null
          action_route: string | null
          body: string
          created_at: string
          icon: string | null
          id: string
          tag_id: string | null
          title: string
        }
        Insert: {
          action_label?: string | null
          action_route?: string | null
          body: string
          created_at?: string
          icon?: string | null
          id?: string
          tag_id?: string | null
          title: string
        }
        Update: {
          action_label?: string | null
          action_route?: string | null
          body?: string
          created_at?: string
          icon?: string | null
          id?: string
          tag_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "notification_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_data: {
        Row: {
          data: Json
          exams: Json
          grammar_progress: Json
          home_sessions: Json
          profile_id: string
          rank: Json
          study_history: Json
          updated_at: string
          writings: Json
        }
        Insert: {
          data?: Json
          exams?: Json
          grammar_progress?: Json
          home_sessions?: Json
          profile_id: string
          rank?: Json
          study_history?: Json
          updated_at?: string
          writings?: Json
        }
        Update: {
          data?: Json
          exams?: Json
          grammar_progress?: Json
          home_sessions?: Json
          profile_id?: string
          rank?: Json
          study_history?: Json
          updated_at?: string
          writings?: Json
        }
        Relationships: []
      }
      published_decks: {
        Row: {
          card_count: number
          cards: Json
          color_key: string
          created_at: string
          description: string
          id: string
          imports: number
          likes: number
          name: string
          owner_name: string
          owner_profile_id: string
          price: number
          slug: string
          updated_at: string
        }
        Insert: {
          card_count?: number
          cards?: Json
          color_key?: string
          created_at?: string
          description?: string
          id?: string
          imports?: number
          likes?: number
          name: string
          owner_name: string
          owner_profile_id: string
          price?: number
          slug: string
          updated_at?: string
        }
        Update: {
          card_count?: number
          cards?: Json
          color_key?: string
          created_at?: string
          description?: string
          id?: string
          imports?: number
          likes?: number
          name?: string
          owner_name?: string
          owner_profile_id?: string
          price?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      shard_gifts: {
        Row: {
          accent: string
          created_at: string
          from_profile: string
          id: string
          note: string | null
          price: number
          responded_at: string | null
          shard_key: string
          shard_name: string
          slot: string
          status: string
          tier: string
          to_profile: string
        }
        Insert: {
          accent?: string
          created_at?: string
          from_profile: string
          id?: string
          note?: string | null
          price?: number
          responded_at?: string | null
          shard_key: string
          shard_name: string
          slot?: string
          status?: string
          tier?: string
          to_profile: string
        }
        Update: {
          accent?: string
          created_at?: string
          from_profile?: string
          id?: string
          note?: string | null
          price?: number
          responded_at?: string | null
          shard_key?: string
          shard_name?: string
          slot?: string
          status?: string
          tier?: string
          to_profile?: string
        }
        Relationships: []
      }
      shop_featured_slots: {
        Row: {
          active: boolean
          art_url: string | null
          created_at: string
          description_override: string | null
          ends_at: string | null
          id: string
          item_id: string
          item_kind: string
          position: number
          rarity_override: string | null
          splash_url: string | null
          starts_at: string | null
          tagline: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          art_url?: string | null
          created_at?: string
          description_override?: string | null
          ends_at?: string | null
          id?: string
          item_id: string
          item_kind: string
          position?: number
          rarity_override?: string | null
          splash_url?: string | null
          starts_at?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          art_url?: string | null
          created_at?: string
          description_override?: string | null
          ends_at?: string | null
          id?: string
          item_id?: string
          item_kind?: string
          position?: number
          rarity_override?: string | null
          splash_url?: string | null
          starts_at?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shop_items: {
        Row: {
          accent: string
          active: boolean
          created_at: string
          description: string
          icon: string
          id: string
          kind: string
          name: string
          payload: Json
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          accent?: string
          active?: boolean
          created_at?: string
          description?: string
          icon?: string
          id: string
          kind: string
          name: string
          payload?: Json
          price: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          accent?: string
          active?: boolean
          created_at?: string
          description?: string
          icon?: string
          id?: string
          kind?: string
          name?: string
          payload?: Json
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      shop_purchases: {
        Row: {
          buyer_profile_id: string
          created_at: string
          deck_id: string | null
          id: string
          item_id: string | null
          item_kind: string
          payload: Json
          price_paid: number
        }
        Insert: {
          buyer_profile_id: string
          created_at?: string
          deck_id?: string | null
          id?: string
          item_id?: string | null
          item_kind: string
          payload?: Json
          price_paid: number
        }
        Update: {
          buyer_profile_id?: string
          created_at?: string
          deck_id?: string | null
          id?: string
          item_id?: string | null
          item_kind?: string
          payload?: Json
          price_paid?: number
        }
        Relationships: [
          {
            foreignKeyName: "shop_purchases_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "published_decks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "app_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          created_at: string
          crystals: number
          inventory: Json
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          crystals?: number
          inventory?: Json
          profile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          crystals?: number
          inventory?: Json
          profile_id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_profile_id: { Args: never; Returns: string }
      get_public_profile_snapshot: {
        Args: { _profile_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _profile_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      journey_add_progress: { Args: { _amount: number }; Returns: Json }
      journey_claim_stop: { Args: { _stop_id: string }; Returns: Json }
      link_profile: {
        Args: { _pin: string; _profile_id: string }
        Returns: Json
      }
      list_profiles: {
        Args: never
        Returns: {
          display_name: string
          has_pin: boolean
          id: string
          is_linked: boolean
        }[]
      }
      set_profile_pin: {
        Args: { _new_pin: string; _profile_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
