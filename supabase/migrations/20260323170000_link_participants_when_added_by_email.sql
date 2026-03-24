-- Backfill existing participants created only with email
UPDATE public.game_participants gp
SET user_id = au.id,
    status = 'confirmed'
FROM auth.users au
WHERE gp.user_id IS NULL
  AND gp.email IS NOT NULL
  AND lower(gp.email) = lower(au.email);

-- Keep user_id in sync when participant is inserted/updated with email
CREATE OR REPLACE FUNCTION public.bind_participant_user_by_email()
RETURNS TRIGGER AS $$
DECLARE
  matched_user_id UUID;
BEGIN
  IF NEW.user_id IS NULL AND NEW.email IS NOT NULL THEN
    SELECT id
    INTO matched_user_id
    FROM auth.users
    WHERE lower(email) = lower(NEW.email)
    LIMIT 1;

    IF matched_user_id IS NOT NULL THEN
      NEW.user_id := matched_user_id;
      NEW.status := 'confirmed';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

DROP TRIGGER IF EXISTS on_game_participant_bind_user ON public.game_participants;

CREATE TRIGGER on_game_participant_bind_user
BEFORE INSERT OR UPDATE OF email, user_id ON public.game_participants
FOR EACH ROW
EXECUTE FUNCTION public.bind_participant_user_by_email();
