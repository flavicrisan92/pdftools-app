# Project Instructions

## Deployment Rules

**CRITICAL: Nu face deploy pe PRODUCTION fără cerere explicită de la user.**

- Staging deploy: OK automat după push pe master
- Production deploy: DOAR când user-ul cere explicit (ex: "fa deploy prod", "deploy pe production")

## Commands

- `/prod-deploy` - Deploy production cu auto-increment versiune

## Project Structure

- Frontend: React + Vite + TypeScript
- Backend: Firebase Functions
- Hosting: Firebase (staging: pdftools-staging, production: pdftools-prod)
- Payments: Stripe

## Environment

- `.env.staging` - variabile pentru staging
- `.env.production` - variabile pentru production
- Vite folosește `--mode staging` sau `--mode production` pentru a încărca fișierul corect
