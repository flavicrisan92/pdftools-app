# Project Instructions

## Deployment Rules

**CRITICAL: Nu face deploy pe PRODUCTION fără cerere explicită de la user.**

- Staging deploy: OK automat după push pe master
- Production deploy: DOAR când user-ul cere explicit (ex: "fa deploy prod", "deploy pe production")

## Commands

- `/prod-deploy` - Deploy production cu auto-increment versiune (folosește Chrome MCP, nu GitHub CLI)

## Project Structure

- Frontend: React + Vite + TypeScript
- Backend: Firebase Functions (Gen2)
- Hosting: Firebase (staging: pdftools-staging, production: pdftools-prod)
- Payments: Stripe

## Environment

- `.env.staging` - variabile pentru staging
- `.env.production` - variabile pentru production
- `.env.local` - pentru development local (folosește API-ul de staging)
- Vite folosește `--mode staging` sau `--mode production` pentru a încărca fișierul corect

---

# Progress Log

## 2026-03-21 - Stripe Integration & Deployment Fixes

### Completed Today

#### 1. Firebase Functions - Gen1 to Gen2 Migration
- **Problem**: Gen1 functions nu aveau CORS support, returnau 403 Forbidden
- **Solution**: Șters și recreat toate funcțiile ca Gen2
- **Functions migrated**:
  - `createCheckoutSession` - creează Stripe checkout session
  - `createPortalSession` - creează Stripe customer portal session
  - `stripeWebhook` - primește webhook-uri de la Stripe
  - `getPrices` - preia prețurile din Stripe

#### 2. Stripe Secrets - Invalid Character Fix
- **Problem**: `STRIPE_SECRET_KEY` și `STRIPE_WEBHOOK_SECRET` aveau caractere invalide (newline/whitespace)
- **Error**: `ERR_INVALID_CHAR: Invalid character in header content ["Authorization"]`
- **Solution**: Reset secrets folosind `echo -n` pentru a evita newline:
  ```bash
  echo -n "sk_live_..." | firebase functions:secrets:set STRIPE_SECRET_KEY --data-file - --project pdftools-prod
  echo -n "whsec_..." | firebase functions:secrets:set STRIPE_WEBHOOK_SECRET --data-file - --project pdftools-prod
  ```
- **Current versions**: STRIPE_SECRET_KEY@2, STRIPE_WEBHOOK_SECRET@3

#### 3. Version Display in Footer
- **File**: `src/components/layout/Footer.tsx`
- **Feature**: Afișează `VITE_APP_VERSION` în footer pe production
- **Injected at build time** via GitHub Actions workflow

#### 4. Workflow Simplification
- **File**: `.github/workflows/deploy.yml`
- **Changes**:
  - Staging: deploy automat la push pe master
  - Production: deploy manual via workflow_dispatch cu tag required
  - Removed environment dropdown (era confusing)

#### 5. Dynamic Pricing from Stripe
- **File**: `src/pages/Pricing.tsx`
- **Changes**:
  - Removed hardcoded fallback prices
  - Prices come only from Stripe API via `getPrices` function
  - Added proper loading states
  - Shows error message if prices fail to load

#### 6. Production Deploy Skill
- **File**: `.claude/commands/prod-deploy.md`
- **Feature**: Deploy production prin browser (Chrome MCP) pentru transparență
- User vede exact ce se întâmplă în GitHub Actions

### Current Production State
- All 4 Firebase Functions: **Gen2, working**
- Stripe integration: **Working**
- Webhook: **Configured and verified**
- Current tag: **v1.0.4**

### Known Issues
- Test products with $1 price need to be archived and recreated with real prices

---

## TODO - Next Session

### 1. Stripe Products Setup
- [ ] Archive $1 test products
- [ ] Create new products with correct prices:
  - Pro Monthly: $X/month
  - Pro Annual: $X/year (with discount)

### 2. Custom Domain Setup
- [ ] Purchase domain
- [ ] Configure Firebase Hosting custom domain
- [ ] Update Stripe webhook URL to new domain
- [ ] Update checkout success/cancel URLs
- [ ] Configure DNS records
- [ ] SSL certificate (automatic via Firebase)

### 3. Marketing Plan → $5,000/mo Target
- [ ] Create comprehensive marketing strategy:
  - SEO & Content Marketing
  - Social Media Strategy
  - Paid Ads (Google Ads, Facebook)
  - Product Hunt launch
  - Partnerships & Affiliates
  - Email Marketing
  - Pricing optimization

---

## Technical Notes

### Firebase Functions Deployment
```bash
# Deploy to staging
npx firebase deploy --only functions --project pdftools-staging

# Deploy to production
npx firebase deploy --only functions --project pdftools-prod
```

### Secret Management
```bash
# List secrets
npx firebase functions:secrets:get SECRET_NAME --project pdftools-prod

# Set secret (without newline!)
echo -n "value" | firebase functions:secrets:set SECRET_NAME --data-file - --project pdftools-prod
```

### Stripe Webhook Events Handled
- `checkout.session.completed` - User completed subscription
- `customer.subscription.updated` - Subscription status changed
- `customer.subscription.deleted` - Subscription canceled
