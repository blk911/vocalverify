# VocalVerify

VocalVerify is a **voice-authenticated AI OS prototype** built with **Next.js 15** and **Firebase Admin SDK**, using **Google Cloud Firestore and Storage** for persistence.  

## 🚀 Features
- ✅ Firebase Admin SDK initialized via service account
- ✅ Firestore read/write self-test working
- ✅ Google Cloud Storage round-trip verified
- 🔜 Voice upload & verification flow
- 🔜 Phone number & user profile flows

## 🛠 Tech Stack
- [Next.js 15](https://nextjs.org/) (App Router)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Google Cloud Storage](https://cloud.google.com/storage)
- [TypeScript](https://www.typescriptlang.org/)

## 📂 Project Structure
amihuman/
├─ src/
│ ├─ app/ # Next.js app routes
│ ├─ lib/ # Firebase Admin + helpers
├─ credentials/ # Service account JSON (ignored in Git)
├─ .env.local # Local environment variables (ignored in Git)
├─ .gitignore
├─ package.json
├─ tsconfig.json