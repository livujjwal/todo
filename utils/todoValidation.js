const todoValidation = ({ todo }) => {
  return new Promise((resolve, reject) => {
    if (!todo) reject("Please create a entry");
    if (typeof todo !== "string") reject("Todo is not a text");
    if (todo.length < 2 || todo.length > 100)
      reject("Todo must be 2-100 character");
    resolve();
  });
};
module.exports = todoValidation;
