// NOTE: "default" has to match one of the other keys
// NOTE: Has to match constants file in client
// posts, users, topics - have to match "type" for DataList
const SortListTypes = Object.freeze({
  posts: {
    default: { // Default = new
      text: 'Newest',
      order: 'date_posted',
      direction: 'DESC'
    },
    new: {
      text: 'Newest',
      order: 'date_posted',
      direction: 'DESC'
    },
    popular: {
      text: 'Most Popular',
      order: 'num_likes',
      direction: 'DESC'
    }
  },
  users: {
    default: { // Default = new
      text: 'Recently Joined',
      order: 'date_joined',
      direction: 'DESC'
    },
    new: {
      text: 'Recently Joined',
      order: 'date_joined',
      direction: 'DESC'
    },
    popular: {
      text: 'Most Popular',
      order: 'num_friends',
      direction: 'DESC'
    },
  },
  topics: {
    default: { // Default = popular
      text: 'Most Popular',
      order: 'num_subscribers',
      direction: 'DESC'
    },
    popular: {
      text: 'Most Popular',
      order: 'num_subscribers',
      direction: 'DESC'
    },
    new: {
      text: 'Recently Created',
      order: 'date_created',
      direction: 'DESC'
    }
  }
});

module.exports = {
  NO_TOPIC_MSG: 'This topic has been deleted.',
  NO_USER_MSG: 'This user account has been deleted.',
  NO_POST_MSG: 'This post has been deleted.',
  NO_COMMENT_MSG: 'This comment has been deleted.',
  REQUEST_CANCELLED_MSG: 'This request has already been cancelled.',

  THIRTY_MIN: 1800,

  SortListTypes
};
