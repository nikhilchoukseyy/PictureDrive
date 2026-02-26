# PictureDrive Telegram Cloud Storage Bot

A backend Telegram bot that simulates a mini Google Drive experience inside Telegram using:

- Node.js + Express
- MongoDB + Mongoose
- node-telegram-bot-api
- bcryptjs

## Features

- `/register username password` → create account with hashed password
- `/login username password` → login and show dashboard
- `/createfolder FolderName` → create a virtual folder (stored in MongoDB)
- `/myfolders` → list user folders
- `/open FolderName` → set active folder and display its saved images
- `/logout` → clear session state
- Upload image in chat after opening folder → bot forwards to private Telegram channel and stores metadata in MongoDB

## Project Structure

```text
src/
 ├── bot.js
 ├── database.js
 ├── index.js
 ├── models/
 │    ├── User.js
 │    ├── Folder.js
 │    └── File.js
 ├── controllers/
 │    └── botController.js
 ├── services/
 │    ├── authService.js
 │    ├── folderService.js
 │    └── fileService.js
 └── utils/
      ├── commandParser.js
      └── messages.js
```

## What you must add from your side

Before this bot can run, you need to provide:

1. **MongoDB database**
   - Local MongoDB or MongoDB Atlas connection string.
   - Put it in `MONGO_URI`.

2. **Telegram bot token**
   - Create bot with `@BotFather`.
   - Put token in `TELEGRAM_BOT_TOKEN`.

3. **Private Telegram channel for storage**
   - Create a private channel.
   - Add your bot as **admin** (must be able to post messages/media).
   - Put the channel id in `TELEGRAM_STORAGE_CHANNEL_ID` (usually starts with `-100...`).

4. **Environment file**
   - Copy `.env.example` to `.env` and fill values.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create environment file:

   ```bash
   cp .env.example .env
   ```

3. Fill `.env`:

   - `MONGO_URI`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_STORAGE_CHANNEL_ID`

4. Run:

   ```bash
   npm start
   ```

5. Optional quick backend check:

   ```bash
   curl http://localhost:3000/health
   ```

## How to test the bot end-to-end

### 1) Basic auth flow

In Telegram chat with your bot:

1. `/start`
2. `/register testuser testpass123`
3. `/login testuser testpass123`

Expected:
- Login success message.
- Dashboard with folders list or `No folders yet. Use /createfolder FolderName`.

### 2) Folder flow

1. `/createfolder invoices`
2. `/myfolders`
3. `/open invoices`

Expected:
- Folder appears in `/myfolders`.
- `/open invoices` sets current folder and shows existing files (or empty folder message).

### 3) Upload + private channel storage validation

1. Ensure `invoices` is currently open.
2. Send an image to bot chat.

Expected in bot chat:
- `✅ Image uploaded to your cloud folder successfully.`

Expected in your private storage channel:
- The same image appears as a new message posted by the bot.

Expected in MongoDB `files` collection:
- A new document with:
  - `userId`
  - `folderId`
  - `telegramFileId`
  - `channelMessageId`
  - `uploadedAt`

### 4) Retrieval validation

1. Send `/open invoices` again.

Expected:
- Bot sends back previously uploaded images using stored `telegramFileId`.
- This confirms retrieval works from stored metadata.

### 5) Session validation

1. `/logout`
2. Try `/myfolders` (should require login)
3. `/login testuser testpass123`
4. `/myfolders`

Expected:
- Folders and previous files are still there after re-login.

## Common issues checklist

- **Bot cannot upload to channel**
  - Bot is not channel admin, or wrong `TELEGRAM_STORAGE_CHANNEL_ID`.

- **Folder operations fail with not logged in**
  - You did not run `/login` in the same Telegram account/chat.

- **MongoDB errors**
  - Wrong `MONGO_URI` or database not reachable.

- **No images returned on `/open FolderName`**
  - You uploaded without opening folder first, or upload failed before DB insert.

## Notes

- Telegram does not have real folders, so folder structure is simulated in MongoDB.
- Files are physically stored in Telegram private channel by forwarding image messages.
- User isolation is enforced by querying folders/files only with the authenticated user id.
