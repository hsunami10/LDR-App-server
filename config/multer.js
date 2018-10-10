const multer = require('multer');
// cb: 1st arg - error, 2nd arg - value
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (req.body.type === 'profile') {
      cb(null, 'public/images/profiles');
    } else if (req.body.type === 'topic') {
      cb(null, 'public/images/topics');
    } else {
      cb(new Error('Wrong image type or undefined - req.body.type from client.'));
    }
  },
  filename: (req, file, cb) => {
    let ext = file.originalname.split('.').pop();
    let id = '';
    if (ext === '') {
      if (file.mimetype === 'image/jpeg') {
        ext = 'jpg';
      } else if (file.mimetype === 'image/png') {
        ext = 'png';
      } else {
        cb(new Error('Wrong image extension'));
      }
    }
    if (req.body.type === 'profile') {
      if (req.body.user_id === undefined) {
        cb(new Error('req.body.user_id is undefined for uploading profile images'))
      }
      id = req.body.user_id;
    } else if (req.body.type === 'topic') {
      if (req.body.topic_id === undefined) {
        cb(new Error('req.body.topic_id is undefined for uploading topic images'))
      }
      id = req.body.topic_id;
    } else {
      cb(new Error('Wrong image type or undefined - req.body.type from client.'));
    }
    cb(null, id + '.' + ext)
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
