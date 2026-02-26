const {
  registerUser,
  loginUser,
  logoutUser,
  getLoggedInUser,
} = require('../services/authService');
const { createFolder, getUserFolders, openFolder } = require('../services/folderService');
const { storeUploadedPhoto, ensureFolderOwnership } = require('../services/fileService');
const { parseCommandText, joinArgs } = require('../utils/commandParser');
const { dashboardMessage } = require('../utils/messages');

function registerBotHandlers(bot, storageChannelId) {
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const telegramUserId = msg.from.id;

    try {
      if (msg.text) {
        const { command, args } = parseCommandText(msg.text);

        switch (command) {
          case '/start':
            await bot.sendMessage(
              chatId,
              [
                'Welcome to PictureDrive Bot 📁',
                'Use:',
                '/register username password',
                '/login username password',
              ].join('\n')
            );
            return;

          case '/register': {
            if (args.length < 2) {
              await bot.sendMessage(chatId, 'Usage: /register username password');
              return;
            }

            const username = args[0];
            const password = args.slice(1).join(' ');
            await registerUser(username, password, telegramUserId);
            await bot.sendMessage(chatId, '✅ User created successfully. Now login using /login username password');
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
            await bot.sendMessage(chatId, dashboardMessage(folders));
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
            await bot.sendMessage(chatId, `✅ Folder created: ${folder.folderName}`);
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
            await bot.sendMessage(chatId, `📂 Your folders:\n${message}`);
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
            await bot.sendMessage(chatId, `📂 Opened folder: ${folder.folderName}`);

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
            await bot.sendMessage(chatId, '✅ Logged out successfully.');
            return;
          }

          default:
            break;
        }
      }

      if (msg.photo && msg.photo.length) {
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

        const largestPhoto = msg.photo[msg.photo.length - 1];
        const originalCaption = msg.caption || 'Uploaded Image';

        const channelMessage = await bot.sendPhoto(storageChannelId, largestPhoto.file_id, {
          caption: `User:${user.username} Folder:${String(user.currentFolder)} Name:${originalCaption}`,
        });

        await storeUploadedPhoto({
          userId: user._id,
          folderId: user.currentFolder,
          telegramFileId: largestPhoto.file_id,
          channelMessageId: channelMessage.message_id,
          fileName: originalCaption,
        });

        await bot.sendMessage(chatId, '✅ Image uploaded to your cloud folder successfully.');
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
