-- Checklist "presente em mãos" no Rouba: usa a mesma tabela de participantes
-- (políticas RLS já permitem o organizador e o próprio participante atualizarem).

ALTER TABLE public.game_participants
ADD COLUMN IF NOT EXISTS rouba_gift_in_hands BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.game_participants.rouba_gift_in_hands IS
  'Rouba Presente: participante já tem o presente em mãos (checklist visível a todos).';
