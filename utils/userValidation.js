function isEmailRgex({ email }) {
  const isEmail =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i.test(
      email
    );
  return isEmail;
}

const userValidation = ({ name, email, username, password }) => {
  return new Promise((resolve, reject) => {
    if (!email || !username || !password)
      reject("All input fields are required!");
    if (!isEmailRgex({ email })) reject("Email is invalid");
    if (username.length < 4 || username.length > 50)
      reject("Username must in between 4-50 character");
    if (password.length < 4 || password.length > 50)
      reject("Password must in between 4-50 character");
    resolve();
  });
};

module.exports = { userValidation, isEmailRgex };
