const mainMenuKeyboard = {
  keyboard: [
    [{ text: '/myfolders' }, { text: '/help' }],
    [{ text: '/createfolder' }, { text: '/open' }],
    [{ text: '/logout' }],
  ],
  resize_keyboard: true,
  one_time_keyboard: false,
};

function startMessage() {
  return [
    '👋 Welcome to *PictureDrive*',
    '',
    'Store and organize your images in Telegram like a mini cloud drive.',
    '',
    '*Quick setup*',
    '1) /register username password',
    '2) /login username password',
    '',
    'Need help anytime? Use /help',
  ].join('\n');
}

function helpMessage() {
  return [
    '📘 *PictureDrive Commands*',
    '',
    '*Account*',
    '• /register username password',
    '• /login username password',
    '• /logout',
    '',
    '*Folders*',
    '• /createfolder FolderName',
    '• /myfolders',
    '• /open FolderName',
    '',
    '*Uploads*',
    '• Open a folder with /open FolderName',
    '• Send a photo OR image file to upload',
  ].join('\n');
}

function dashboardMessage(folders = []) {
  if (!folders.length) {
    return [
      '✅ *Login successful*',
      '',
      'You have no folders yet.',
      'Create your first one with: /createfolder MyFolder',
      '',
      'Then open it using: /open MyFolder and send an image.',
    ].join('\n');
  }

  const folderList = folders.map((folder) => `• ${folder.folderName}`).join('\n');

  return [
    '✅ *Login successful*',
    '',
    '📂 *Your folders*',
    folderList,
    '',
    'Use /open FolderName to view or upload images.',
  ].join('\n');
}

function unknownCommandMessage() {
  return '🤔 I did not recognize that command. Use /help to see all available commands.';
}

module.exports = {
  mainMenuKeyboard,
  startMessage,
  helpMessage,
  dashboardMessage,
  unknownCommandMessage,
};
