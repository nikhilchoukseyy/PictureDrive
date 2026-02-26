const Folder = require('../models/Folder');
const User = require('../models/User');
const File = require('../models/File');

async function createFolder(userId, folderName) {
  const folder = await Folder.create({ userId, folderName });
  return folder;
}

async function getUserFolders(userId) {
  return Folder.find({ userId }).sort({ createdAt: -1 });
}

async function openFolder(userId, folderName) {
  const folder = await Folder.findOne({ userId, folderName });
  if (!folder) {
    throw new Error('Folder not found.');
  }

  await User.findByIdAndUpdate(userId, { currentFolder: folder._id });

  const files = await File.find({ userId, folderId: folder._id }).sort({ uploadedAt: -1 });
  return { folder, files };
}

module.exports = {
  createFolder,
  getUserFolders,
  openFolder,
};
