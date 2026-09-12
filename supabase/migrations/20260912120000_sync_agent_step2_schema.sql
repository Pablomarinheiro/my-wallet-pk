-- Odisseu Sync Agent — Step 2 schema (see odisseu-sync-agent-step-2.md).
-- Adds: transactions.source, whatsapp_authorizations, sync_logs.
-- All new tables/columns are additive and default-safe — no existing row changes shape.

-- ============ transactions.source ============
ALTER TABLE public.transactions
  ADD COLUMN source text NOT NULL DEFAULT 'app'
  CHECK (source IN ('app', 'whatsapp'));

-- ============ whatsapp_authorizations ============
CREATE TABLE public.whatsapp_authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number text NOT NULL,              -- E.164, ex: +5511999999999
  confirmation_code text,                  -- 6 dígitos numéricos, null após confirmado
  confirmation_expires_at timestamptz,     -- curta duração: 10 min
  authorization_status text NOT NULL DEFAULT 'pending'
    CHECK (authorization_status IN ('pending', 'confirmed', 'revoked')),
  failed_attempts integer NOT NULL DEFAULT 0,
  failed_attempts_reset_at timestamptz,    -- janela de 1h para o rate limit do serviço Baileys
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (phone_number), -- um número só pode estar ligado a 1 conta
  UNIQUE (user_id)       -- uma conta só tem 1 número vinculado (MVP)
);

CREATE INDEX whatsapp_authorizations_user_idx ON public.whatsapp_authorizations (user_id);

CREATE TRIGGER set_updated_at_whatsapp_authorizations
  BEFORE UPDATE ON public.whatsapp_authorizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.whatsapp_authorizations ENABLE ROW LEVEL SECURITY;

-- O usuário autenticado pode ver e criar/renovar a própria linha (via server function,
-- nunca direto do client) — mas não pode CONFIRMAR nem apagar. Só o service role
-- (o serviço Baileys, ao validar o código recebido no WhatsApp) faz isso.
CREATE POLICY whatsapp_auth_select_own ON public.whatsapp_authorizations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY whatsapp_auth_upsert_own ON public.whatsapp_authorizations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_access_allowed());

CREATE POLICY whatsapp_auth_update_own_pending ON public.whatsapp_authorizations
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND authorization_status = 'pending')
  WITH CHECK (auth.uid() = user_id AND authorization_status = 'pending');

GRANT SELECT, INSERT, UPDATE ON public.whatsapp_authorizations TO authenticated;
GRANT ALL ON public.whatsapp_authorizations TO service_role;

-- ============ sync_logs ============
CREATE TABLE public.sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp')),
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  raw_message text,
  parsed_result jsonb,
  confidence numeric,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('ok', 'low_confidence', 'error', 'ignored')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sync_logs_user_idx ON public.sync_logs (user_id, created_at DESC);

ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Só o service role escreve. O usuário só lê o próprio histórico.
CREATE POLICY sync_logs_select_own ON public.sync_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

GRANT SELECT ON public.sync_logs TO authenticated;
GRANT ALL ON public.sync_logs TO service_role;
