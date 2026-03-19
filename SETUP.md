# PDF Tools - Setup Complet

Documentatie completa pentru proiectul PDF Tools SaaS.

**Secretele nu sunt stocate aici - le găsești în Stripe Dashboard și Firebase Console.**

---

## URLs Live

| Environment | URL | Project ID |
|-------------|-----|------------|
| Staging | https://pdftools-staging.web.app | pdftools-staging |
| Production | https://pdftools-prod.web.app | pdftools-prod |
| GitHub | https://github.com/flavicrisan92/pdftools-app | - |

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
| CI/CD | GitHub Actions |
| Serverless | Firebase Cloud Functions |

---

## Stripe Account

- **Account Name**: SkylineDigi
- **Account Type**: Personal/Individual
- **Dashboard**: https://dashboard.stripe.com

---

## API Keys - Stripe

**Locație:** https://dashboard.stripe.com/apikeys

### Test Mode (Sandbox) - pentru Staging

| Key Type | Unde găsești |
|----------|--------------|
| Publishable Key | Stripe Dashboard → Developers → API keys (Test mode) |
| Secret Key | Stripe Dashboard → Developers → API keys (Test mode) |

### Live Mode - pentru Production

| Key Type | Unde găsești |
|----------|--------------|
| Publishable Key | Stripe Dashboard → Developers → API keys (Live mode) |
| Secret Key | Stripe Dashboard → Developers → API keys (Live mode) |

---

## Stripe Products & Prices

### Test Mode Products (Staging)

| Product | Price | Interval | Price ID |
|---------|-------|----------|----------|
| Pro Monthly | $8.99 | monthly | `price_1TCnHKETRWjLZJZKPged1vee` |
| Pro Annual | $59.99 | yearly | `price_1TCnJBETRWjLZJZKkZ2tzFnD` |

### Live Mode Products (Production)

| Product | Price | Interval | Price ID |
|---------|-------|----------|----------|
| Pro Monthly | $8.99 | monthly | `price_1TCnQnIJ0dVUq9YhDub6G5xy` |
| Pro Annual | $59.99 | yearly | `price_1TCnQkIJ0dVUq9YhhGGIGb84` |

---

## Cloud Functions URLs

| Environment | Function | URL |
|-------------|----------|-----|
| Staging | createCheckoutSession | https://us-central1-pdftools-staging.cloudfunctions.net/createCheckoutSession |
| Staging | stripeWebhook | https://us-central1-pdftools-staging.cloudfunctions.net/stripeWebhook |
| Production | createCheckoutSession | https://us-central1-pdftools-prod.cloudfunctions.net/createCheckoutSession |
| Production | stripeWebhook | https://us-central1-pdftools-prod.cloudfunctions.net/stripeWebhook |

---

## Firebase Secrets (Secret Manager)

**Cum accesezi secretele:**
```bash
firebase functions:secrets:access STRIPE_SECRET_KEY -P staging
firebase functions:secrets:access STRIPE_WEBHOOK_SECRET -P staging
```

### Staging (pdftools-staging)

| Secret | Cum setezi |
|--------|------------|
| STRIPE_SECRET_KEY | `echo "sk_test_..." \| firebase functions:secrets:set STRIPE_SECRET_KEY -P staging` |
| STRIPE_WEBHOOK_SECRET | `echo "whsec_..." \| firebase functions:secrets:set STRIPE_WEBHOOK_SECRET -P staging` |

### Production (pdftools-prod)

| Secret | Cum setezi |
|--------|------------|
| STRIPE_SECRET_KEY | `echo "sk_live_..." \| firebase functions:secrets:set STRIPE_SECRET_KEY -P production` |
| STRIPE_WEBHOOK_SECRET | `echo "whsec_..." \| firebase functions:secrets:set STRIPE_WEBHOOK_SECRET -P production` |

### Comenzi pentru Secrets

```bash
# Verifică secretele existente
firebase functions:secrets:access STRIPE_SECRET_KEY -P staging

# Setează/actualizează secretele
echo "sk_test_..." | firebase functions:secrets:set STRIPE_SECRET_KEY -P staging
echo "whsec_..." | firebase functions:secrets:set STRIPE_WEBHOOK_SECRET -P staging

# List all secrets
firebase functions:secrets:list -P staging
```

---

## Environment Variables

### .env.local (Development Local - foloseste Test Mode)

Copiază din `.env.staging` și ajustează dacă e nevoie.

### .env.staging și .env.production

Aceste fișiere sunt deja în repo. Conțin:
- Firebase config (din Firebase Console → Project Settings)
- Stripe publishable keys (din Stripe Dashboard → API keys)
- Stripe price IDs (din Stripe Dashboard → Products)

---

## Setup Stripe Webhooks (TODO)

### Pentru Staging (Test Mode)

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://us-central1-pdftools-staging.cloudfunctions.net/stripeWebhook`
3. Events to listen:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. După creare, copiază "Signing secret" (începe cu `whsec_`)
5. Actualizează în Firebase:
   ```bash
   echo "whsec_..." | firebase functions:secrets:set STRIPE_WEBHOOK_SECRET -P staging
   firebase deploy --only functions -P staging
   ```

### Pentru Production (Live Mode)

1. Dezactivează Test Mode în Stripe Dashboard
2. Developers → Webhooks → Add endpoint
3. URL: `https://us-central1-pdftools-prod.cloudfunctions.net/stripeWebhook`
4. Events: same as above
5. Copiază "Signing secret"
6. Actualizează în Firebase:
   ```bash
   echo "whsec_..." | firebase functions:secrets:set STRIPE_WEBHOOK_SECRET -P production
   firebase deploy --only functions -P production
   ```

---

## Firebase Authentication

### Providers Activati

| Provider | Staging | Production |
|----------|---------|------------|
| Email/Password | Enabled | Enabled |
| Google | Enabled | Enabled |

### Fisiere Relevante

```
src/contexts/AuthContext.tsx  - Auth state management (useAuth hook)
src/lib/firebase.ts           - Firebase initialization
src/pages/Login.tsx           - Login/Register UI
src/components/layout/Header.tsx - User state + logout
```

---

## Usage Tracking (FingerprintJS)

### Cum functioneaza

| Tip User | Identificare | Storage | Limita |
|----------|--------------|---------|--------|
| Anonim | FingerprintJS (browser fingerprint) | Firestore `anonymous_usage/{visitorId}` | 3 ops/zi |
| Logat (free) | Firebase Auth UID | Firestore `users/{uid}` | 3 ops/zi |
| Logat (pro) | Firebase Auth UID | Firestore `users/{uid}` | Unlimited |

### Fisiere

```
src/types/user.ts              - Tipuri: UserPlan, UsageStats, FREE_LIMIT
src/lib/fingerprint.ts         - FingerprintJS wrapper - getVisitorId()
src/lib/usage.ts               - Check & increment usage
src/hooks/useUsage.ts          - React hook: checkUsage(), recordUsage()
src/components/ui/UsageLimitModal.tsx - Modal upgrade
```

---

## CI/CD Pipeline

**IMPORTANT: Folosește ÎNTOTDEAUNA GitHub Actions pentru deploy, NU deploy manual cu Firebase CLI!**

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
```

---

## GitHub Secrets

| Secret Name | Status |
|-------------|--------|
| `FIREBASE_SERVICE_ACCOUNT_STAGING` | Configurat |
| `FIREBASE_SERVICE_ACCOUNT_PRODUCTION` | Configurat |

---

## Comenzi Uzuale

```bash
# Development
npm run dev

# Build
npm run build

# Deploy manual
npm run build && firebase deploy -P staging
npm run build && firebase deploy -P production

# Deploy doar functions
firebase deploy --only functions -P staging
firebase deploy --only functions -P production

# Deploy doar hosting
firebase deploy --only hosting -P staging

# Capacitor Android
npx cap sync android
npx cap open android
```

---

## Pricing

| Plan | Pret | Interval | Savings |
|------|------|----------|---------|
| Free | $0 | - | - |
| Pro Monthly | $8.99 | /month | - |
| Pro Annual | $59.99 | /year | 44% vs monthly |

---

## Test Cards (Stripe Test Mode)

| Card | Number | Result |
|------|--------|--------|
| Success | 4242 4242 4242 4242 | Payment succeeds |
| Decline | 4000 0000 0000 0002 | Card declined |
| 3D Secure | 4000 0025 0000 3155 | Requires authentication |

Expiry: orice dată în viitor (ex: 12/34)
CVC: orice 3 cifre (ex: 123)

---

## Structura Proiect

```
app1/
├── .github/
│   └── workflows/
│       └── deploy.yml              # CI/CD pipeline
├── functions/                       # Firebase Cloud Functions
│   ├── src/
│   │   └── index.ts                # Stripe checkout + webhook
│   ├── package.json
│   └── tsconfig.json
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── FileDropzone.tsx
│   │       └── UsageLimitModal.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   └── useUsage.ts
│   ├── lib/
│   │   ├── pdf/
│   │   │   ├── merge.ts
│   │   │   ├── split.ts
│   │   │   ├── compress.ts
│   │   │   └── convert.ts
│   │   ├── firebase.ts
│   │   ├── fingerprint.ts
│   │   ├── usage.ts
│   │   └── stripe.ts
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Pricing.tsx
│   │   ├── MergePdf.tsx
│   │   ├── SplitPdf.tsx
│   │   ├── CompressPdf.tsx
│   │   └── ConvertPdf.tsx
│   ├── types/
│   │   └── user.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── android/
├── .env.local
├── .env.staging
├── .env.production
├── firebase.json
├── firestore.rules
├── SETUP.md
└── README.md
```

---

## Status Implementare

### Completat

- [x] React + Vite + TypeScript setup
- [x] Tailwind CSS v4
- [x] Firebase Hosting (staging + prod)
- [x] PDF Merge, Split, Compress, Convert
- [x] UI Components (FileDropzone, Button)
- [x] Firebase Auth (Email/Password + Google)
- [x] CI/CD Pipeline (GitHub Actions)
- [x] Usage Tracking (FingerprintJS + Firestore)
- [x] Stripe Account & Products
- [x] Cloud Functions (checkout + webhook)
- [x] Pricing Page cu Stripe integration

### TODO

- [x] Creează webhooks în Stripe Dashboard (test + live)
- [x] Actualizează STRIPE_WEBHOOK_SECRET în Firebase
- [ ] Testează checkout flow pe staging
- [ ] Account page pentru subscription management
- [ ] Android APK Build
- [ ] iOS Build (necesita Mac)

---

## Timeline / Istoric

- **19 Mar 2026**: Creat Stripe account (SkylineDigi)
- **19 Mar 2026**: Creat products în Test Mode și Live Mode
- **19 Mar 2026**: Setat Firebase secrets pentru ambele environments
- **19 Mar 2026**: Deploy Cloud Functions (createCheckoutSession, stripeWebhook)
- **19 Mar 2026**: Actualizat Pricing.tsx cu Stripe Checkout integration

---

## Contact

- GitHub: [@flavicrisan92](https://github.com/flavicrisan92)
- Email: flavicrisan92@gmail.com

---

*Ultima actualizare: 19 Martie 2026*
