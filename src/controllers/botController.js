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
  mainMenuKeyboard,
  startMessage,
  helpMessage,
  dashboardMessage,
  unknownCommandMessage,
} = require('../utils/messages');

function registerBotHandlers(bot, storageChannelId) {
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const telegramUserId = msg.from.id;

    try {
      if (msg.text) {
        const { command, args } = parseCommandText(msg.text);

        switch (command) {
          case '/start':
            await bot.sendMessage(chatId, startMessage(), {
              parse_mode: 'Markdown',
              reply_markup: mainMenuKeyboard,
            });
            return;

          case '/register': {
            if (args.length < 2) {
              await bot.sendMessage(chatId, 'Usage: /register username password');
              return;
            }

            const username = args[0];
            const password = args.slice(1).join(' ');
            await registerUser(username, password, telegramUserId);
            await bot.sendMessage(chatId, '✅ User created successfully. Login using /login username password', {
              reply_markup: mainMenuKeyboard,
            });
            return;
          }

          case '/login': {
            if (args.length < 2) {
              await bot.sendMessage(chatId, 'Usage: /login username password');
              return;
            }

            const username = args[0];
            const password = args.slice(1).join(' ');
            const user = await loginUser(username, password, telegramUserId);
            const folders = await getUserFolders(user._id);
            await bot.sendMessage(chatId, dashboardMessage(folders), {
              parse_mode: 'Markdown',
              reply_markup: mainMenuKeyboard,
            });
            return;
          }

          case '/createfolder': {
            const user = await getLoggedInUser(telegramUserId);
            if (!user) {
              await bot.sendMessage(chatId, 'You must login first using /login username password');
              return;
            }

            const folderName = joinArgs(args);
            if (!folderName) {
              await bot.sendMessage(chatId, 'Usage: /createfolder FolderName');
              return;
            }

            const folder = await createFolder(user._id, folderName);
            await bot.sendMessage(chatId, `✅ Folder created: ${folder.folderName}\nNow open it with /open ${folder.folderName}`, {
              reply_markup: mainMenuKeyboard,
            });
            return;
          }

          case '/myfolders': {
            const user = await getLoggedInUser(telegramUserId);
            if (!user) {
              await bot.sendMessage(chatId, 'You must login first using /login username password');
              return;
            }

            const folders = await getUserFolders(user._id);
            if (!folders.length) {
              await bot.sendMessage(chatId, 'No folders yet. Use /createfolder FolderName');
              return;
            }

            const message = folders.map((folder) => `• ${folder.folderName}`).join('\n');
            await bot.sendMessage(chatId, `📂 Your folders:\n${message}\n\nTip: Use /open FolderName to view and upload images.`, {
              reply_markup: mainMenuKeyboard,
            });
            return;
          }

          case '/open': {
            const user = await getLoggedInUser(telegramUserId);
            if (!user) {
              await bot.sendMessage(chatId, 'You must login first using /login username password');
              return;
            }

            const folderName = joinArgs(args);
            if (!folderName) {
              await bot.sendMessage(chatId, 'Usage: /open FolderName');
              return;
            }

            const { folder, files } = await openFolder(user._id, folderName);
            await bot.sendMessage(chatId, `📂 Opened folder: ${folder.folderName}\nSend an image now to upload it.`, {
              reply_markup: mainMenuKeyboard,
            });

            if (!files.length) {
              await bot.sendMessage(chatId, 'This folder is empty. Send an image to upload it.');
              return;
            }

            for (const file of files) {
              // Send image directly from Telegram cache by file_id.
              // eslint-disable-next-line no-await-in-loop
              await bot.sendPhoto(chatId, file.telegramFileId, {
                caption: `${file.fileName} (${new Date(file.uploadedAt).toLocaleString()})`,
              });
            }
            return;
          }

          case '/logout': {
            await logoutUser(telegramUserId);
            await bot.sendMessage(chatId, '✅ Logged out successfully. Use /login username password to continue.');
            return;
          }

          case '/help':
            await bot.sendMessage(chatId, helpMessage(), {
              parse_mode: 'Markdown',
              reply_markup: mainMenuKeyboard,
            });
            return;

          default:
            if (command.startsWith('/')) {
              await bot.sendMessage(chatId, unknownCommandMessage(), {
                reply_markup: mainMenuKeyboard,
              });
              return;
            }
            break;
        }
      }

      const hasPhoto = Boolean(msg.photo && msg.photo.length);
      const hasImageDocument = Boolean(
        msg.document
          && typeof msg.document.mime_type === 'string'
          && msg.document.mime_type.startsWith('image/')
      );

      if (hasPhoto || hasImageDocument) {
        const user = await getLoggedInUser(telegramUserId);
        if (!user) {
          await bot.sendMessage(chatId, 'You must login first using /login username password');
          return;
        }

        if (!user.currentFolder) {
          await bot.sendMessage(chatId, 'Open a folder first using /open FolderName before uploading images.');
          return;
        }

        await ensureFolderOwnership(user._id, user.currentFolder);

        const uploadedFileId = hasPhoto
          ? msg.photo[msg.photo.length - 1].file_id
          : msg.document.file_id;
        const originalCaption = msg.caption || 'Uploaded Image';

        let channelMessage;
        try {
          channelMessage = await bot.sendPhoto(storageChannelId, uploadedFileId, {
            caption: `User:${user.username} Folder:${String(user.currentFolder)} Name:${originalCaption}`,
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
          userId: user._id,
          folderId: user.currentFolder,
          telegramFileId: uploadedFileId,
          channelMessageId: channelMessage.message_id,
          fileName: originalCaption,
        });

        await bot.sendMessage(chatId, '✅ Image uploaded to your cloud folder successfully. Send another image or use /myfolders.', {
          reply_markup: mainMenuKeyboard,
        });
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
