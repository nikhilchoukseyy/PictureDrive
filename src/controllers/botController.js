const {
  registerUser,
  loginUser,
  logoutUser,
  getLoggedInUser,
} = require('../services/authService');
const { createFolder, getUserFolders, openFolder } = require('../services/folderService');
const { storeUploadedPhoto, ensureFolderOwnership } = require('../services/fileService');
const { parseCommandText, joinArgs } = require('../utils/commandParser');
const {
  LOGGED_OUT_MENU,
  LOGGED_IN_MENU,
  loggedOutKeyboard,
  loggedInKeyboard,
  startMessage,
  helpMessage,
  dashboardMessage,
  unknownCommandMessage,
} = require('../utils/messages');

const inputState = new Map();

function setState(telegramUserId, state) {
  inputState.set(String(telegramUserId), state);
}

function clearState(telegramUserId) {
  inputState.delete(String(telegramUserId));
}

function getState(telegramUserId) {
  return inputState.get(String(telegramUserId));
}

function isMenuButtonText(text = '') {
  return Object.values(LOGGED_OUT_MENU).includes(text) || Object.values(LOGGED_IN_MENU).includes(text);
}

async function sendWithMenu(bot, chatId, isLoggedIn, message, options = {}) {
  await bot.sendMessage(chatId, message, {
    ...options,
    reply_markup: isLoggedIn ? loggedInKeyboard() : loggedOutKeyboard(),
  });
}

async function askForInput(bot, chatId, message) {
  await bot.sendMessage(chatId, message, {
    reply_markup: {
      force_reply: true,
      selective: true,
    },
  });
}

function registerBotHandlers(bot, storageChannelId) {
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const telegramUserId = msg.from.id;

    try {
      const currentUser = await getLoggedInUser(telegramUserId);
      const isLoggedIn = Boolean(currentUser);
      const pendingState = getState(telegramUserId);

      if (msg.text) {
        const text = msg.text.trim();
        const { command, args } = parseCommandText(text);
        const action = text.startsWith('/') ? command : text;
        const typedSlashCommand = text.startsWith('/');

        if (pendingState && !text.startsWith('/') && !isMenuButtonText(text)) {
          if (pendingState.step === 'await_register_username') {
            if (!text) {
              await askForInput(bot, chatId, 'Please enter a valid username.');
              return;
            }

            setState(telegramUserId, { step: 'await_register_password', username: text });
            await askForInput(bot, chatId, '🔒 Great. Now enter your password.');
            return;
          }

          if (pendingState.step === 'await_register_password') {
            if (!text) {
              await askForInput(bot, chatId, 'Please enter a valid password.');
              return;
            }

            await registerUser(pendingState.username, text, telegramUserId);
            clearState(telegramUserId);
            await sendWithMenu(
              bot,
              chatId,
              false,
              '✅ Registration complete. Tap 🔐 Login to continue.'
            );
            return;
          }

          if (pendingState.step === 'await_login_username') {
            if (!text) {
              await askForInput(bot, chatId, 'Please enter a valid username.');
              return;
            }

            setState(telegramUserId, { step: 'await_login_password', username: text });
            await askForInput(bot, chatId, '🔒 Now enter your password.');
            return;
          }

          if (pendingState.step === 'await_login_password') {
            if (!text) {
              await askForInput(bot, chatId, 'Please enter a valid password.');
              return;
            }

            const user = await loginUser(pendingState.username, text, telegramUserId);
            const folders = await getUserFolders(user._id);
            clearState(telegramUserId);
            await sendWithMenu(bot, chatId, true, dashboardMessage(folders), {
              parse_mode: 'Markdown',
            });
            return;
          }

          if (pendingState.step === 'await_create_folder_name') {
            if (!isLoggedIn) {
              clearState(telegramUserId);
              await sendWithMenu(bot, chatId, false, 'Please login first using 🔐 Login.');
              return;
            }

            const folder = await createFolder(currentUser._id, text);
            clearState(telegramUserId);
            await sendWithMenu(
              bot,
              chatId,
              true,
              `✅ Folder created: ${folder.folderName}\nTap 📤 Open Folder to choose it.`
            );
            return;
          }

          if (pendingState.step === 'await_open_folder_name') {
            if (!isLoggedIn) {
              clearState(telegramUserId);
              await sendWithMenu(bot, chatId, false, 'Please login first using 🔐 Login.');
              return;
            }

            const { folder, files } = await openFolder(currentUser._id, text);
            clearState(telegramUserId);
            await sendWithMenu(
              bot,
              chatId,
              true,
              `📂 Opened folder: ${folder.folderName}\nSend an image now to upload it.`
            );

            if (!files.length) {
              await sendWithMenu(bot, chatId, true, 'This folder is empty. Send an image to upload it.');
              return;
            }

            for (const file of files) {
              // eslint-disable-next-line no-await-in-loop
              await bot.sendPhoto(chatId, file.telegramFileId, {
                caption: `${file.fileName} (${new Date(file.uploadedAt).toLocaleString()})`,
              });
            }
            return;
          }
        }

        switch (action) {
          case '/start':
            clearState(telegramUserId);
            await sendWithMenu(bot, chatId, isLoggedIn, startMessage(isLoggedIn), {
              parse_mode: 'Markdown',
            });
            return;

          case '/help':
          case LOGGED_OUT_MENU.HELP:
          case LOGGED_IN_MENU.HELP:
            await sendWithMenu(bot, chatId, isLoggedIn, helpMessage(isLoggedIn), {
              parse_mode: 'Markdown',
            });
            return;

          case '/register':
          case LOGGED_OUT_MENU.REGISTER: {
            clearState(telegramUserId);
            if (isLoggedIn) {
              await sendWithMenu(bot, chatId, true, 'You are already logged in. Use 🚪 Logout first if needed.');
              return;
            }

            if (args.length >= 2) {
              const username = args[0];
              const password = args.slice(1).join(' ');
              await registerUser(username, password, telegramUserId);
              await sendWithMenu(bot, chatId, false, '✅ Registration complete. Tap 🔐 Login to continue.');
              return;
            }

            setState(telegramUserId, { step: 'await_register_username' });
            await askForInput(bot, chatId, '📝 Registration\nPlease enter your username.');
            return;
          }
        }

        switch (action) {
          case '/start':
            clearState(telegramUserId);
            await sendWithMenu(bot, chatId, isLoggedIn, startMessage(isLoggedIn), {
              parse_mode: 'Markdown',
            });
            return;

          case '/help':
          case LOGGED_OUT_MENU.HELP:
          case LOGGED_IN_MENU.HELP:
            await sendWithMenu(bot, chatId, isLoggedIn, helpMessage(isLoggedIn), {
              parse_mode: 'Markdown',
            });
            return;

          case '/login':
          case LOGGED_OUT_MENU.LOGIN: {
            clearState(telegramUserId);
            if (isLoggedIn) {
              const folders = await getUserFolders(currentUser._id);
              await sendWithMenu(bot, chatId, true, dashboardMessage(folders), {
                parse_mode: 'Markdown',
              });
              return;
            }

            if (args.length >= 2) {
              const username = args[0];
              const password = args.slice(1).join(' ');
              const user = await loginUser(username, password, telegramUserId);
              const folders = await getUserFolders(user._id);
              await sendWithMenu(bot, chatId, true, dashboardMessage(folders), {
                parse_mode: 'Markdown',
              });
              return;
            }

            setState(telegramUserId, { step: 'await_login_username' });
            await askForInput(bot, chatId, '🔐 Login\nPlease enter your username.');
            return;
          }
        }

          case '/createfolder':
          case LOGGED_IN_MENU.CREATE_FOLDER: {
            if (!isLoggedIn) {
              await sendWithMenu(bot, chatId, false, 'Please login first. Tap 🔐 Login.');
              return;
            }

            const folderName = typedSlashCommand ? joinArgs(args) : '';
            if (folderName) {
              const folder = await createFolder(currentUser._id, folderName);
              await sendWithMenu(
                bot,
                chatId,
                true,
                `✅ Folder created: ${folder.folderName}\nTap 📤 Open Folder to choose it.`
              );
              return;
            }

            setState(telegramUserId, { step: 'await_create_folder_name' });
            await askForInput(bot, chatId, '📁 Enter folder name.');
            return;
          }

          case '/myfolders':
          case LOGGED_IN_MENU.MY_FOLDERS: {
            if (!isLoggedIn) {
              await sendWithMenu(bot, chatId, false, 'Please login first. Tap 🔐 Login.');
              return;
            }

            const folders = await getUserFolders(currentUser._id);
            if (!folders.length) {
              await sendWithMenu(bot, chatId, true, 'No folders yet. Tap 📁 Create Folder to add one.');
              return;
            }

            const message = folders.map((folder) => `• ${folder.folderName}`).join('\n');
            await sendWithMenu(
              bot,
              chatId,
              true,
              `📂 Your folders:\n${message}\n\nTap 📤 Open Folder to continue.`
            );
            return;
          }

          case '/open':
          case LOGGED_IN_MENU.OPEN_FOLDER: {
            if (!isLoggedIn) {
              await sendWithMenu(bot, chatId, false, 'Please login first. Tap 🔐 Login.');
              return;
            }

            const folderName = typedSlashCommand ? joinArgs(args) : '';
            if (folderName) {
              const { folder, files } = await openFolder(currentUser._id, folderName);
              await sendWithMenu(
                bot,
                chatId,
                true,
                `📂 Opened folder: ${folder.folderName}\nSend an image now to upload it.`
              );

              if (!files.length) {
                await sendWithMenu(bot, chatId, true, 'This folder is empty. Send an image to upload it.');
                return;
              }

              for (const file of files) {
                // eslint-disable-next-line no-await-in-loop
                await bot.sendPhoto(chatId, file.telegramFileId, {
                  caption: `${file.fileName} (${new Date(file.uploadedAt).toLocaleString()})`,
                });
              }
              return;
            }

            setState(telegramUserId, { step: 'await_open_folder_name' });
            await askForInput(bot, chatId, '📤 Enter folder name to open.');
            return;
          }

          case '/logout':
          case LOGGED_IN_MENU.LOGOUT:
            clearState(telegramUserId);
            await logoutUser(telegramUserId);
            await sendWithMenu(bot, chatId, false, '✅ Logged out successfully.');
            return;

          default:
            if (text.startsWith('/')) {
              await sendWithMenu(bot, chatId, isLoggedIn, unknownCommandMessage(isLoggedIn));
              return;
            }

            if (!isLoggedIn) {
              await sendWithMenu(
                bot,
                chatId,
                false,
                'Please use 📝 Register or 🔐 Login from the menu below.'
              );
            }
            return;
        }
      }

      const hasPhoto = Boolean(msg.photo && msg.photo.length);
      const hasImageDocument = Boolean(
        msg.document
          && typeof msg.document.mime_type === 'string'
          && msg.document.mime_type.startsWith('image/')
      );

      if (hasPhoto || hasImageDocument) {
        if (!isLoggedIn) {
          await sendWithMenu(bot, chatId, false, 'Please login first using 🔐 Login.');
          return;
        }

        if (!currentUser.currentFolder) {
          await sendWithMenu(bot, chatId, true, 'Open a folder first using 📤 Open Folder before uploading images.');
          return;
        }

        await ensureFolderOwnership(currentUser._id, currentUser.currentFolder);

        const uploadedFileId = hasPhoto
          ? msg.photo[msg.photo.length - 1].file_id
          : msg.document.file_id;
        const originalCaption = msg.caption || 'Uploaded Image';

        let channelMessage;
        try {
          channelMessage = await bot.sendPhoto(storageChannelId, uploadedFileId, {
            caption: `User:${currentUser.username} Folder:${String(currentUser.currentFolder)} Name:${originalCaption}`,
          });
        } catch (channelError) {
          if (channelError?.response?.body?.description?.includes('chat not found')) {
            throw new Error(
              'Storage channel not found. Confirm TELEGRAM_STORAGE_CHANNEL_ID and add bot as a channel admin.'
            );
          }
          throw channelError;
        }

        await storeUploadedPhoto({
          userId: currentUser._id,
          folderId: currentUser.currentFolder,
          telegramFileId: uploadedFileId,
          channelMessageId: channelMessage.message_id,
          fileName: originalCaption,
        });

        await sendWithMenu(
          bot,
          chatId,
          true,
          '✅ Image uploaded to your cloud folder successfully. Send another image or tap 📂 My Folders.'
        );
      }
    } catch (error) {
      if (error && error.code === 11000) {
        await bot.sendMessage(chatId, 'This item already exists. Try a different name.');
        return;
      }

      await bot.sendMessage(chatId, `❌ ${error.message || 'Something went wrong'}`);
    }
  });
}

module.exports = { registerBotHandlers };
