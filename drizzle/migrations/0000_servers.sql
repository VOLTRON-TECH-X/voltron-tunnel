CREATE TABLE public.servers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  api_url text NOT NULL,
  api_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  daily_limit integer NOT NULL DEFAULT 10,
  bandwidth_total_gb numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.servers TO service_role;
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.account_creations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id uuid NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  username text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.account_creations TO service_role;
ALTER TABLE public.account_creations ENABLE ROW LEVEL SECURITY;
CREATE INDEX account_creations_server_day ON public.account_creations(server_id, created_at);

INSERT INTO public.servers (name, category, api_url, api_key, enabled, daily_limit)
VALUES ('Voltron Main', 'Premium', 'https://api.voltrontechtx.shop', 'voltron_PhESsAsy3dFbDfQAkqLzTNjgMSrJHQPB', true, 10);