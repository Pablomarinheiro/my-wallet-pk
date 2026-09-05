ALTER TABLE public.transactions ADD CONSTRAINT transactions_amount_check CHECK (amount >= 0);
ALTER TABLE public.card_purchases ADD CONSTRAINT card_purchases_installments_check CHECK (installments >= 1);
ALTER TABLE public.card_purchases ADD CONSTRAINT card_purchases_total_amount_check CHECK (total_amount >= 0);
ALTER TABLE public.card_installments ADD CONSTRAINT card_installments_amount_check CHECK (amount >= 0);

ALTER TABLE public.card_purchases DROP CONSTRAINT card_purchases_card_id_fkey;
ALTER TABLE public.card_purchases ADD CONSTRAINT card_purchases_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE RESTRICT;

ALTER TABLE public.card_installments DROP CONSTRAINT card_installments_card_id_fkey;
ALTER TABLE public.card_installments ADD CONSTRAINT card_installments_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE RESTRICT;