# LedgerFlow Hub - Mobile & Desktop Hybrid Compiling Guidelines

This document details the compile, package, and distribution guidelines for turning the LedgerFlow React codebase into:
1. **Desktop Applications** (Windows, macOS, Linux) using the **Electron** shell.
2. **Mobile Applications** (Android, iOS) using the **Capacitor** runtime.

---

## 1. Desktop Shell Compilation (Electron)

Desktop apps in LedgerFlow bundle an embedded Express API server alongside the React frontend webview, writing local database files (`db_storage.json`) to the user's secure application data directory (`userData`).

### Prerequisites
- **Node.js**: v20+ and npm v10+.
- **Build Tools**: On Windows, desktop icon preparation and packaging require MS Build tools or standard terminal configurations.

### Compile Commands

#### A. Prepare Icons
Before packaging, you must compile and format the native multi-resolution icons:
```bash
npm run prepare:icons
```
This prepares `build/icon.ico` (Windows) and `build/icon.icns` (macOS) from source assets.

#### B. Development Run
To boot the desktop shell in development mode with live devTools:
```bash
npm run desktop:dev
```

#### C. Build Installer (Standard Command)
To compile the production Vite asset bundle and package it into portable and installer executables:
```bash
npm run desktop:dist
```
Native packages will be outputted into the `./release/` directory.

#### D. Build Installer (One-Click Windows Script)
For a simple, zero-configuration build on Windows, execute:
```cmd
tools\windows\BUILD_WINDOWS_INSTALLER.bat
```
This generates:
- **Portable Binary**: `LedgerFlow-Hub-Portable-x.y.z-x64.exe` (run-and-go).
- **Setup Installer**: `LedgerFlow-Hub-Setup-x.y.z-x64.exe` (NSIS Installer with desktop/start-menu shortcuts).

---

## 2. Mobile Wrap Compilation (Capacitor)

Capacitor wraps the client-side React code into a native Webview container for Android and iOS. 

> [!CAUTION]
> **Important Solo-Founder Architectural Difference:**
> Unlike Desktop (which runs a background local Express/Node server), mobile devices **cannot run a native Node.js environment** inside the standard Capacitor webview. 
> Therefore, mobile builds must operate in **Offline-First Client Mode** or **Direct Cloud Sync Mode** (bypassing `/api/*` endpoints and communicating directly with Supabase/API Gateway).

### Installation & Initialization

1. **Install Capacitor CLI and Core:**
   ```bash
   npm install @capacitor/core @capacitor/cli
   ```

2. **Initialize Capacitor Config:**
   ```bash
   npx cap init "LedgerFlow Hub" "com.ledgerflow.hub" --web-dir=dist
   ```
   *Note: Set `--web-dir=dist` as Vite bundles static HTML/JS assets there.*

3. **Add Mobile Platforms:**
   - **Android**:
     ```bash
     npm install @capacitor/android
     npx cap add android
     ```
   - **iOS**:
     ```bash
     npm install @capacitor/ios
     npx cap add ios
     ```

### Standard Mobile Build Workflow

Whenever you change code and want to compile a new build for mobile:

```bash
# 1. Compile the React web bundle
npm run build

# 2. Copy the web assets to native Android/iOS project folders
npx cap sync
```

### Native IDE Compilation

To run, compile, and sign mobile apps, use the official native development platforms:

#### Android (Android Studio)
To boot Android Studio with the compiled assets loaded:
```bash
npx cap open android
```
- In Android Studio, select **Run 'app'** to launch on a physical device or emulator.
- Build the final unsigned/signed APK or AAB: Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)** or **Generate Signed Bundle / APK**.

#### iOS (Xcode - macOS required)
To boot Xcode with the compiled assets loaded:
```bash
npx cap open ios
```
- In Xcode, configure your **Signing & Capabilities** with your Apple Developer account.
- Select your target simulator/device and click the **Play** button to build and run.
- Build the final release IPA: Select **Product > Archive**, then distribute via TestFlight or App Store Connect.

---

## 3. Mobile Environment Adaptations

Because there is no background Express API on mobile devices, follow these practices to prevent crashes:

1. **API Fallback Check:**
   Wrap all network requests in a client-side environment check. If the app detects it is running inside native mobile webview, route directly to local `localStorage` or sync directly to Supabase rather than `/api/db`:
   ```typescript
   export const isNativeMobile = () => {
     return window.origin.startsWith('capacitor://') || window.origin.startsWith('http://localhost');
   };
   ```

2. **Local SQLite Storage (Advanced Mobile Offline):**
   If you require true local database storage on mobile that exceeds `localStorage` limits (typically 5MB), install the Capacitor SQLite community plugin:
   ```bash
   npm install @capacitor-community/sqlite
   npx cap sync
   ```
   Integrate it in `src/utils/dbSync.ts` to save records locally on the phone's hardware.
