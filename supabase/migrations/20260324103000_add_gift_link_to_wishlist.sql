ALTER TABLE public.participant_wishlist_entries
ADD COLUMN IF NOT EXISTS gift_link TEXT;
