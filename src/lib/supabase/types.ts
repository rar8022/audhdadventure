// Hand-written to match supabase/migrations/0001_init.sql.
// If you change the schema, regenerate with the Supabase CLI instead:
//   supabase gen types typescript --local > src/lib/supabase/types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          mode: "solo" | "system";
          party_name: string;
          active_character_id: string | null;
          show_intro: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["accounts"]["Row"]> & {
          id: string;
        };
        Update: Partial<Database["public"]["Tables"]["accounts"]["Row"]>;
      };
      characters: {
        Row: {
          id: string;
          account_id: string;
          name: string;
          main_role: string;
          main_role_why: string;
          physical_stats: Json;
          stat_xp: Json;
          pools: Json;
          day_settings: Json;
          sub_roles: Json;
          active_buffs: Json;
          custom_buffs_debuffs: Json;
          actions_spells: Json;
          pool_spent: Json;
          pool_spent_date: string | null;
          order_index: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["characters"]["Row"]> & {
          account_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["characters"]["Row"]>;
      };
      history: {
        Row: {
          id: string;
          account_id: string;
          character_id: string;
          type: string;
          date: string;
          ts: string;
          data: Json;
          edited: boolean;
          edited_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["history"]["Row"]> & {
          account_id: string;
          character_id: string;
          type: string;
          date: string;
        };
        Update: Partial<Database["public"]["Tables"]["history"]["Row"]>;
      };
      switch_log: {
        Row: {
          id: string;
          account_id: string;
          character_id: string;
          at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["switch_log"]["Row"]> & {
          account_id: string;
          character_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["switch_log"]["Row"]>;
      };
    };
  };
}
