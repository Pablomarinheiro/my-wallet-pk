-- ============ CARD PURCHASES ============
CREATE TABLE public.card_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  description text NOT NULL,
  merchant text,
  total_amount numeric NOT NULL DEFAULT 0,
  installments integer NOT NULL DEFAULT 1,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  has_interest boolean NOT NULL DEFAULT false,
  interest_rate numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.card_purchases TO authenticated;
GRANT ALL ON public.card_purchases TO service_role;
ALTER TABLE public.card_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY card_purchases_all_own ON public.card_purchases FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER set_updated_at_card_purchases BEFORE UPDATE ON public.card_purchases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.card_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_id uuid NOT NULL REFERENCES public.card_purchases(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  number integer NOT NULL DEFAULT 1,
  total integer NOT NULL DEFAULT 1,
  amount numeric NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  paid boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX card_installments_card_due_idx ON public.card_installments (card_id, due_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.card_installments TO authenticated;
GRANT ALL ON public.card_installments TO service_role;
ALTER TABLE public.card_installments ENABLE ROW LEVEL SECURITY;
CREATE POLICY card_installments_all_own ON public.card_installments FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER set_updated_at_card_installments BEFORE UPDATE ON public.card_installments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.generate_card_installments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
  gross numeric;
  base numeric;
  last_amt numeric;
  due_dom integer;
  i integer;
  d date;
BEGIN
  DELETE FROM public.card_installments WHERE purchase_id = NEW.id;
  n := GREATEST(COALESCE(NEW.installments, 1), 1);
  gross := COALESCE(NEW.total_amount, 0);
  IF NEW.has_interest THEN
    gross := gross * (1 + COALESCE(NEW.interest_rate, 0) / 100.0);
  END IF;
  base := ROUND(gross / n, 2);
  last_amt := ROUND(gross - base * (n - 1), 2);
  SELECT COALESCE(due_day, 10) INTO due_dom FROM public.cards WHERE id = NEW.card_id;
  due_dom := LEAST(GREATEST(COALESCE(due_dom, 10), 1), 28);

  FOR i IN 1..n LOOP
    d := (date_trunc('month', NEW.purchase_date)::date + ((i - 1) || ' month')::interval)::date
         + (due_dom - 1);
    INSERT INTO public.card_installments (user_id, purchase_id, card_id, number, total, amount, due_date)
    VALUES (NEW.user_id, NEW.id, NEW.card_id, i, n, CASE WHEN i = n THEN last_amt ELSE base END, d);
  END LOOP;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.generate_card_installments() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_generate_card_installments
AFTER INSERT OR UPDATE OF total_amount, installments, purchase_date, has_interest, interest_rate, card_id
ON public.card_purchases
FOR EACH ROW EXECUTE FUNCTION public.generate_card_installments();

-- ============ INVESTMENTS ============
CREATE TABLE public.investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'fixed_income',
  quantity numeric NOT NULL DEFAULT 0,
  avg_price numeric NOT NULL DEFAULT 0,
  current_value numeric NOT NULL DEFAULT 0,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  color text NOT NULL DEFAULT '#2563EB',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investments TO authenticated;
GRANT ALL ON public.investments TO service_role;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY investments_all_own ON public.investments FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER set_updated_at_investments BEFORE UPDATE ON public.investments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.investment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  investment_id uuid NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'deposit',
  amount numeric NOT NULL DEFAULT 0,
  quantity numeric NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX investment_transactions_inv_idx ON public.investment_transactions (investment_id, date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investment_transactions TO authenticated;
GRANT ALL ON public.investment_transactions TO service_role;
ALTER TABLE public.investment_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY investment_transactions_all_own ON public.investment_transactions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER set_updated_at_investment_transactions BEFORE UPDATE ON public.investment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();