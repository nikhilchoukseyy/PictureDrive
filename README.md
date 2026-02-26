# 🤖 PictureDrive – Telegram Cloud Storage Bot

🔗 **Try it here:**
👉 [https://t.me/drivepicturesbot](https://t.me/drivepicturesbot)
(or search **@drivepicturesbot** directly in Telegram)

---

## 📌 What is PictureDrive?

PictureDrive is a **Google Drive–like cloud storage system built inside Telegram**.

It allows users to create folders, upload images, and access their files anytime — all within Telegram.

Instead of using traditional cloud storage (like AWS S3 or Google Drive), this bot uses a **private Telegram channel as a storage backend**, making it a creative and cost-effective cloud solution.

---

## 🏗 How It Works

```text
User (Telegram Chat)
        ↓
Telegram Bot (@drivepicturesbot)
        ↓
Node.js Backend (MERN)
        ↓
MongoDB (Users, Folders, Files metadata)
        ↓
Private Telegram Channel (Actual File Storage)
```

* 🗄 MongoDB stores users, folders, and file metadata.
* 📢 Telegram private channel stores actual uploaded images.
* 🔐 Users only see their own folders and files.
* 📂 Folder structure is simulated using database relationships.

---

## ✨ Core Features

### 👤 1. User Authentication

* Register with username & password
* Secure password hashing using bcrypt
* Login session management
* Logout support
* User data isolation

---

### 📁 2. Folder Management

* Create unlimited folders
* View all folders
* Open specific folders
* Folder ownership validation

Just like Google Drive, but inside Telegram.

---

### 🖼 3. Image Upload System

* Upload images directly to bot
* Files stored in private Telegram channel
* Metadata saved in MongoDB
* Retrieve images anytime after login

---

### 🔎 4. Persistent Storage

When a user logs back in:

* Their folders are displayed
* Opening a folder shows all previously uploaded images
* No data loss between sessions

---

### 🔒 5. Security Features

* Password hashing
* Folder ownership validation
* Login verification before uploads
* Users cannot access others’ data

---

## 💡 Why This Project is Interesting

This project demonstrates:

* Telegram Bot API integration
* Creative cloud storage abstraction
* MERN backend architecture
* Session-based authentication
* Database-driven folder simulation
* File metadata mapping
* Real-world backend debugging & state management

It’s not just a bot — it’s a mini cloud system built on top of Telegram.

---

## 🚀 How to Use the Bot

1. Open Telegram
2. Search: **@drivepicturesbot**
   or click: [https://t.me/drivepicturesbot]
3. Press **Start**
4. Register
5. Login
6. Create folder
7. Upload images
8. Access anytime

---

## 📦 Tech Stack

* Node.js
* Express.js
* MongoDB (Mongoose)
* Telegram Bot API
* bcrypt
* dotenv

---