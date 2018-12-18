const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const questionSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  answers: { type: Array, required: false },
});

module.exports = mongoose.model('Question', questionSchema);
