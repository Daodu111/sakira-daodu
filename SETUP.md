# Setup Guide

## 1. Admin authentication

Protects the Admin panel so only the portfolio owner can add or delete projects.

**Required:**
- `ADMIN_PASSWORD` – A password you choose for admin login.

Add to `.env`:
```env
ADMIN_PASSWORD=your-secure-password
```

---

## 2. Firestore (optional – uses API key)

When configured, projects are stored in Firestore instead of `projects.json`. Uses your Firebase Web config (API key) – **no service account needed**.

**Credentials** – From [Firebase Console](https://console.firebase.google.com) → Project settings → General → Your apps:

| Variable | Example |
|----------|---------|
| `VITE_FIREBASE_API_KEY` | AIzaSy... |
| `VITE_FIREBASE_AUTH_DOMAIN` | your-project.firebaseapp.com |
| `VITE_FIREBASE_PROJECT_ID` | your-project-id |
| `VITE_FIREBASE_STORAGE_BUCKET` | your-project.firebasestorage.app |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | 123456789 |
| `VITE_FIREBASE_APP_ID` | 1:123456789:web:abc123 |
| `VITE_FIREBASE_MEASUREMENT_ID` | G-XXXXXXX |

Add to `.env`. At minimum you need `VITE_FIREBASE_API_KEY` and `VITE_FIREBASE_PROJECT_ID`.

**Firestore rules** – In Firebase Console → Firestore → Rules, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{projectId} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

Then click **Publish**.

**Firebase Storage** – Required for image uploads when using Firestore. If you get CORS errors when uploading, do this:

1. Firebase Console → **Storage** → Click **Get started** if needed.
2. Open the **Rules** tab.
3. Replace with (allows all reads/writes for development):

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

4. Click **Publish**.

**Workaround:** If uploads still fail, paste an **image URL** instead (from [Imgur](https://imgur.com), [Cloudinary](https://cloudinary.com), etc.) into the Image URL field.

---

## 3. Contact form (FormSubmit)

Uses [FormSubmit.co](https://formsubmit.co) – no backend setup.

**One-time setup:**
1. Submit the contact form once from your site.
2. Check `sakira.design01@gmail.com` for a confirmation link.
3. Click the link. Submissions will work after that.
