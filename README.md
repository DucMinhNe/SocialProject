# Social Chat App

A modern real-time chat application built with Next.js, Firebase, and TypeScript.

## 🚀 Features

- **Real-time Chat**: Instant messaging with live updates
- **User Authentication**: Google Auth and email/password login
- **Message Status**: Sent, delivered, and read indicators
- **Push Notifications**: Browser notifications for new messages
- **User Profiles**: Avatar, blue tick verification system
- **Admin Panel**: User management and blue tick verification
- **Responsive Design**: Works on desktop and mobile

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Firebase (Firestore, Auth, Cloud Messaging)
- **State Management**: React Hooks, Context API
- **Notifications**: Firebase Cloud Messaging, Web Push API
- **Deployment**: Vercel

## 📂 Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # Reusable React components
├── features/           # Feature-based modules
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and services
└── types/              # TypeScript type definitions

docs/                   # Project documentation
public/                 # Static assets
scripts/                # Utility scripts
```

## 📚 Documentation

All project documentation is organized in the [`docs/`](./docs/) folder:

- [Chat Features](./docs/README-CHAT.md)
- [Notification System](./docs/NOTIFICATION-USAGE.md)
- [Performance Optimization](./docs/PERFORMANCE-OPTIMIZATION.md)
- [Features Structure](./docs/FEATURES-STRUCTURE.md)
- [Scripts Usage](./docs/SCRIPTS-README.md)

## 🚦 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SocialProject
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   - Copy `.env.local.example` to `.env.local`
   - Add your Firebase configuration

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Navigate to `http://localhost:3000`

## 🔧 Environment Variables

Required environment variables in `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_VAPID_KEY=
```

## 📱 Features Overview

### Chat System
- Real-time messaging with Firestore
- Message status tracking (sent/delivered/read)
- User search and chat initialization
- Emoji and text support

### Notifications
- Browser push notifications
- Sound notifications
- FCM integration for background notifications
- User preference settings

### User Management
- Google OAuth and email/password auth
- User profiles with avatars
- Blue tick verification system
- Admin panel for user management

## 🚀 Deployment

The app is configured for deployment on Vercel:

```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add documentation to the `docs/` folder if needed
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For questions and support, please check the documentation in the [`docs/`](./docs/) folder or open an issue.

_This project is under active maintenance._
