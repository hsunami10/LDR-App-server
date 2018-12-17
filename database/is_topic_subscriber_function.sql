CREATE OR REPLACE FUNCTION is_topic_subscriber(u_id text, t_id text)
RETURNS BOOLEAN AS $BODY$
DECLARE
  doesExist boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM topic_subscribers WHERE topic_subscribers.subscriber_id = u_id AND topic_subscribers.topic_id = t_id LIMIT 1) INTO doesExist;
  RETURN doesExist;
END;
$BODY$ LANGUAGE plpgsql
