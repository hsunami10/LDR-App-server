CREATE OR REPLACE FUNCTION generate_topics(count bigint)
RETURNS VOID AS $$
DECLARE
  iterator bigint := 0;
BEGIN
  WHILE iterator < count
  LOOP
    -- TODO: Finish this later
    iterator := iterator + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
