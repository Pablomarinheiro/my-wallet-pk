REVOKE ALL ON public.profiles, public.accounts, public.cards, public.categories, public.transactions, public.goals, public.budgets FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;