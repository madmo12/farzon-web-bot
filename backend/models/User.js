const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    default: null
  },
  firstSeen: {
    type: Date,
    default: Date.now
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  visitCount: {
    type: Number,
    default: 1
  },
  lastTopic: {
    type: String,
    default: 'start'
  },
  topicsDiscussed: {
    type: Map,
    of: Number,
    default: {}
  },
  ctaEngagements: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('User', userSchema);
