export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export type Database = {
  public: {
    Tables: {
      site_settings: {
        Row: {
          id: string;
          site_name: string;
          site_description: string | null;
          favicon_url: string | null;
          meta_title: string | null;
          meta_description: string | null;
          meta_keywords: string[] | null;
          meta_verification: Json;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          /* ... */
        };
        Update: {
          /* ... */
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          role: "admin" | "user";
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          role?: "admin" | "user";
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string | null;
        };
      };
      links: {
        Row: {
          id: string;
          title: string;
          url: string;
          type: "nav" | "social" | "footer";
          svg: string | null; // Diubah dari 'icon' menjadi 'svg'
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          url: string;
          type: "nav" | "social" | "footer";
          svg?: string | null; // Diubah dari 'icon' menjadi 'svg'
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          url?: string;
          type?: "nav" | "social" | "footer";
          svg?: string | null; // Diubah dari 'icon' menjadi 'svg'
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      landing_page_sections: {
        Row: {
          id: string;
          user_id: string;
          section_name: string;
          section_data: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          section_name: string;
          section_data: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          section_name?: string;
          section_data?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
