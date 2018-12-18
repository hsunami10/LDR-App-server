-- RETURNS: 'already_subscribed', 'not_subscribed', 'just_subscribed'
CREATE OR REPLACE FUNCTION get_topic_relation(u_id text, t_id text)
RETURNS TEXT AS $BODY$
DECLARE
  doesExist boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM topic_subscribers WHERE topic_subscribers.subscriber_id = u_id AND topic_subscribers.topic_id = t_id LIMIT 1) INTO doesExist;
  IF doesExist THEN
    RETURN 'already_subscribed';
  END IF;
  RETURN 'not_subscribed';
END;
$BODY$ LANGUAGE plpgsql
