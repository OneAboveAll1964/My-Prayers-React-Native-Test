# My Prayers — Demo App

A demo React Native app showcasing all features of the [`@shkomaghdid/react-native-prayer-times`](https://github.com/OneAboveAll1964/react-native-prayer-times) package.

## Demo

<video src="assets/demo.mp4" width="300" controls></video>

## Features

- **Prayer Times** — view daily prayer times with 7 calculation methods
- **Location Services** — search, geocode, and reverse-geocode cities offline
- **Azkars** — browse Hisnul Muslim categories, chapters, and items
- **99 Names of Allah** — with translations and transliterations
- **Multi-language** — switch between English, Arabic, Kurdish, Farsi, and Russian

## Prerequisites

- Node.js >= 22
- React Native development environment ([setup guide](https://reactnative.dev/docs/environment-setup))

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Link the database asset into native projects
npx react-native-asset

# 3. (iOS only) Install CocoaPods
cd ios && pod install && cd ..
```

## Run

```bash
# Android
npm run android

# iOS
npm run ios
```

## Important Notes

- **Android New Architecture** — `newArchEnabled` is set to `false` in `android/gradle.properties` because op-sqlite doesn't fully support the TurboModule interop layer yet.
- **Package** — `@shkomaghdid/react-native-prayer-times` is installed from [npm](https://www.npmjs.com/package/@shkomaghdid/react-native-prayer-times).
- **Database** — The SQLite database is in `android/app/src/main/assets/custom/muslim_db_v3.0.0.db` (placed by `npx react-native-asset`).

## Project Structure

```
MyPrayersTest/
├── App.tsx                          # Main app — DB init + tab navigation
├── src/
│   ├── components/
│   │   ├── TabBar.tsx               # Bottom tab bar
│   │   ├── Card.tsx                 # Reusable card component
│   │   └── ScreenHeader.tsx         # Screen header with optional back button
│   ├── screens/
│   │   ├── PrayerTimesScreen.tsx    # Prayer times + method picker
│   │   ├── LocationScreen.tsx       # Search / geocode / reverse geocode
│   │   ├── AzkarsScreen.tsx         # Categories → chapters → items
│   │   └── NamesOfAllahScreen.tsx   # 99 Names list
│   └── theme.ts                     # Colors, spacing, fonts
├── metro.config.js                  # Metro configuration
└── package.json
```
