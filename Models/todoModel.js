const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const model = mongoose.model;
const todoSchema = new Schema({
  todo: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
});
const todoModel = model("todo", todoSchema);
module.exports = todoModel;
