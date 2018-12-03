-- When calling with SELECT * FROM, remember to include column definition after - can use any name
-- AS (column1 data_type, column2 data_type) -> has to match two return statements
-- Search SAME AS GET_USER_PARTNER if return value changes
CREATE OR REPLACE FUNCTION get_user_partner(u_id text)
RETURNS RECORD AS $BODY$
DECLARE
  user_id text := cast(u_id as text);
  user1_id text;
  user2_id text;
BEGIN
  user1_id := (SELECT partners.user1_id FROM partners WHERE partners.user1_id = user_id OR partners.user2_id = user_id);
  user2_id := (SELECT partners.user2_id FROM partners WHERE partners.user1_id = user_id OR partners.user2_id = user_id);

  IF user1_id = user_id THEN
  	user_id = user2_id;
    RETURN (SELECT ROW(users.id, users.username, users.profile_pic, partners.date_together, partners.countdown, partners.type) FROM users INNER JOIN partners ON partners.user2_id = user_id WHERE users.id = user_id);
  END IF;

  user_id = user1_id;
  RETURN (SELECT ROW(users.id, users.username, users.profile_pic, partners.date_together, partners.countdown, partners.type) FROM users INNER JOIN partners ON partners.user1_id = user_id WHERE users.id = user_id);
END;
$BODY$ LANGUAGE plpgsql;
