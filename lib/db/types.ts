/**
 * Hand-written DB types mirroring supabase/migrations.
 * Regenerate with `supabase gen types typescript` once a project is linked.
 */

export type SubscriptionStatus =
  | "none"
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete";

export interface UserRow {
  id: string;
  email: string;
  stripe_customer_id: string | null;
  subscription_status: SubscriptionStatus;
  subscription_period_end: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface UserInsert {
  id: string;
  email: string;
  stripe_customer_id?: string | null;
  subscription_status?: SubscriptionStatus;
  subscription_period_end?: string | null;
  is_admin?: boolean;
  created_at?: string;
}

export interface UserUpdate {
  email?: string;
  stripe_customer_id?: string | null;
  subscription_status?: SubscriptionStatus;
  subscription_period_end?: string | null;
}

export interface ChildProfileRow {
  id: string;
  user_id: string;
  name: string;
  grade: number;
  theme_preference: string;
  created_at: string;
}

export interface ChildProfileInsert {
  id?: string;
  user_id: string;
  name: string;
  grade: number;
  theme_preference?: string;
  created_at?: string;
}

export interface ChildProfileUpdate {
  name?: string;
  grade?: number;
  theme_preference?: string;
}

export interface WorksheetLogRow {
  id: string;
  user_id: string;
  child_id: string | null;
  subject: string;
  operation: string | null;
  config_json: Record<string, unknown>;
  generated_at: string;
}

export interface WorksheetLogInsert {
  id?: string;
  user_id: string;
  child_id?: string | null;
  subject: string;
  operation?: string | null;
  config_json: Record<string, unknown>;
  generated_at?: string;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: UserInsert;
        Update: UserUpdate;
        Relationships: [];
      };
      children_profiles: {
        Row: ChildProfileRow;
        Insert: ChildProfileInsert;
        Update: ChildProfileUpdate;
        Relationships: [];
      };
      worksheets_log: {
        Row: WorksheetLogRow;
        Insert: WorksheetLogInsert;
        Update: Partial<WorksheetLogRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
