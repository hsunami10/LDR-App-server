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
INSERT INTO topics VALUES ('', '', '', '', '', 0);
