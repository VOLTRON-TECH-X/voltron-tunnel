CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE public.site_state (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_state TO anon, authenticated;
GRANT ALL ON public.site_state TO service_role;
ALTER TABLE public.site_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read site state" ON public.site_state FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.admin_credentials (
  username text PRIMARY KEY,
  password_hash text NOT NULL
);
GRANT ALL ON public.admin_credentials TO service_role;
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.admin_verify(p_username text, p_password text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, extensions AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_credentials
    WHERE username = p_username AND password_hash = extensions.crypt(p_password, password_hash));
$$;

CREATE OR REPLACE FUNCTION public.admin_set_state(p_username text, p_password text, p_key text, p_value jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  IF NOT public.admin_verify(p_username, p_password) THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF p_key NOT IN ('voltron_servers','voltron_server_counts','voltron_contact_config','voltron_public_notices','voltron_duration_config','voltron_daily_config') THEN
    RAISE EXCEPTION 'Invalid key';
  END IF;
  INSERT INTO public.site_state(key, value, updated_at) VALUES (p_key, p_value, now())
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.increment_server_count(p_server_id text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  d text := to_char((now() AT TIME ZONE 'utc')::date, 'YYYY-MM-DD');
  cur jsonb; n integer;
BEGIN
  IF length(p_server_id) > 100 THEN RAISE EXCEPTION 'Invalid id'; END IF;
  SELECT value INTO cur FROM public.site_state WHERE key = 'voltron_server_counts' FOR UPDATE;
  cur := coalesce(cur, '{}'::jsonb);
  n := CASE WHEN cur->p_server_id->>'day' = d THEN coalesce((cur->p_server_id->>'n')::int, 0) + 1 ELSE 1 END;
  cur := jsonb_set(cur, ARRAY[p_server_id], jsonb_build_object('day', d, 'n', n));
  INSERT INTO public.site_state(key, value, updated_at) VALUES ('voltron_server_counts', cur, now())
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
  RETURN n;
END $$;

REVOKE ALL ON FUNCTION public.admin_verify(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_state(text, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_server_count(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_verify(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_state(text, text, text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_server_count(text) TO anon, authenticated;