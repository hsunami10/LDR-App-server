-- Returns 4 user relations - request, friend, regular, pending - for user interactions
CREATE OR REPLACE FUNCTION get_user_relation(user_id text, other_id text)
RETURNS TEXT AS $BODY$
DECLARE
  doesExist boolean;
BEGIN
  -- Check if friend
  SELECT EXISTS (SELECT 1 FROM friends WHERE (friends.user1_id = user_id AND friends.user2_id = other_id) OR (friends.user1_id = other_id AND friends.user2_id = user_id) LIMIT 1) INTO doesExist;
  IF doesExist THEN
    RETURN 'friend';
  END IF;

  -- Check if request
  SELECT EXISTS (SELECT 1 FROM friend_requests WHERE friend_requests.sender_id = other_id AND friend_requests.receiver_id = user_id LIMIT 1) INTO doesExist;
  IF doesExist THEN
    RETURN 'request';
  END IF;

  -- Check if pending
  SELECT EXISTS (SELECT 1 FROM friend_requests WHERE friend_requests.sender_id = user_id AND friend_requests.receiver_id = other_id LIMIT 1) INTO doesExist;
  IF doesExist THEN
    RETURN 'pending';
  END IF;

  -- If neither three, then regular
  RETURN 'regular';
END;
$BODY$ LANGUAGE plpgsql;
