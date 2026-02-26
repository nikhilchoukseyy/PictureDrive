const File = require('../models/File');
const Folder = require('../models/Folder');

async function storeUploadedPhoto({ userId, folderId, telegramFileId, channelMessageId, fileName }) {
  const file = await File.create({
    userId,
    folderId,
    telegramFileId,
    channelMessageId,
    fileName: fileName || 'image',
  });

  return file;
}

async function ensureFolderOwnership(userId, folderId) {
  const folder = await Folder.findOne({ _id: folderId, userId });
  if (!folder) {
    throw new Error('Active folder does not exist or does not belong to you.');
  }
  return folder;
}

module.exports = {
  storeUploadedPhoto,
  ensureFolderOwnership,
};
