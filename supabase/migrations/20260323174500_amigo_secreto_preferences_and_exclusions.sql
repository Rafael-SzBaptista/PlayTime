CREATE TABLE IF NOT EXISTS public.participant_wishlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.game_participants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  gift_name TEXT NOT NULL,
  gift_category TEXT,
  gift_emoji TEXT,
  gift_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS participant_wishlist_unique_item
  ON public.participant_wishlist_entries (participant_id, lower(gift_name));

CREATE TABLE IF NOT EXISTS public.participant_draw_exclusions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  giver_participant_id UUID NOT NULL REFERENCES public.game_participants(id) ON DELETE CASCADE,
  receiver_participant_id UUID NOT NULL REFERENCES public.game_participants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT participant_draw_exclusions_no_self CHECK (giver_participant_id <> receiver_participant_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS participant_draw_exclusions_unique_pair
  ON public.participant_draw_exclusions (giver_participant_id, receiver_participant_id);

ALTER TABLE public.participant_wishlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_draw_exclusions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Wishlist readable by game members" ON public.participant_wishlist_entries;
CREATE POLICY "Wishlist readable by game members"
  ON public.participant_wishlist_entries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.game_participants gp
      WHERE gp.game_id = participant_wishlist_entries.game_id
        AND (gp.user_id = auth.uid() OR EXISTS (
          SELECT 1 FROM public.games g WHERE g.id = participant_wishlist_entries.game_id AND g.owner_id = auth.uid()
        ))
    )
  );

DROP POLICY IF EXISTS "Wishlist manageable by owner or participant" ON public.participant_wishlist_entries;
CREATE POLICY "Wishlist manageable by owner or participant"
  ON public.participant_wishlist_entries
  FOR ALL
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.games g WHERE g.id = participant_wishlist_entries.game_id AND g.owner_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.games g WHERE g.id = participant_wishlist_entries.game_id AND g.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Exclusions readable by game members" ON public.participant_draw_exclusions;
CREATE POLICY "Exclusions readable by game members"
  ON public.participant_draw_exclusions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.game_participants gp
      WHERE gp.game_id = participant_draw_exclusions.game_id
        AND gp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.games g
      WHERE g.id = participant_draw_exclusions.game_id
        AND g.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Exclusions manageable by owner" ON public.participant_draw_exclusions;
CREATE POLICY "Exclusions manageable by owner"
  ON public.participant_draw_exclusions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.id = participant_draw_exclusions.game_id
        AND g.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.id = participant_draw_exclusions.game_id
        AND g.owner_id = auth.uid()
    )
  );
