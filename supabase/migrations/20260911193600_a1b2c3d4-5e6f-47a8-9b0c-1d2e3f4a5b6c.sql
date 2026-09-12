-- A verificação is_access_allowed() só bloqueava LEITURA/ESCRITA de dados
-- (accounts, transactions, ...) depois que a conta já existia. O signUp()
-- do Supabase Auth sempre criava a linha em auth.users e, via trigger
-- handle_new_user, o profile + categorias padrão, ANTES de qualquer checagem
-- de allowlist. Resultado: e-mails fora da lista conseguiam "criar conta"
-- mesmo com o acesso restrito, mesmo não conseguindo depois usar o app.
--
-- Este trigger bloqueia a criação da conta na origem (auth.users), cobrindo
-- todos os fluxos de entrada (senha, Google OAuth, magic link) com um único
-- ponto de verificação.
CREATE OR REPLACE FUNCTION public.enforce_signup_allowlist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE((SELECT access_restricted FROM public.app_settings LIMIT 1), true) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.allowed_emails WHERE lower(email) = lower(NEW.email)
    ) THEN
      RAISE EXCEPTION 'Este app está em acesso restrito no momento.'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_signup_allowlist() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_signup_allowlist ON auth.users;
CREATE TRIGGER trg_enforce_signup_allowlist
BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.enforce_signup_allowlist();
