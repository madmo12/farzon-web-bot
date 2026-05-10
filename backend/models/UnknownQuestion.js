const mongoose = require('mongoose');

const unknownQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  count: {
    type: Number,
    default: 1,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('UnknownQuestion', unknownQuestionSchema);
