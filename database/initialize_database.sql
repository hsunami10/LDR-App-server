-- TODO: Change all id PRIMARY KEY columns to type UUID instead of TEXT
CREATE EXTENSION IF NOT EXISTS postgis; -- https://postgis.net/
CREATE EXTENSION IF NOT EXISTS plpgsql;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Dummy user
CREATE TABLE users (
  id text PRIMARY KEY,
  username text NOT NULL UNIQUE,
  lowercase_username text NOT NULL UNIQUE, -- for ignoring case sensitivity
  password text NOT NULL,
  bio text NOT NULL DEFAULT '',
  email text UNIQUE,
  profile_pic text UNIQUE, -- filename.extension
  date_joined bigint NOT NULL,
  -- location geography,
  -- coordinates text, -- longitude latitude
  email_token text UNIQUE,
  email_token_exp bigint,
  email_verified boolean DEFAULT false,
  user_type text NOT NULL DEFAULT 'standard', -- 'admin', 'standard'
  deleted boolean NOT NULL DEFAULT false
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
  muted boolean NOT NULL DEFAULT false, -- notifications muted yes/no
  date_subscribed bigint NOT NULL,
  subscriber_type text NOT NULL DEFAULT 'standard' -- 'admin', 'standard', QUESTION: Who will be admin if admin deletes user account?
);

-- Only add row if mutual friends
-- When adding a row, remove the related row from friend_requests
CREATE TABLE friends (
  id text PRIMARY KEY,
  user1_id text REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  user2_id text REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  date_friended bigint NOT NULL
);

CREATE TABLE friend_requests (
  id text PRIMARY KEY,
  sender_id text REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE, -- Look here for friend requests sent
  receiver_id text REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE, -- Look here for friend requests pending
  date_sent bigint NOT NULL
);

-- Remove from friend_requests, friends, tables when adding here
CREATE TABLE blocked (
  id text PRIMARY KEY,
  user1_id text REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  user2_id text REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE reports (
  id text PRIMARY KEY,
  user_id text REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  target_id text REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  body text NOT NULL DEFAULT '',
  date_sent bigint NOT NULL
);

CREATE TABLE posts (
  id text PRIMARY KEY,
  topic_id text REFERENCES topics (id) ON UPDATE CASCADE ON DELETE CASCADE,
  author_id text REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  date_posted bigint NOT NULL,
  body text NOT NULL DEFAULT '',
  hidden boolean NOT NULL DEFAULT false
  -- location geography,
  -- coordinates text -- longitude latitude
);

CREATE TABLE comments (
  id text PRIMARY KEY,
  post_id text REFERENCES posts (id) ON UPDATE CASCADE ON DELETE CASCADE,
  author_id text REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  date_sent bigint NOT NULL,
  body text NOT NULL DEFAULT ''
);

-- Before inserting new row, check to see if lowercase_search_term matches w/ user_id
-- If matches, then update search_term and date_searched ONLY
-- If no match, then insert new row
-- UPSERT
CREATE TABLE user_searches (
  id text PRIMARY KEY,
  user_id text REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  search_term text NOT NULL,
  lowercase_search_term text NOT NULL,
  date_searched bigint NOT NULL
);

CREATE TABLE all_searches (
  id text PRIMARY KEY,
  search_term text NOT NULL UNIQUE,
  lowercase_search_term text NOT NULL, -- Use this to ignore case sensitivity
  num_searches bigint NOT NULL DEFAULT 0
);

CREATE TABLE post_likes (
  id text PRIMARY KEY,
  user_id text REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  post_id text REFERENCES posts (id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE comment_likes (
  id text PRIMARY KEY,
  user_id text REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  comment_id text REFERENCES comments (id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Add / update this table if liked post or commented post
-- Remove from this table if disliked post - and no comments, or delete comment - no likes
CREATE TABLE interactions (
  id text PRIMARY KEY,
  user_id text REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  post_id text REFERENCES posts (id) ON UPDATE CASCADE ON DELETE CASCADE,
  count bigint NOT NULL DEFAULT 1,
  date_updated bigint NOT NULL
);

CREATE TABLE notifications (
  id text PRIMARY KEY,
  sender_id text REFERENCES users (id) ON UPDATE CASCADE ON DELETE NO ACTION,
  post_id text REFERENCES posts (id) ON UPDATE CASCADE ON DELETE NO ACTION,
  receiver_id text REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  body text NOT NULL DEFAULT '',
  type text NOT NULL,
  viewed boolean DEFAULT false, -- Keep track of what number of show for notifications
  clicked boolean DEFAULT false -- Keep track of which card to color differently
);

-- Need this for INSERT ON CONFLICT UPDATE (upserts)
ALTER TABLE interactions ADD CONSTRAINT interactions_user_id_post_id_constraint UNIQUE (user_id, post_id);
ALTER TABLE friend_requests ADD CONSTRAINT friend_requests_sender_receiver_id_constraint UNIQUE (sender_id, receiver_id);
ALTER TABLE all_searches ADD CONSTRAINT all_searches_search_term_lowercase_constraint UNIQUE (search_term, lowercase_search_term);
ALTER TABLE user_searches ADD CONSTRAINT user_searches_user_id_lowercase_search_term UNIQUE (user_id, lowercase_search_term);

-- Insert dummy user
-- INSERT INTO users VALUES (
--   '',
--   '',
--   '',
--   '',
--   '',
--   NULL,
--   NULL,
--   0,
--   -- NULL,
--   -- '',
--   NULL,
--   0,
--   false,
--   'standard',
--   false
-- );
--
-- INSERT INTO posts VALUES (
--   '',
--   '',
--   '',
--   0,
--   '',
--   null,
--   '',
--   false
-- );
--
-- INSERT INTO topics VALUES (
--   '',
--   '',
--   '',
--   '',
--   '',
--   0
-- );
