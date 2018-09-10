-- Dummy user
CREATE TABLE users (
  id text PRIMARY KEY,
  username text NOT NULL UNIQUE,
  password text NOT NULL,
  email text UNIQUE,
  profile_pic text UNIQUE, -- filename.extension
  date_joined timestamp with time zone DEFAULT NOW(),
  airport_id smallint,
  location geography,
  coordinates text, -- longitude latitude
  email_token text UNIQUE,
  token_time timestamp with time zone DEFAULT NOW(),
  email_verified boolean DEFAULT FALSE,
  active boolean DEFAULT FALSE,
  user_type text DEFAULT 'standard'
);

-- Delete from this table if any repeat partner1_id or partner2_id
-- Could happen if both generate a code, and one accepts it
CREATE TABLE partners (
  id text PRIMARY KEY,
  partner1_id text UNIQUE REFERENCES users (id), -- one who sends the request
  partner2_id text REFERENCES users (id) DEFAULT '', -- one who accepts the request
  code text NOT NULL,
  next_meetup timestamp with time zone
);

-- Only add row if mutual friends
-- When adding row, remove row from friend_requests
CREATE TABLE friends (
  id text PRIMARY KEY,
  user1_id text REFERENCES users (id),
  user2_id text REFERENCES users (id),
  date_friended timestamp with time zone NOT NULL DEFAULT NOW()
);

CREATE TABLE blocked (
  id text PRIMARY KEY,
  user1_id text REFERENCES users (id),
  user2_id text REFERENCES users (id),
);

CREATE TABLE subscribers (
  id text PRIMARY KEY,
  subscriber_id text REFERENCES users (id),
  user_id text REFERENCES users (id),
  date_subscribed timestamp with time zone NOT NULL DEFAULT NOW()
);

CREATE TABLE reports (
  id text PRIMARY KEY,
  user_id text REFERENCES users (id),
  target_id text REFERENCES users(id),
  body text NOT NULL DEFAULT '',
  date_sent timestamp with time zone NOT NULL DEFAULT NOW()
);

-- Dummy alias
CREATE TABLE aliases (
  id text PRIMARY KEY,
  user_id text REFERENCES users (id),
  alias text NOT NULL UNIQUE
);

CREATE TABLE posts (
  id text PRIMARY KEY,
  author_id text REFERENCES users (id),
  alias_id text REFERENCES aliases (id), -- Can be , then use author_id (username)
  date_posted timestamp with time zone NOT NULL DEFAULT NOW(),
  body text NOT NULL DEFAULT '',
  location geography,
  coordinates text, -- longitude latitude
  num_likes integer NOT NULL DEFAULT 0
);

CREATE TABLE comments (
  id text PRIMARY KEY,
  post_id text REFERENCES posts (id),
  author_id text REFERENCES users (id),
  date_sent timestamp with time zone NOT NULL DEFAULT NOW(),
  body text NOT NULL DEFAULT '',
  num_likes integer NOT NULL DEFAULT 0
);

CREATE TABLE friend_requests (
  id text PRIMARY KEY,
  sender_id text REFERENCES users (id), -- Look here for friend requests sent
  receiver_id text REFERENCES users (id), -- Look here for friend requests pending
  message text NOT NULL DEFAULT 'Let\'s be friends!'
);
