# PDF Tools SaaS

O aplicatie PDF Tools (clone Smallpdf/iLovePDF) pentru Web, Android si iOS cu un singur codebase.

**Live URLs:**
- Production: https://pdftools-prod.web.app
- Staging: https://pdftools-staging.web.app
- GitHub: https://github.com/flavicrisan92/pdftools-app

---

## Status Proiect

### Completat

| Task | Status | Detalii |
|------|--------|---------|
| Setup React + Vite + TypeScript | Done | Proiect initializat |
| Tailwind CSS v4 | Done | Cu @tailwindcss/postcss |
| Firebase Setup | Done | 2 proiecte: staging + prod |
| PDF Merge | Done | src/lib/pdf/merge.ts |
| PDF Split | Done | src/lib/pdf/split.ts |
| PDF Compress | Done | src/lib/pdf/compress.ts |
| PDF to Images | Done | src/lib/pdf/convert.ts |
| UI Components | Done | FileDropzone, Button, etc. |
| Pages | Done | Home, MergePdf, SplitPdf, CompressPdf, ConvertPdf |
| Capacitor Android | Done | android/ folder generat |
| Firebase Hosting | Done | Deploy pe ambele environments |
| GitHub Repo | Done | Push initial complet |

| Firebase Auth | Done | Email/Password + Google |
| CI/CD Pipeline | Done | GitHub Actions |
| Usage Tracking | Done | FingerprintJS + Firestore |

### In Progress / TODO

| Task | Prioritate | Detalii |
|------|------------|---------|
| Stripe Integration | HIGH | Payments pentru Pro |
| Premium Feature Gating | MEDIUM | File size limit (10MB free, 100MB pro) |
| Android APK Build | MEDIUM | Capacitor build |
| iOS Build | LOW | Necesita Mac |
| SEO Optimization | LOW | Meta tags, sitemap |
| Google Ads Setup | LOW | Marketing |

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
| Payments | Stripe |
| Hosting | Firebase Hosting |

---

## Structura Proiect

```
app1/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── FileDropzone.tsx
│   │       └── UsageLimitModal.tsx    # Modal upgrade
│   ├── contexts/
│   │   └── AuthContext.tsx            # Firebase Auth context
│   ├── hooks/
│   │   └── useUsage.ts                # Usage tracking hook
│   ├── lib/
│   │   ├── pdf/
│   │   │   ├── merge.ts
│   │   │   ├── split.ts
│   │   │   ├── compress.ts
│   │   │   └── convert.ts
│   │   ├── firebase.ts
│   │   ├── fingerprint.ts             # FingerprintJS wrapper
│   │   └── usage.ts                   # Usage tracking logic
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── MergePdf.tsx
│   │   ├── SplitPdf.tsx
│   │   ├── CompressPdf.tsx
│   │   └── ConvertPdf.tsx
│   ├── types/
│   │   └── user.ts                    # User types & constants
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── android/                 # Capacitor Android
├── test-pdfs/               # PDF-uri pentru testare
├── firestore.rules          # Firestore security rules
├── firebase.json
├── .firebaserc
├── capacitor.config.ts
├── vite.config.ts
└── package.json
```

---

## Firebase Projects

| Environment | Project ID | Web App |
|-------------|------------|---------|
| Staging | pdftools-staging | pdftools-staging-web |
| Production | pdftools-prod | pdftools-prod-web |

### Firebase Config (din .env files)

```env
# Staging
VITE_FIREBASE_API_KEY=AIzaSyCeqWTe8Rt61QEg4hg7rAlbWypORcnKylk
VITE_FIREBASE_PROJECT_ID=pdftools-staging

# Production
VITE_FIREBASE_API_KEY=AIzaSyDjxjGe9uyGt3kNjcuJxbmLLPOm2aK0x8E
VITE_FIREBASE_PROJECT_ID=pdftools-prod
```

---

## CI/CD Pipeline

### Deploy Automat

| Trigger | Environment | Descriere |
|---------|-------------|-----------|
| Push to `master` | Staging | Deploy automat la fiecare push |
| Manual (workflow_dispatch) | Production | Selectează tag-ul pentru deploy |

### GitHub Secrets Necesare

```
FIREBASE_SERVICE_ACCOUNT_STAGING    # Service account JSON pentru staging
FIREBASE_SERVICE_ACCOUNT_PRODUCTION # Service account JSON pentru production
```

### Generare Service Account

1. Firebase Console → Project Settings → Service accounts
2. Click "Generate new private key"
3. Copiază JSON în GitHub Secrets

### Deploy Production

1. Creează tag: `git tag v1.0.0 && git push origin v1.0.0`
2. GitHub → Actions → Deploy → Run workflow
3. Selectează `production` și introdu tag-ul `v1.0.0`

---

## Comenzi Utile

```bash
# Development
npm run dev                    # Start local server (port 5173/5174)

# Build
npm run build                  # Build pentru production

# Deploy Manual (fără CI/CD)
npm run build && firebase deploy --only hosting -P staging      # Deploy staging
npm run build && firebase deploy --only hosting -P production   # Deploy prod

# Capacitor
npx cap sync android           # Sync web -> Android
npx cap open android           # Deschide Android Studio
npx cap run android            # Run pe emulator/device

# Git
git add . && git commit -m "message" && git push

# Tags
git tag v1.0.0                 # Creează tag
git push origin v1.0.0         # Push tag
git tag -l                     # Lista taguri
```

---

## Monetizare

### Pricing Tiers

| Plan | Pret | Features |
|------|------|----------|
| Free | $0 | 3 ops/zi, max 10MB, watermark |
| Pro Monthly | $7.99/luna | Unlimited, 100MB, no watermark |
| Pro Annual | $49.99/an | Same, 48% savings |
| Lifetime | $149 | One-time, limited |

### Revenue Target

- 1,000 users x 5% conversion x $7.99 = **$400/luna**
- 10,000 users x 5% conversion x $7.99 = **$4,000/luna**
- 25,000 users x 5% conversion x $7.99 = **$10,000/luna** (TARGET)

---

## Usage Tracking (Implementat)

### Cum functioneaza

| Tip User | Identificare | Storage | Limita |
|----------|--------------|---------|--------|
| Anonim | FingerprintJS (browser fingerprint) | Firestore `anonymous_usage/{visitorId}` | 3 ops/zi |
| Logat (free) | Firebase Auth UID | Firestore `users/{uid}` | 3 ops/zi |
| Logat (pro) | Firebase Auth UID | Firestore `users/{uid}` | Unlimited |

### Fisiere

```
src/
├── types/user.ts              # Tipuri: UserPlan, UsageStats, FREE_LIMIT
├── lib/
│   ├── fingerprint.ts         # FingerprintJS wrapper - getVisitorId()
│   └── usage.ts               # Check & increment usage (anonymous + authenticated)
├── hooks/useUsage.ts          # React hook: checkUsage(), recordUsage()
└── components/ui/
    └── UsageLimitModal.tsx    # Modal "Daily Limit Reached" cu upgrade CTA
```

### Firestore Collections

```typescript
// Collection: users (pentru useri logati)
interface UserDocument {
  uid: string;
  email: string;
  plan: 'free' | 'pro';
  operationsToday: number;
  lastOperationDate: string; // YYYY-MM-DD
  createdAt: Timestamp;
}

// Collection: anonymous_usage (pentru useri anonimi)
interface AnonymousUsage {
  visitorId: string;           // FingerprintJS hash
  operationsToday: number;
  lastOperationDate: string;
  createdAt: Timestamp;
}
```

### De ce FingerprintJS?

- localStorage se poate sterge usor → bypass limita
- FingerprintJS genereaza un ID unic bazat pe ~70 semnale browser
- Chiar daca userul sterge cookies/localStorage, fingerprint-ul ramane acelasi
- ~99.5% acuratete

---

## Pasii Urmatori (in ordine)

### 1. Stripe Integration (Prioritate: HIGH)

```bash
npm install @stripe/stripe-js
```

**Ce trebuie facut:**
1. Creare cont Stripe + produse (Pro Monthly $7.99, Pro Annual $49.99)
2. `src/lib/stripe.ts` - Stripe config cu publishable key
3. `src/pages/Pricing.tsx` - Pricing page cu checkout buttons
4. Firebase Cloud Function pentru webhook (payment success → update user.plan)
5. Update `firestore.rules` pentru webhook

**Flow upgrade:**
```
User click "Upgrade" → Stripe Checkout → Payment OK → Webhook →
Firebase Function → users/{uid}.plan = 'pro' → Unlimited ops
```

### 2. Premium Feature Gating (Prioritate: MEDIUM)

**Deja implementat:**
- ✅ Limita operatii (3/zi free, unlimited pro)
- ✅ Modal upgrade la limita atinsa
- ✅ FingerprintJS pentru tracking anonim

**De adaugat:**
- [ ] File size limit (10MB free, 100MB pro)
- [ ] Badge "Pro" in header pentru useri premium
- [ ] Account page cu subscription status

### 3. Android Build

```bash
npm run build
npx cap sync android
npx cap open android
# In Android Studio: Build > Generate Signed Bundle/APK
```

---

## Probleme Rezolvate

| Problema | Solutie |
|----------|---------|
| Tailwind v4 PostCSS error | Instalat @tailwindcss/postcss, actualizat postcss.config.js |
| react-dropzone Accept import | Folosit `import type { Accept }` |
| TypeScript Uint8Array error | Folosit `new Blob([new Uint8Array(pdfBytes)])` |
| pdfjs-dist canvas error | Adaugat `canvas: canvas` in render params |
| Missing tslib | `npm install tslib` |
| Cloud Run billing | Folosit Firebase Hosting (gratuit) |

---

## Claude Code Setup

### Chrome MCP (pentru browser automation)

Activat in `~/.claude.json`:
```json
{
  "claudeInChromeDefaultEnabled": true
}
```

Permite:
- Citire console logs din Chrome
- Click pe elemente
- Screenshot-uri
- Navigare automata

---

## Links Utile

- [Firebase Console](https://console.firebase.google.com)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Google Cloud Console](https://console.cloud.google.com)
- [Capacitor Docs](https://capacitorjs.com/docs)
- [pdf-lib Docs](https://pdf-lib.js.org)

---

## Contact

- GitHub: [@flavicrisan92](https://github.com/flavicrisan92)
- Email: flavicrisan92@gmail.com
