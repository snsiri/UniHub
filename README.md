# 🎓 KNOWva — Student Social & Study Platform

A full-stack MERN application for university students to share posts, study materials, chat, and collaborate — with an AI auto-classification system.

---

## 📁 Project Structure

```
knowva/
├── backend/                    # Express + MongoDB API
│   ├── server.js               # Entry point, Socket.io setup
│   ├── .env.example            # Environment variable template
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   └── cloudinary.js       # Cloudinary + Multer config
│   ├── models/
│   │   ├── User.js             # User schema (followers, saved posts, etc.)
│   │   ├── Post.js             # Post schema (media, polls, comments, replies)
│   │   ├── Chat.js             # DM & group chat schema
│   │   ├── Message.js          # Message schema (shared posts, media)
│   │   ├── Notification.js     # Notification schema
│   │   └── ModuleDataset.js    # AI training dataset (developer-maintained)
│   ├── controllers/
│   │   ├── authController.js   # Register, login, getMe
│   │   ├── userController.js   # Profile, follow, search, saved, notifications
│   │   ├── postController.js   # CRUD, like, save, comment, reply, poll, repost
│   │   ├── chatController.js   # DM access, group create/manage
│   │   ├── messageController.js# Send/get messages (shared posts, media)
│   │   └── aiController.js     # Classify, similarity, module dataset CRUD
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── postRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── messageRoutes.js
│   │   └── aiRoutes.js
│   ├── middleware/
│   │   ├── auth.js             # JWT protect, isAdmin, isDeveloper
│   │   └── errorHandler.js     # Global error handler
│   ├── services/
│   │   └── aiService.js        # AI classification & cosine similarity engine
│   └── utils/
│       ├── generateToken.js    # JWT generation
│       └── socket.js           # Socket.io event handlers
│
└── frontend/                   # React app
    └── src/
        ├── App.js              # Routes + providers
        ├── App.css             # Complete dark theme styling
        ├── index.js
        ├── services/
        │   └── api.js          # All Axios API calls (auth/user/post/chat/ai)
        ├── context/
        │   ├── AuthContext.js  # Auth state (user, token, login, logout)
        │   └── SocketContext.js# Socket.io client + online users
        ├── utils/
        │   └── helpers.js      # parseTextWithMentions, file utils
        ├── components/
        │   ├── common/
        │   │   ├── RichText.jsx        # Renders @mentions, #tags, links in color
        │   │   └── MentionInput.jsx    # Textarea with live @mention autocomplete
        │   ├── layout/
        │   │   ├── Sidebar.jsx         # Left sidebar navigation
        │   │   └── MainLayout.jsx      # Sidebar + content wrapper
        │   ├── post/
        │   │   ├── CreatePost.jsx      # Full post creator (media, polls, AI, links)
        │   │   └── PostCard.jsx        # Post display (like, save, comment, repost, share)
        │   ├── chat/
        │   │   ├── ChatList.jsx        # DM list, search users, create groups
        │   │   └── ChatWindow.jsx      # Real-time chat (shared posts, media, typing)
        │   └── ai/
        │       └── AIDeveloperPanel.jsx# Developer dashboard (modules, stats, test)
        └── pages/
            ├── LoginPage.jsx
            ├── RegisterPage.jsx
            ├── FeedPage.jsx            # Home feed (public + following)
            ├── StudyMaterialsPage.jsx  # Filtered study materials
            ├── MessagesPage.jsx        # Split-pane chat
            ├── ProfilePage.jsx         # User profile + edit
            ├── SavedPage.jsx           # Saved posts
            ├── NotificationsPage.jsx   # Like, comment, follow notifications
            ├── PostDetailPage.jsx      # Single post view
            └── DeveloperPage.jsx       # AI developer panel (role-gated)
```

---

## ⚙️ Setup & Run

### 1. Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Cloudinary account (free tier is fine)

### 2. Backend Setup

```bash
cd knowva/backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
# Server runs on http://localhost:5000
```

**.env values to fill:**
| Variable | Where to get |
|---|---|
| `MONGO_URI` | MongoDB Atlas → Connect → Drivers |
| `JWT_SECRET` | Any long random string |
| `CLOUDINARY_*` | cloudinary.com → Dashboard |
| `COHERE_API_KEY` | (optional) cohere.com for upgraded AI |

### 3. Frontend Setup

```bash
cd knowva/frontend
npm install
npm start
# App runs on http://localhost:3000
```

---

## 🚀 Features Implemented

### Posts
- ✅ Create posts with text, images, videos, audio, PDFs, PPTs, Word docs, Excel sheets
- ✅ Attach links (shown in blue), @mentions (shown in purple), poll creation
- ✅ Public / Private (followers only) visibility
- ✅ Post types: Regular Post, Study Material, Repost
- ✅ Study materials: module code, material type, semester tagging
- ✅ Edit & delete (owner only)
- ✅ Like, save, view count, download count
- ✅ Repost with optional note
- ✅ Share post to DMs
- ✅ Comments + nested replies
- ✅ @mentions in comments notify the mentioned user
- ✅ Poll voting

### Feed
- ✅ Home feed: public posts + private posts from people you follow
- ✅ Study materials feed filtered by semester, module code, material type
- ✅ Semester-tagged materials automatically surface for relevant students

### Chat
- ✅ Direct messages (DM) between users
- ✅ Group chats with names, member management
- ✅ Real-time messaging via Socket.io
- ✅ Share posts to chats — click shared post → redirects to original post
- ✅ Typing indicators
- ✅ Online/offline presence
- ✅ File/media sharing in chat
- ✅ @mentions in messages

### Users
- ✅ Follow / unfollow
- ✅ Profile with bio, semester, year, department
- ✅ Profile picture upload
- ✅ Saved posts page
- ✅ Notifications (like, comment, follow, mention, reply)
- ✅ @mention autocomplete when typing @

### AI System
- ✅ Auto-classify content → suggest module code, material type, tags
- ✅ Cosine similarity detection → warns if similar material exists
- ✅ Developer Panel (role = "developer"):
  - Add/edit/delete module keyword dataset
  - Test classifier with any text
  - View accuracy stats & misclassification count
  - Monitor AI performance every semester

### Navigation (Left Sidebar)
- ✅ Home, Study Materials, Messages, Saved, Notifications, Profile
- ✅ Developer Panel (visible only to developer role)
- ✅ Notification badge count
- ✅ User card with logout

---

## 👨‍💻 Developer Responsibilities

### Every Semester
1. Log in with a `developer` role account
2. Go to `/developer` → Developer Panel
3. Add new module codes with their keywords
4. Check the accuracy stats
5. Update keyword datasets for misclassified modules

### Creating a Developer Account
In MongoDB, manually set a user's `role` field to `"developer"`:
```
db.users.updateOne({ email: "dev@uni.edu" }, { $set: { role: "developer" } })
```

---

## 🔌 API Endpoints Summary

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET  | `/api/auth/me` | Get current user |
| GET  | `/api/users/search?q=` | Search users |
| POST | `/api/users/:id/follow` | Follow/unfollow |
| GET  | `/api/users/saved` | Get saved posts |
| GET  | `/api/posts/feed` | Home feed |
| GET  | `/api/posts/study-materials` | Study materials |
| POST | `/api/posts` | Create post (multipart) |
| PUT  | `/api/posts/:id` | Edit post |
| DELETE| `/api/posts/:id` | Delete post |
| POST | `/api/posts/:id/like` | Toggle like |
| POST | `/api/posts/:id/save` | Toggle save |
| POST | `/api/posts/:id/comments` | Add comment |
| POST | `/api/posts/:id/comments/:cid/replies` | Reply to comment |
| POST | `/api/chats` | Access/create DM |
| POST | `/api/chats/group` | Create group chat |
| POST | `/api/messages` | Send message |
| GET  | `/api/messages/:chatId` | Get messages |
| POST | `/api/ai/classify` | AI classify content |
| POST | `/api/ai/similarity` | Check for duplicates |
| GET  | `/api/ai/modules` | Get module dataset (dev) |
| POST | `/api/ai/modules` | Add module to dataset (dev) |
| GET  | `/api/ai/stats` | AI accuracy stats (dev) |

---

## 🔗 Integration Notes for Group Members

This module handles:
- Authentication (JWT tokens stored in localStorage as `KNOWva_token`)
- All post/feed/study material logic
- Real-time chat (Socket.io on port 5000)
- AI classification system
- User profiles, follows, notifications

**To integrate your module:**
- Import from `../services/api.js` — all API calls are centralized
- Use `useAuth()` hook from `../context/AuthContext` to get the current user
- Use `useSocket()` hook from `../context/SocketContext` for real-time features
- Wrap your pages with `<MainLayout>` to get the left sidebar automatically

