function dashboardMessage(folders = []) {
  if (!folders.length) {
    return [
      '✅ Login successful.',
      'No folders yet. Use /createfolder FolderName',
      '',
      'Commands:',
      '/createfolder FolderName',
      '/myfolders',
      '/open FolderName',
      '/logout',
    ].join('\n');
  }

  const folderList = folders.map((folder) => `• ${folder.folderName}`).join('\n');

  return [
    '✅ Login successful. Welcome to your dashboard.',
    'Your folders:',
    folderList,
    '',
    'Commands:',
    '/createfolder FolderName',
    '/myfolders',
    '/open FolderName',
    '/logout',
  ].join('\n');
}

module.exports = { dashboardMessage };
