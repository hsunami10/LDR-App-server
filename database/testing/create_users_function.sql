CREATE OR REPLACE FUNCTION create_users(count bigint)
RETURNS VOID AS $BODY$
DECLARE
  iterator bigint := 0;
  u_name text;
  date_j bigint;
  random_num integer;
BEGIN
  WHILE iterator < count
  LOOP
    random_num := cast(ceil(random() * 20 + 6) as integer);
    u_name := random_string(random_num);
    -- date_j := cast(ceil(extract(epoch from now())) as bigint);
    date_j := cast(ceil(random() * 10000 + 1542500000) as bigint);
    insert into users (id, username, lowercase_username, password, date_joined) values (
      uuid_generate_v4(),
      u_name,
      lower(u_name),
      random_string(random_num),
      date_j
    );
    iterator := iterator + 1;
  END LOOP;
END;
$BODY$ LANGUAGE plpgsql;
