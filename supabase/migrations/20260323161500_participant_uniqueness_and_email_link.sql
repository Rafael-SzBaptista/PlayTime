-- Remove duplicates to allow unique indexes
WITH duplicates_by_user AS (
  SELECT
    ctid,
    ROW_NUMBER() OVER (PARTITION BY game_id, user_id ORDER BY created_at, id) AS rn
  FROM public.game_participants
  WHERE user_id IS NOT NULL
)
DELETE FROM public.game_participants gp
USING duplicates_by_user d
WHERE gp.ctid = d.ctid
  AND d.rn > 1;

WITH duplicates_by_email AS (
  SELECT
    ctid,
    ROW_NUMBER() OVER (PARTITION BY game_id, lower(email) ORDER BY created_at, id) AS rn
  FROM public.game_participants
  WHERE email IS NOT NULL
)
DELETE FROM public.game_participants gp
USING duplicates_by_email d
WHERE gp.ctid = d.ctid
  AND d.rn > 1;

-- A user can only be a participant once per game
CREATE UNIQUE INDEX IF NOT EXISTS game_participants_unique_user_per_game
  ON public.game_participants (game_id, user_id)
  WHERE user_id IS NOT NULL;

-- Optional email can only appear once per game
CREATE UNIQUE INDEX IF NOT EXISTS game_participants_unique_email_per_game
  ON public.game_participants (game_id, lower(email))
  WHERE email IS NOT NULL;

-- When a new auth user is created, bind pending participants by email
CREATE OR REPLACE FUNCTION public.link_participants_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.game_participants
  SET user_id = NEW.id,
      status = 'confirmed'
  WHERE user_id IS NULL
    AND email IS NOT NULL
    AND lower(email) = lower(NEW.email);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_link_participants ON auth.users;

CREATE TRIGGER on_auth_user_link_participants
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.link_participants_on_signup();
