-- 12 tables

-- Dummy user
CREATE TABLE users (
  id text PRIMARY KEY,
  username text NOT NULL UNIQUE,
  lowercase_username text NOT NULL UNIQUE, -- for ignoring case sensitivity
  password text NOT NULL,
  email text UNIQUE,
  profile_pic text UNIQUE, -- filename.extension
  date_joined bigint NOT NULL,
  location geography,
  coordinates text, -- longitude latitude
  token text UNIQUE,
  token_time bigint,
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

-- NOTE: user1_id - generates request_code. user2_id - searches with code and accepts
-- When adding user2_id as something OTHER THAN '', remove all instances of user1_id that equals that user2_id
-- Default user2_id to ''
CREATE TABLE partners (
  id text PRIMARY KEY,
  user1_id text UNIQUE REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  user2_id text UNIQUE REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  date_together bigint, -- start date
  request_code text NOT NULL UNIQUE,
  date_requested bigint NOT NULL, -- 30 min limit
  countdown bigint,
  type text NOT NULL DEFAULT 'in-person' -- 'ldr', 'in-person', 'both'
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

-- Remove from friend_requests, friends, partners tables
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
  hidden boolean NOT NULL DEFAULT false,
  location geography,
  coordinates text -- longitude latitude
);

CREATE TABLE comments (
  id text PRIMARY KEY,
  post_id text REFERENCES posts (id) ON UPDATE CASCADE ON DELETE CASCADE,
  author_id text REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  date_sent bigint NOT NULL,
  body text NOT NULL DEFAULT ''
);

CREATE TABLE discover_searches (
  id text PRIMARY KEY,
  search_term text NOT NULL UNIQUE,
  lowercase_search_term text NOT NULL UNIQUE, -- Use this to ignore case sensitivity
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

-- Need this for INSERT ON CONFLICT UPDATE
ALTER TABLE interactions ADD CONSTRAINT interactions_user_id_post_id_constraint UNIQUE (user_id, post_id);
ALTER TABLE partners ADD CONSTRAINT partners_user1_id_user2_id_constraint UNIQUE (user1_id, user2_id);
ALTER TABLE friend_requests ADD CONSTRAINT friend_requests_sender_receiver_id_constraint UNIQUE (sender_id, receiver_id);

-- Insert dummy user
INSERT INTO users VALUES (
  '',
  '',
  '',
  '',
  NULL,
  NULL,
  0,
  NULL,
  NULL,
  '',
  0,
  NULL,
  NULL,
  'standard'
);
