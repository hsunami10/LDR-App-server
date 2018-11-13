-- Insert dummy user
INSERT INTO users VALUES (
  '',
  '',
  '',
  '',
  NULL,
  NULL,
  '',
  0,
  NULL,
  NULL,
  '',
  0,
  NULL,
  NULL,
  'standard'
);

-- Create dummy asias for users who don't have an alias to post
INSERT INTO aliases VALUES ('', '', '', '');

-- Create a dummy topic for posts that do not belong to a topic
INSERT INTO topics VALUES ('', 'Global', 'global', 'images/topics/global.jpg', 'This topic is used for general posts, anything that does not fit in the other topics.', 0);
