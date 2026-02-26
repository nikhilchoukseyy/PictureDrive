const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function registerUser(username, password, telegramUserId) {
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    throw new Error('Username already exists. Try a different one.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    password: hashedPassword,
    telegramUserId: String(telegramUserId),
    isLoggedIn: false,
  });

  return user;
}

async function loginUser(username, password, telegramUserId) {
  const user = await User.findOne({ username });
  if (!user) {
    throw new Error('Invalid username or password.');
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new Error('Invalid username or password.');
  }

  // Tie an account to the current Telegram user to isolate access.
  user.telegramUserId = String(telegramUserId);
  user.isLoggedIn = true;
  await user.save();

  return user;
}

async function logoutUser(telegramUserId) {
  const user = await User.findOne({ telegramUserId: String(telegramUserId), isLoggedIn: true });
  if (!user) {
    throw new Error('No active session found.');
  }

  user.isLoggedIn = false;
  user.currentFolder = null;
  await user.save();
  return user;
}

async function getLoggedInUser(telegramUserId) {
  return User.findOne({ telegramUserId: String(telegramUserId), isLoggedIn: true });
}

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getLoggedInUser,
};
