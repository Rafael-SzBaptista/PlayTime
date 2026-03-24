-- Rouba Presente: presente escolhido visível só ao organizador e ao próprio participante;
-- status "presente em mãos" visível a todos os participantes do jogo (checklist).

CREATE TABLE public.rouba_participant_gift (
  participant_id UUID PRIMARY KEY REFERENCES public.game_participants(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  gift_choice TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rouba_participant_gift_game_id_idx ON public.rouba_participant_gift(game_id);

CREATE TABLE public.rouba_participant_ready (
  participant_id UUID PRIMARY KEY REFERENCES public.game_participants(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  gift_in_hands BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rouba_participant_ready_game_id_idx ON public.rouba_participant_ready(game_id);

ALTER TABLE public.rouba_participant_gift ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rouba_participant_ready ENABLE ROW LEVEL SECURITY;

-- Participante "eu" = user_id ou e-mail igual ao JWT
CREATE OR REPLACE FUNCTION public.is_rouba_participant_self(p_participant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.game_participants gp
    WHERE gp.id = p_participant_id
      AND (
        gp.user_id = auth.uid()
        OR (
          gp.user_id IS NULL
          AND gp.email IS NOT NULL
          AND (auth.jwt() ->> 'email') IS NOT NULL
          AND lower(trim(gp.email)) = lower(trim(auth.jwt() ->> 'email'))
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_rouba_game_owner(p_game_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.games g
    WHERE g.id = p_game_id AND g.owner_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.user_linked_to_rouba_game(p_game_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.game_participants gp
    WHERE gp.game_id = p_game_id
      AND (
        gp.user_id = auth.uid()
        OR (
          gp.user_id IS NULL
          AND gp.email IS NOT NULL
          AND (auth.jwt() ->> 'email') IS NOT NULL
          AND lower(trim(gp.email)) = lower(trim(auth.jwt() ->> 'email'))
        )
      )
  );
$$;

-- Presente: só dono do jogo ou o próprio participante
CREATE POLICY "rouba_gift_select" ON public.rouba_participant_gift FOR SELECT
USING (
  public.is_rouba_game_owner(game_id)
  OR public.is_rouba_participant_self(participant_id)
);

CREATE POLICY "rouba_gift_insert" ON public.rouba_participant_gift FOR INSERT
WITH CHECK (
  public.is_rouba_game_owner(game_id)
  OR public.is_rouba_participant_self(participant_id)
);

CREATE POLICY "rouba_gift_update" ON public.rouba_participant_gift FOR UPDATE
USING (
  public.is_rouba_game_owner(game_id)
  OR public.is_rouba_participant_self(participant_id)
)
WITH CHECK (
  public.is_rouba_game_owner(game_id)
  OR public.is_rouba_participant_self(participant_id)
);

CREATE POLICY "rouba_gift_delete" ON public.rouba_participant_gift FOR DELETE
USING (public.is_rouba_game_owner(game_id));

-- Checklist: qualquer participante ligado ao jogo ou organizador pode ver
CREATE POLICY "rouba_ready_select" ON public.rouba_participant_ready FOR SELECT
USING (
  public.is_rouba_game_owner(game_id)
  OR public.user_linked_to_rouba_game(game_id)
);

CREATE POLICY "rouba_ready_insert" ON public.rouba_participant_ready FOR INSERT
WITH CHECK (
  public.is_rouba_game_owner(game_id)
  OR public.is_rouba_participant_self(participant_id)
);

CREATE POLICY "rouba_ready_update" ON public.rouba_participant_ready FOR UPDATE
USING (
  public.is_rouba_game_owner(game_id)
  OR public.is_rouba_participant_self(participant_id)
)
WITH CHECK (
  public.is_rouba_game_owner(game_id)
  OR public.is_rouba_participant_self(participant_id)
);

CREATE POLICY "rouba_ready_delete" ON public.rouba_participant_ready FOR DELETE
USING (public.is_rouba_game_owner(game_id));

REVOKE ALL ON FUNCTION public.is_rouba_participant_self(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_rouba_game_owner(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_linked_to_rouba_game(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_rouba_participant_self(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_rouba_game_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_linked_to_rouba_game(UUID) TO authenticated;
