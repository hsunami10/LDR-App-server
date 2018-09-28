-- Insert dummy user
INSERT INTO users VALUES (
  '',
  '',
  '',
  '',
  NULL,
  NULL,
  NULL,
  0,
  NULL,
  NULL,
  NULL,
  NULL,
  'standard'
);

-- Create dummy asias for users who don't have an alias to post
INSERT INTO aliases VALUES ('', '', '', '');
