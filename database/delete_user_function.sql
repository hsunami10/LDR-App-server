CREATE OR REPLACE FUNCTION delete_user(u_id text)
RETURNS VOID AS $BODY$
DECLARE
BEGIN
  UPDATE users SET deleted = true WHERE id = u_id;
  DELETE FROM notifications WHERE receiver_id = u_id;
  DELETE FROM interactions WHERE user_id = u_id;
  DELETE FROM comment_likes WHERE user_id = u_id;
  DELETE FROM post_likes WHERE user_id = u_id;
  DELETE FROM user_searches WHERE user_id = u_id;
  DELETE FROM reports WHERE user_id = u_id OR target_id = u_id;
  DELETE FROM blocked WHERE user1_id = u_id OR user2_id = u_id;
  DELETE FROM friend_requests WHERE sender_id = u_id OR receiver_id = u_id;
  DELETE FROM friends WHERE user1_id = u_id OR user2_id = u_id;
  DELETE FROM topic_subscribers WHERE subscriber_id = u_id;
END;
$BODY$ LANGUAGE plpgsql;
