CREATE TABLE public.app_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  access_restricted boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY app_settings_read ON public.app_settings FOR SELECT TO authenticated USING (true);
CREATE TRIGGER set_updated_at_app_settings BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.app_settings (id, access_restricted) VALUES (true, true)
  ON CONFLICT (id) DO NOTHING;

CREATE TABLE public.allowed_emails (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.allowed_emails TO authenticated;
GRANT ALL ON public.allowed_emails TO service_role;
ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;
-- Sem policies para clientes: só a função de verificação (security definer) lê a lista.

INSERT INTO public.allowed_emails (email) VALUES
  ('pkdemoapp@gmail.com'),
  ('pabloeduraimundo@gmail.com')
ON CONFLICT (email) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_access_allowed()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE
      WHEN NOT COALESCE((SELECT access_restricted FROM public.app_settings LIMIT 1), true) THEN true
      ELSE EXISTS (
        SELECT 1 FROM public.allowed_emails
        WHERE lower(email) = lower(COALESCE(
          (auth.jwt() ->> 'email'),
          (SELECT u.email FROM auth.users u WHERE u.id = auth.uid())
        ))
      )
    END;
$$;
REVOKE ALL ON FUNCTION public.is_access_allowed() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_access_allowed() TO authenticated;

-- ===== Aplica a verificação nas policies existentes =====
DROP POLICY IF EXISTS accounts_all_own ON public.accounts;
CREATE POLICY accounts_all_own ON public.accounts FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.is_access_allowed())
  WITH CHECK (auth.uid() = user_id AND public.is_access_allowed());

DROP POLICY IF EXISTS cards_all_own ON public.cards;
CREATE POLICY cards_all_own ON public.cards FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.is_access_allowed())
  WITH CHECK (auth.uid() = user_id AND public.is_access_allowed());

DROP POLICY IF EXISTS categories_all_own ON public.categories;
CREATE POLICY categories_all_own ON public.categories FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.is_access_allowed())
  WITH CHECK (auth.uid() = user_id AND public.is_access_allowed());

DROP POLICY IF EXISTS transactions_all_own ON public.transactions;
CREATE POLICY transactions_all_own ON public.transactions FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.is_access_allowed())
  WITH CHECK (auth.uid() = user_id AND public.is_access_allowed());

DROP POLICY IF EXISTS goals_all_own ON public.goals;
CREATE POLICY goals_all_own ON public.goals FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.is_access_allowed())
  WITH CHECK (auth.uid() = user_id AND public.is_access_allowed());

DROP POLICY IF EXISTS budgets_all_own ON public.budgets;
CREATE POLICY budgets_all_own ON public.budgets FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.is_access_allowed())
  WITH CHECK (auth.uid() = user_id AND public.is_access_allowed());

DROP POLICY IF EXISTS card_purchases_all_own ON public.card_purchases;
CREATE POLICY card_purchases_all_own ON public.card_purchases FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.is_access_allowed())
  WITH CHECK (auth.uid() = user_id AND public.is_access_allowed());

DROP POLICY IF EXISTS card_installments_all_own ON public.card_installments;
CREATE POLICY card_installments_all_own ON public.card_installments FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.is_access_allowed())
  WITH CHECK (auth.uid() = user_id AND public.is_access_allowed());

DROP POLICY IF EXISTS investments_all_own ON public.investments;
CREATE POLICY investments_all_own ON public.investments FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.is_access_allowed())
  WITH CHECK (auth.uid() = user_id AND public.is_access_allowed());

DROP POLICY IF EXISTS investment_transactions_all_own ON public.investment_transactions;
CREATE POLICY investment_transactions_all_own ON public.investment_transactions FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.is_access_allowed())
  WITH CHECK (auth.uid() = user_id AND public.is_access_allowed());

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id AND public.is_access_allowed());
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id AND public.is_access_allowed())
  WITH CHECK (auth.uid() = id AND public.is_access_allowed());
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id AND public.is_access_allowed());