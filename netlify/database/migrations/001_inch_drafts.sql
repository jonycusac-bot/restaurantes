CREATE TABLE IF NOT EXISTS inch_menu_drafts (
  menu_id text PRIMARY KEY,
  dishes jsonb NOT NULL CHECK (jsonb_typeof(dishes) = 'array'),
  revision integer NOT NULL DEFAULT 1 CHECK (revision >= 1),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
