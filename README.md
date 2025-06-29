# The Matrix Training Program 🌐

Welcome to The Matrix Training Program - an immersive coding education platform inspired by The Matrix. Step into a cyberpunk world where learning to code becomes an adventure.

🔗 **[Live Demo](https://codescape-pi.vercel.app/)**

## What is The Matrix Training Program?

This application transforms coding education into an engaging experience by:

### 🎯 Interactive Learning Experience
- **Gamified Coding Challenges**: Progress through levels by solving coding puzzles
- **Real-time Feedback**: Get instant feedback on your code solutions
- **Matrix-themed Interface**: Immerse yourself in a cyberpunk aesthetic with Matrix-style animations

### 📈 Progress Tracking
- Track your advancement through an XP-based system
- Unlock new ranks as you improve
- Complete daily missions to earn rewards
- View your progress on an interactive dashboard

### 🎮 Training Features
- **Daily Missions**: New challenges every day to keep you engaged
- **Skill Progression**: Master different coding concepts as you advance
- **Achievement System**: Earn badges and rewards for completing challenges
- **Real-time Updates**: See your progress update instantly

### 💻 Code Editor
- Built-in Monaco code editor (same as VS Code)
- Syntax highlighting
- Real-time error checking
- Multiple language support

### 🔐 User Features
- Secure authentication system
- Personal profile tracking
- Progress persistence
- Real-time mission updates

## Getting Started

1. Visit the [Live Demo](https://codescape-pi.vercel.app/)
2. Create an account or log in
3. Complete your first training mission
4. Track your progress and advance through the ranks

## Want to Run it Locally?

Check out the [Installation Guide](#installation) below for setup instructions.

## 🚀 Features

- **Interactive Training Simulations**: Engage in coding challenges and puzzles designed to test your abilities
- **Real-time Progress Tracking**: Monitor your advancement with XP-based progression system
- **Daily Missions**: Complete daily objectives to earn experience points and unlock new abilities
- **Matrix-inspired UI**: Immersive interface with Matrix-style animations and effects
- **Responsive Design**: Seamless experience across all devices
- **User Authentication**: Secure login system with Supabase integration
- **Real-time Updates**: Live updates for missions and progress using Supabase Realtime

## 🛠️ Tech Stack

- **Frontend Framework**: Next.js 15.3
- **Language**: TypeScript
- **Styling**: TailwindCSS with custom Matrix theme
- **UI Components**: 
  - Radix UI primitives
  - Shadcn/ui components
  - Custom Matrix-themed components
- **Authentication**: Supabase Auth
- **Database**: Supabase
- **Code Editor**: Monaco Editor
- **State Management**: React Context
- **Forms**: React Hook Form with Zod validation
- **Animations**: Framer Motion

## 🏗️ Project Structure

```
codescape/
├── app/                   # Next.js app directory
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # Main dashboard
│   ├── puzzles/         # Coding puzzles
│   └── rooms/           # Training rooms
├── components/           # React components
│   ├── auth/            # Auth-related components
│   ├── simulation/      # Training simulation components
│   └── ui/              # Reusable UI components
├── contexts/            # React contexts
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
└── types/              # TypeScript type definitions
```

## 🔐 Authentication

The application uses Supabase Authentication with the following features:
- Email/Password authentication
- Session management
- Protected routes
- Real-time session syncing

## 🎮 Training Protocol

1. Complete daily missions to earn experience points (coming fully hopefull soon but is there)
2. Master each simulation before progressing
3. Watch for system anomalies
4. Stay alert for messages from Morpheus

## 🌟 User Progress

- XP-based leveling system
- Rank progression
- Skill unlocking
- Achievement tracking (coming soon)
- Daily mission completion


## 🚀 Deployment

The application is configured for deployment on Vercel with the following features:
- Automatic deployments
- Environment variable management
- Edge function support
- Real-time capabilities



## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by The Matrix film series
- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Database and auth by [Supabase](https://supabase.com/) 