# Morlongo Reservations - Firebase Setup Guide

Follow these steps to set up Firebase for your reservation system.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** (or "Add project")
3. Enter a project name (e.g., "morlongo-reservations")
4. Disable Google Analytics (not needed for this project)
5. Click **"Create project"**

## Step 2: Enable Firestore Database

1. In your Firebase project, click **"Build"** in the left sidebar
2. Click **"Firestore Database"**
3. Click **"Create database"**
4. Choose **"Start in production mode"** (we'll add our own rules)
5. Select a location close to you (e.g., "europe-west" for Europe)
6. Click **"Enable"**

## Step 3: Get Your Firebase Config

1. In Firebase Console, click the **gear icon** (Settings) next to "Project Overview"
2. Click **"Project settings"**
3. Scroll down to "Your apps" and click the **web icon** `</>`
4. Register your app with a nickname (e.g., "morlongo-web")
5. Copy the `firebaseConfig` object - it looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "morlongo-reservations.firebaseapp.com",
  projectId: "morlongo-reservations",
  storageBucket: "morlongo-reservations.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

6. Open `app.js` and replace the placeholder config with your values

## Step 4: Set Up Security Rules

1. In Firebase Console, go to **Firestore Database**
2. Click the **"Rules"** tab
3. Replace the existing rules with the content from `firestore.rules` in this project
4. Click **"Publish"**

## Step 5: Set Your Shared Password

1. In Firebase Console, go to **Firestore Database**
2. Click the **"Data"** tab
3. Click **"Start collection"**
4. For Collection ID, enter: `config`
5. For Document ID, enter: `auth`
6. Add a field:
   - Field name: `password`
   - Type: `string`
   - Value: Your chosen password (e.g., "MorlongoFamily2024")
7. Click **"Save"**

**Important:** Choose a password that's easy to remember but not too simple. Share it only with people who should be able to make reservations.

## Step 6: Enable GitHub Pages Domain in Firebase

1. In Firebase Console, go to **Authentication** > **Settings**
2. Under "Authorized domains", click **"Add domain"**
3. Add your GitHub Pages domain: `YOUR_USERNAME.github.io`

OR (simpler method):

1. In Firebase Console, go to **Project settings**
2. Scroll down and ensure your GitHub Pages URL is allowed

## Step 7: Deploy to GitHub Pages

1. Push your code to GitHub
2. In your GitHub repository, go to **Settings** > **Pages**
3. Under "Source", select **"Deploy from a branch"**
4. Select the **main** branch and **/ (root)** folder
5. Click **Save**
6. Wait a few minutes and your site will be live at `https://YOUR_USERNAME.github.io/Morlongo_Reservations/`

## Testing

1. Open your GitHub Pages URL
2. Click **"+ New Reservation"**
3. Enter the password you set in Step 5
4. Fill in a test reservation and save
5. The reservation should appear on the calendar!

## Troubleshooting

### "Error loading reservations"
- Check that your Firebase config in `app.js` is correct
- Make sure Firestore is enabled in your Firebase project

### "Permission denied" when saving
- Verify your security rules are published
- Check that the password document exists at `config/auth`
- Make sure you're entering the password correctly

### Reservations not showing
- Check browser console for errors (F12 > Console)
- Verify Firestore rules allow reads

## Security Notes

- The password is stored in Firestore, not in your code
- Firebase Security Rules verify the password server-side
- Even if someone inspects your website code, they cannot bypass the password
- Reservations are visible to everyone (as intended for a family calendar)
- Only people with the password can create/edit/delete reservations
