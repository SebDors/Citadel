# Citadel - Fitness & Circuit Training Companion 🏋️‍♂️⚡

**Citadel** is a modern, high-performance mobile application built with React Native and Expo. Designed for fitness enthusiasts and athletes, it allows users to create, structure, and track custom workouts using both standard exercises and dynamic circuit blocks (**Rounds** & **AMRAP**).

---

## ✨ Features Overview

### 🏋️ 1. Mixed Block Workout Editor
- **Custom Routine Builder**: Build workouts using individual exercises or modular circuit containers.
- **Circuit Containers**:
  - **Round Mode**: Set a specific number of rounds (e.g., 3 rounds) and custom rest between rounds.
  - **AMRAP Mode** *(As Many Rounds As Possible)*: Set a target duration (e.g., 20 min) with continuous round execution (no rest between rounds).
- **Flexible Target Goals**: Configure exercises within circuits using **Reps** (e.g., `12 reps`) or **Time** (e.g., `45s`).
- **Inline Steppers**: Adjust session rest times instantly with `-15s` / `+15s` controls.
- **Superset Management**: Assign exercises to superset groups (`Superset A`, `B`, `C`).

### ⚡ 2. Live Workout Execution Engine
- **Sequential Execution**: Smoothly transitions through individual exercises and circuit blocks.
- **Circuit Mode Controls**:
  - **Start Circuit Button**: Dedicated button to start the timer and transition from Round 0 to Round 1.
  - **Active Exercise Focus**: Action buttons (`Validate` / `Pass`) remain locked to the active exercise.
  - **Card Collapse & Expand**: Completed exercise cards collapse to ~50% height for clean focus, with tap-to-expand to undo/uncheck errors.
  - **Automatic Round Rest Timers**: Automatic rest timer triggered upon completing each round (for Round circuits).
  - **Live AMRAP Countdown**: Real-time countdown timer with completed rounds counter.
- **Rest Timer Bar**: Floating rest timer bar between sets with `+30s` adjustment and skip capabilities.
- **Rest Timer Notifications**: Local notifications sent to the system tray when the app is in the background, with audio alert on expiration.
- **In-Workout Exercise Insertion**: Add any exercise from the database directly into an active circuit or session on the fly.

### 📚 3. Built-In 52-Exercise Database
- Comprehensive exercise database with target muscle groups, category tags, and default rest times.
- Real-time search bar filtering by name, primary muscle, or category.

### 📊 4. History, Analytics & Calendar View
- **Interactive Calendar**: Attendance calendar highlighting today's date with active indicators and session summaries.
- **Customized Session Metrics**:
  - **AMRAP Circuits**: Displays total time, volume (kg), and completed rounds count.
  - **Round Circuits**: Displays total time, volume (kg), and total rounds.
  - **Standard Sessions**: Displays total time, volume (kg), and completed sets count.
- **Detailed History Summaries**: Muscle targeting Breakdown, inline exercise lists, and session deletion.
- **Workout Analytics**: Individual workout template recaps, progression metrics, and volume history — with full circuit block rendering.

### 📐 5. Body Measurements & Profile Tracking
- Track body weight (kg), body fat percentage (%), chest, waist, thigh, and biceps measurements over time.
- Interactive progress charts visualizing measurement evolution.

---

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo SDK 54](https://expo.dev/)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation)
- **Icons**: [Lucide React Native](https://lucide.dev/)
- **Theme & UI**: Custom Theme System (Dark / Light mode support with dynamic HSL color tokens)
- **Local Storage**: `@react-native-async-storage/async-storage`
- **Notifications**: `expo-notifications` (local background timer alerts)
- **Audio**: `expo-audio` (rest timer sound alerts)

---

## 🚀 Quick Start Guide

Follow these steps to run the application on your computer and test it on your mobile phone using **Expo Go**.

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v18.x or later recommended): [Download Node.js](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Expo Go app** installed on your mobile phone:
  - 🤖 [Android (Google Play Store)](https://play.google.com/store/apps/details?id=host.exp.exponent)
  - 🍏 [iOS (App Store)](https://apps.apple.com/app/expo-go/id982107779)

> ⚠️ **Note**: Timer notifications and audio alerts require a **Development Build** or a production **APK** — they are not available in Expo Go.

---

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone git@github.com:SebDors/Citadel.git
   cd Citadel
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the Expo Development Server**:
   ```bash
   npx expo start
   ```

4. **Run on your Mobile Device**:
   - **Android**: Open the **Expo Go** app on your phone and tap **Scan QR code**, then scan the QR code shown in your terminal.
   - **iOS**: Open the native **Camera app** on your iPhone, scan the QR code shown in your terminal, and tap the prompt to open in **Expo Go**.

> 💡 **Tip**: Make sure your phone and your computer are connected to the **same Wi-Fi network**. If you encounter connection issues, start Expo with the tunnel flag:
> ```bash
> npx expo start --tunnel
> ```

---

## 📱 Project Structure

```text
Citadel/
├── app/                      # Expo Router File-Based Pages
│   ├── (tabs)/               # Tab Navigation (Home/Workouts, History, Profile)
│   ├── live-workout.tsx      # Active Workout Execution Screen
│   ├── template-editor.tsx   # Block-based Workout Routine Builder
│   └── workout-analytics.tsx # Workout Performance & History Analytics
├── src/
│   ├── components/           # UI Components (ExerciseCard, SetTable, CalendarView, etc.)
│   ├── constants/            # 52-Exercise Database & Configuration
│   ├── context/              # ThemeContext & WorkoutContext (Global State & Storage)
│   ├── services/             # StorageService, NotificationService
│   └── types/                # TypeScript Interfaces & Helpers
└── assets/                   # App Icons & Visual Assets
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

*Train hard. Stay consistent. Build your Citadel. 🏋️‍♂️⚡*
