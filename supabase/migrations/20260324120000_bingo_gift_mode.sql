-- Modo de presentes do Bingo: só administrador ou escolha dos participantes + mínimo por jogador
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS bingo_gift_mode TEXT NOT NULL DEFAULT 'admin_only'
    CHECK (bingo_gift_mode IN ('admin_only', 'participants'));

ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS bingo_min_gifts_per_participant INTEGER NOT NULL DEFAULT 1
    CHECK (bingo_min_gifts_per_participant >= 0);

COMMENT ON COLUMN public.games.bingo_gift_mode IS 'Bingo: admin_only = só organizador define presentes; participants = cada jogador escolhe na prateleira';
COMMENT ON COLUMN public.games.bingo_min_gifts_per_participant IS 'Bingo em modo participants: quantidade mínima de presentes por jogador (com conta vinculada)';
