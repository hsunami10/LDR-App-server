-- This returns the correct ID to use to inner join data from the users table
CREATE OR REPLACE FUNCTION get_other_id(user_id text, other1_id text, other2_id text)
RETURNS TEXT AS $BODY$
BEGIN
  IF user_id = other1_id THEN
    RETURN other2_id;
  ELSE
    RETURN other1_id;
  END IF;
END;
$BODY$ LANGUAGE plpgsql

-- CREATE OR REPLACE FUNCTION get_friends(u_id text)
-- RETURNS SETOF RECORD AS $BODY$
-- DECLARE
--   u1_id text;
--   u2_id text;
--   other_id text;
--   r record;
-- BEGIN
--   FOR u1_id, u2_id IN (SELECT user1_id, user2_id FROM friends WHERE user1_id = u_id OR user2_id = u_id)
--   LOOP
--     IF u_id = u1_id THEN
--       other_id := u2_id;
--     ELSE
--       other_id := u1_id;
--     END IF;
--
--     SELECT id, username, profile_pic, 'friend' as type FROM users WHERE id = other_id INTO r;
--     RETURN NEXT r;
--   END LOOP;
--   RETURN;
-- END;
-- $BODY$ LANGUAGE plpgsql
