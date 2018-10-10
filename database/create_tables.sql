-- 12 tables

-- Dummy user
CREATE TABLE users (
  id text PRIMARY KEY,
  username text NOT NULL UNIQUE,
  lowercase_username text NOT NULL UNIQUE, -- for ignoring case sensitivity
  password text NOT NULL,
  email text UNIQUE,
  profile_pic text UNIQUE, -- filename.extension
  bio text,
  date_joined bigint NOT NULL,
  location geography,
  coordinates text, -- longitude latitude
  token text UNIQUE,
  token_time bigint,
  email_verified boolean DEFAULT FALSE,
  active boolean DEFAULT FALSE, -- NOTE: if can't figure out how to run an event on app terminate, then remove this
  user_type text NOT NULL DEFAULT 'standard' -- 'admin', 'standard'
);

CREATE TABLE topics (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  lowercase_name text NOT NULL UNIQUE, -- for ignoring case sensitivity
  topic_pic text NOT NULL UNIQUE,
  description text NOT NULL,
  date_created bigint NOT NULL
);

CREATE TABLE topic_subscribers (
  id text PRIMARY KEY,
  subscriber_id text REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  topic_id text REFERENCES topics (id) ON UPDATE CASCADE ON DELETE CASCADE,
  muted boolean NOT NULL DEFAULT false,
  date_subscribed bigint NOT NULL,
  subscriber_type text NOT NULL DEFAULT 'standard' -- 'admin', 'standard'
);

-- Delete from this table if any repeat partner1_id or partner2_id
-- Could happen if both generate a code, and one accepts it
CREATE TABLE partners (
  id text PRIMARY KEY,
  partner1_id text UNIQUE REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE, -- one who sends the request
  partner2_id text REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE DEFAULT '', -- one who accepts the request
  code text NOT NULL,
  next_meetup bigint
);

-- Only add row if mutual friends
-- When adding row, remove row from friend_requests
CREATE TABLE friends (
  id text PRIMARY KEY,
  user1_id text REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  user2_id text REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  date_friended bigint NOT NULL
);

CREATE TABLE blocked (
  id text PRIMARY KEY,
  user1_id text REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  user2_id text REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE user_subscribers (
  id text PRIMARY KEY,
  subscriber_id text REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  user_id text REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  date_subscribed bigint NOT NULL
);

CREATE TABLE reports (
  id text PRIMARY KEY,
  user_id text REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  target_id text REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  body text NOT NULL DEFAULT '',
  date_sent bigint NOT NULL
);

-- Dummy alias
CREATE TABLE aliases (
  id text PRIMARY KEY,
  user_id text REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  alias text NOT NULL UNIQUE,
  lowercase_alias text NOT NULL UNIQUE
);

CREATE TABLE posts (
  id text PRIMARY KEY,
  topic_id text REFERENCES topics (id) ON UPDATE CASCADE ON DELETE CASCADE,
  author_id text REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  alias_id text REFERENCES aliases (id) ON UPDATE CASCADE ON DELETE CASCADE, -- Can be , then use author_id (username)
  date_posted bigint NOT NULL,
  body text NOT NULL DEFAULT '',
  location geography,
  coordinates text, -- longitude latitude
  num_likes integer NOT NULL DEFAULT 0
);

CREATE TABLE comments (
  id text PRIMARY KEY,
  post_id text REFERENCES posts (id) ON UPDATE CASCADE ON DELETE CASCADE,
  author_id text REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  date_sent bigint NOT NULL,
  body text NOT NULL DEFAULT '',
  num_likes integer NOT NULL DEFAULT 0
);

CREATE TABLE friend_requests (
  id text PRIMARY KEY,
  sender_id text REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE, -- Look here for friend requests sent
  receiver_id text REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE, -- Look here for friend requests pending
  message text NOT NULL DEFAULT 'Let''s be friends!'
);

CREATE TABLE discover_searches (
  id text PRIMARY KEY,
  search_term text NOT NULL UNIQUE,
  lowercase_search_term text NOT NULL UNIQUE, -- Use this to ignore case sensitivity
  num_searches bigint NOT NULL DEFAULT 0
);
