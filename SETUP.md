# PDF Tools - Setup Complet

Documentatie completa pentru proiectul PDF Tools SaaS.

---

## URLs Live

| Environment | URL | Project ID |
|-------------|-----|------------|
| Staging | https://pdftools-staging.web.app | pdftools-staging |
| Production | https://pdftools-prod.web.app | pdftools-prod |
| GitHub | https://github.com/flavicrisan92/pdftools-app | - |

> **Nota:** `pdftools.web.app` nu e disponibil (luat de altcineva).
> Solutie viitoare: custom domain (ex: pdftools.ro, mypdftools.com)

---

## Stack Tehnologic

| Component | Tehnologie |
|-----------|------------|
| Framework | React 18 + Vite 6 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| PDF Processing | pdf-lib + pdfjs-dist |
| Cross-platform | Capacitor 7 |
| Auth | Firebase Auth |
| Database | Firebase Firestore |
| Payments | Stripe (TODO) |
| Hosting | Firebase Hosting |
| CI/CD | GitHub Actions |

---

## Firebase Authentication

### Providers Activati

| Provider | Staging | Production |
|----------|---------|------------|
| Email/Password | ✅ Enabled | ✅ Enabled |
| Google | ✅ Enabled | ✅ Enabled |

### Fisiere Relevante

```
src/contexts/AuthContext.tsx  - Auth state management (useAuth hook)
src/lib/firebase.ts           - Firebase initialization
src/pages/Login.tsx           - Login/Register UI
src/components/layout/Header.tsx - User state + logout
```

### Cum functioneaza

1. User-ul se poate inregistra cu email/parola sau Google
2. AuthContext.tsx pastreaza starea user-ului
3. Header.tsx afiseaza user-ul logat si buton de logout
4. La refresh, user-ul ramane logat (Firebase persistence)

---

## CI/CD Pipeline

### Workflow: `.github/workflows/deploy.yml`

```yaml
# Trigger automat - push pe master
on:
  push:
    branches: [master]

# Trigger manual - pentru production
on:
  workflow_dispatch:
    inputs:
      environment: staging | production
      tag: v1.0.0
```

### Deploy STAGING (Automat)

```bash
# Orice push pe master face deploy automat
git add .
git commit -m "mesaj"
git push
# => Deploy automat pe pdftools-staging.web.app (2-3 min)
```

### Deploy PRODUCTION (Manual)

```bash
# Pas 1: Creaza tag
git tag v1.0.0
git push origin v1.0.0

# Pas 2: GitHub Actions
# 1. github.com/flavicrisan92/pdftools-app/actions
# 2. Click "Deploy" in sidebar
# 3. Click "Run workflow"
# 4. Environment: production
# 5. Tag: v1.0.0
# 6. Click "Run workflow"
# => Deploy pe pdftools-prod.web.app (2-3 min)
```

---

## GitHub Secrets

### Secrets Configurate

| Secret Name | Status |
|-------------|--------|
| `FIREBASE_SERVICE_ACCOUNT_STAGING` | ✅ Configurat |
| `FIREBASE_SERVICE_ACCOUNT_PRODUCTION` | ✅ Configurat |

### Cum se genereaza (daca e nevoie sa refaci)

1. Firebase Console → Project Settings → Service accounts
2. Click "Generate new private key"
3. Download JSON
4. GitHub → Repository → Settings → Secrets → Actions
5. New repository secret → Paste JSON content

---

## Environment Variables

### Staging (`.env.staging`)
```env
VITE_FIREBASE_API_KEY=AIzaSyCeqWTe8Rt61QEg4hg7rAlbWypORcnKylk
VITE_FIREBASE_AUTH_DOMAIN=pdftools-staging.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pdftools-staging
VITE_FIREBASE_STORAGE_BUCKET=pdftools-staging.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=357214991867
VITE_FIREBASE_APP_ID=1:357214991867:web:...
```

### Production (`.env.production`)
```env
VITE_FIREBASE_API_KEY=AIzaSyDjxjGe9uyGt3kNjcuJxbmLLPOm2aK0x8E
VITE_FIREBASE_AUTH_DOMAIN=pdftools-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pdftools-prod
VITE_FIREBASE_STORAGE_BUCKET=pdftools-prod.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

---

## Structura Proiect

```
app1/
├── .github/
│   └── workflows/
│       └── deploy.yml              # CI/CD pipeline
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx          # Header cu auth state
│   │   │   └── Footer.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       └── FileDropzone.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx         # Auth state management
│   ├── lib/
│   │   ├── pdf/
│   │   │   ├── merge.ts            # PDF merge
│   │   │   ├── split.ts            # PDF split
│   │   │   ├── compress.ts         # PDF compress
│   │   │   └── convert.ts          # PDF to images
│   │   └── firebase.ts             # Firebase init
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Login.tsx               # Login/Register
│   │   ├── Pricing.tsx
│   │   ├── MergePdf.tsx
│   │   ├── SplitPdf.tsx
│   │   ├── CompressPdf.tsx
│   │   └── ConvertPdf.tsx
│   ├── App.tsx                     # Routes + AuthProvider
│   ├── main.tsx
│   └── index.css
├── android/                        # Capacitor Android
├── .env.staging
├── .env.production
├── firebase.json
├── .firebaserc
├── capacitor.config.ts
├── SETUP.md                        # Acest fisier
└── package.json
```

---

## Functionalitati PDF Implementate

| Feature | Status | Fisier |
|---------|--------|--------|
| Merge PDF | ✅ Done | src/lib/pdf/merge.ts |
| Split PDF | ✅ Done | src/lib/pdf/split.ts |
| Compress PDF | ✅ Done | src/lib/pdf/compress.ts |
| PDF to Images | ✅ Done | src/lib/pdf/convert.ts |

---

## Comenzi Uzuale

```bash
# Development
npm run dev

# Build
npm run build

# Deploy manual (fara CI/CD)
npm run build && firebase deploy --only hosting -P staging
npm run build && firebase deploy --only hosting -P production

# Git - trigger deploy staging
git add . && git commit -m "mesaj" && git push

# Git - release production
git tag v1.0.0 && git push origin v1.0.0
# apoi manual din GitHub Actions

# Capacitor Android
npx cap sync android
npx cap open android
```

---

## Status Implementare

### Completat ✅

- [x] React + Vite + TypeScript setup
- [x] Tailwind CSS v4
- [x] Firebase Hosting (staging + prod)
- [x] PDF Merge, Split, Compress, Convert
- [x] UI Components (FileDropzone, Button)
- [x] Pages (Home, Login, Pricing, PDF tools)
- [x] Capacitor Android setup
- [x] Firebase Auth (Email/Password + Google)
- [x] CI/CD Pipeline (GitHub Actions)
- [x] GitHub Secrets configurate

### TODO (Prioritate)

| Task | Priority | Descriere |
|------|----------|-----------|
| Usage Tracking | HIGH | Firestore - 3 ops/zi free |
| Stripe Integration | HIGH | Payments pentru Pro |
| Premium Feature Gating | MEDIUM | Limita operatii, file size |
| Android APK Build | MEDIUM | Capacitor build |
| iOS Build | LOW | Necesita Mac |
| Custom Domain | LOW | pdftools.ro sau similar |
| SEO Optimization | LOW | Meta tags, sitemap |

---

## Pricing Plan (De implementat)

| Plan | Pret | Features |
|------|------|----------|
| Free | $0 | 3 ops/zi, max 10MB, watermark |
| Pro Monthly | $7.99/luna | Unlimited, 100MB, no watermark |
| Pro Annual | $49.99/an | Same, 48% savings |
| Lifetime | $149 | One-time |

---

## Troubleshooting

### Build Error: ReactNode type import
```
Error: 'ReactNode' is a type and must be imported using a type-only import
```
**Fix:** Schimba importul in:
```typescript
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
```

### Auth Error: auth/configuration-not-found
**Cauza:** Provider-ul nu e activat in Firebase Console
**Fix:** Firebase Console → Authentication → Sign-in method → Enable provider

### Deploy Error: Missing service account
**Cauza:** Secret-ul GitHub nu e configurat
**Fix:** Adauga FIREBASE_SERVICE_ACCOUNT_STAGING/PRODUCTION in GitHub Secrets

---

## Links Utile

- [Firebase Console](https://console.firebase.google.com)
- [GitHub Repository](https://github.com/flavicrisan92/pdftools-app)
- [GitHub Actions](https://github.com/flavicrisan92/pdftools-app/actions)
- [Staging App](https://pdftools-staging.web.app)
- [Production App](https://pdftools-prod.web.app)

---

*Ultima actualizare: Martie 2026*
