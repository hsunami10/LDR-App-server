// TODO: Change this when in production
const api_key = 'key-b77c6e496054fb400fd2d5f8e78dff6e';
const domain = 'sandboxf23451db9a164f239f3b142877865527.mailgun.org';
const mailgun = require('mailgun-js')({ apiKey: api_key, domain: domain });

// NOTE: Change this in client/src/constants/variables.js if changed
const EmailSubjectEnum = Object.freeze({
  password: 0, // forgotten password
  verification: 1, // email verification - send code
  report_user: 2,
  report_bug: 3,
  new_topic: 4, // requesting new topic
  polls: 5, // sending polls to users
  dev_updates: 6, // sending developer updates to users
  new_ideas: 7, // send new feature ideas to developer team
  feedback: 8 // general feedback from users
});
const devEmail = 'LDR App <hsunami100@gmail.com>'; // TODO: Change app name and email here

// TODO: Change this when in production
const getFullSubject = subjectEnum => {
  switch (subjectEnum) {
    case EmailSubjectEnum.dev_updates:
      return 'LDR App: Developer Updates!';
    case EmailSubjectEnum.feedback:
      return 'LDR App: User Feedback';
    case EmailSubjectEnum.new_ideas:
      return 'LDR App: New Ideas';
    case EmailSubjectEnum.new_topic:
      return 'LDR App: Request New Topic';
    case EmailSubjectEnum.password:
      return 'LDR App: Forgotten Password';
    case EmailSubjectEnum.polls:
      return 'LDR App: Vote on This Poll!';
    case EmailSubjectEnum.report_bug:
      return 'LDR App: Report Bug';
    case EmailSubjectEnum.report_user:
      return 'LDR App: Report User';
    case EmailSubjectEnum.verification:
      return 'LDR App: Verify Email';
    default:
      return 'LDR App: No Subject';
  }
};

// What to show on the screen when an email has been successfully sent
// Both for user-to-dev, and dev-to-users
// TODO: Change this when in production
const getSuccessMessage = subjectEnum => {
  switch (subjectEnum) {
    case EmailSubjectEnum.feedback:
      return 'Feedback successfully sent! Thanks for the feedback.';
    case EmailSubjectEnum.new_ideas:
      return 'New feature idea successfully sent! Thanks for the help.';
    case EmailSubjectEnum.new_topic:
      return 'Request successfully sent! We will get back to you as soon as possible.';
    case EmailSubjectEnum.password:
      return 'Email successfully sent! Please check your email.';
    case EmailSubjectEnum.report_bug:
      return 'Bug report successfully sent!';
    case EmailSubjectEnum.report_user:
      return 'User report successfully sent!'
    case EmailSubjectEnum.verification:
      return 'Email verification successfully sent! Please check your email.'
    default:
      return 'Email successfully sent!';
  }
};

module.exports = {
  mailgun,
  devEmail,
  EmailSubjectEnum,
  getFullSubject,
  getSuccessMessage
};
