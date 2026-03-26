-- Remove jogos e dados relacionados após N dias da data do evento.
-- Regra padrão: 7 dias após a data base do evento (troca ou sorteio).

CREATE OR REPLACE FUNCTION public.cleanup_expired_games(p_retention_days integer DEFAULT 7)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  WITH deleted_games AS (
    DELETE FROM public.games g
    WHERE COALESCE(g.exchange_date, g.draw_date) IS NOT NULL
      AND CURRENT_DATE >= (COALESCE(g.exchange_date, g.draw_date) + p_retention_days)
    RETURNING g.id
  )
  SELECT count(*) INTO v_deleted_count FROM deleted_games;

  RETURN v_deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_expired_games(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_games(integer) TO authenticated;

