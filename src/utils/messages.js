const LOGGED_OUT_MENU = {
  REGISTER: '📝 Register',
  LOGIN: '🔐 Login',
  HELP: '❓ Help',
};

const LOGGED_IN_MENU = {
  CREATE_FOLDER: '📁 Create Folder',
  MY_FOLDERS: '📂 My Folders',
  OPEN_FOLDER: '📤 Open Folder',
  LOGOUT: '🚪 Logout',
  HELP: '❓ Help',
};

function loggedOutKeyboard() {
  return {
    keyboard: [
      [{ text: LOGGED_OUT_MENU.REGISTER }, { text: LOGGED_OUT_MENU.LOGIN }],
      [{ text: LOGGED_OUT_MENU.HELP }],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
  };
}

function loggedInKeyboard() {
  return {
    keyboard: [
      [{ text: LOGGED_IN_MENU.MY_FOLDERS }, { text: LOGGED_IN_MENU.OPEN_FOLDER }],
      [{ text: LOGGED_IN_MENU.CREATE_FOLDER }, { text: LOGGED_IN_MENU.LOGOUT }],
      [{ text: LOGGED_IN_MENU.HELP }],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
  };
}

function startMessage(isLoggedIn = false) {
  return [
    '👋 Welcome to *PictureDrive*',
    '',
    'Store and organize your images in Telegram like a mini cloud drive.',
    '',
    isLoggedIn ? 'Use the menu buttons below to manage folders and uploads.' : 'Use the buttons below to register or login. No command typing needed.',
    'Need help anytime? Tap ❓ Help or use /help.',
    'Use /start command when stuck'
  ].join('\n');
}

function helpMessage(isLoggedIn = false) {
  const loggedOutGuide = [
    '📘 *How to get started*',
    '',
    '1) Tap *📝 Register* then enter username and password step by step.',
    '2) Tap *🔐 Login* then enter username and password step by step.',
    '',
    'You can still use commands: /register and /login',
  ];

  const loggedInGuide = [
    '📘 *PictureDrive Actions*',
    '',
    '• 📁 Create Folder → make a new folder',
    '• 📂 My Folders → list all your folders',
    '• 📤 Open Folder → choose folder for viewing/uploading',
    '• 🚪 Logout → end your session',
    '',
    'To upload: open a folder first, then send a photo or image file.',
  ];

  return (isLoggedIn ? loggedInGuide : loggedOutGuide).join('\n');
}

function dashboardMessage(folders = []) {
  if (!folders.length) {
    return [
      '✅ *Login successful*',
      '',
      'You have no folders yet.',
      'Tap *📁 Create Folder* to make your first one.',
    ].join('\n');
  }

  const folderList = folders.map((folder) => `• ${folder.folderName}`).join('\n');

  return [
    '✅ *Login successful*',
    '',
    '📂 *Your folders*',
    folderList,
    '',
    'Tap *📤 Open Folder* to choose one and upload images.',
  ].join('\n');
}

function unknownCommandMessage(isLoggedIn = false) {
  return isLoggedIn
    ? '🤔 I did not recognize that action. Please use the menu buttons below or /help.'
    : '🤔 Please use 📝 Register or 🔐 Login buttons to continue, or /help for details.';
}

module.exports = {
  LOGGED_OUT_MENU,
  LOGGED_IN_MENU,
  loggedOutKeyboard,
  loggedInKeyboard,
  startMessage,
  helpMessage,
  dashboardMessage,
  unknownCommandMessage,
};
