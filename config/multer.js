const multer = require('multer');
// cb: 1st arg - error, 2nd arg - value
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (req.body.type === 'profile') {
      cb(null, 'public/images/profiles');
    } else if (req.body.type === 'topic') {
      cb(null, 'public/images/topics');
    } else {
      cb(new Error('Oops, wrong image type from client.'));
    }
  },
  filename: (req, file, cb) => {
    let ext = file.originalname.split('.').pop();
    if (ext === '') {
      if (file.mimetype === 'image/jpeg') {
        ext = 'jpg';
      } else if (file.mimetype === 'image/png') {
        ext = 'png';
      } else {
        cb(new Error('Wrong image extension'));
      }
    }
    cb(null, req.body.id + '.' + ext)
  }
});

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types - mime types
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true); // NOTE: Accept file - store
  } else {
    cb(null, false); // NOTE: Reject file - don't store
  }
};

module.exports = multer({ storage, fileFilter });
