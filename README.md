# BOTX IA

BOTX IA is a demo web platform that simulates the discovery of dormant cryptocurrency wallets through a license-based scanning engine. The project includes user authentication, license activation, a live machine simulator, findings history, and withdrawal request management.

## Overview

This application was built as a full-stack demo using **Next.js**, **TypeScript**, **Prisma**, and **PostgreSQL**.  
It provides a product-style experience around a fictional wallet discovery engine called **Killing 2.0**, with a dashboard that displays simulated attempts, generated findings, and license-based scan speed.

## Features

- User registration and login
- JWT authentication with cookie-based session handling
- License system with activation and expiration flow
- Live machine simulator with synthetic word stream and scan counters
- Simulated wallet findings with network, address, crypto balance, and USD value
- Findings history per user
- Withdrawal request creation and tracking
- Prisma ORM with PostgreSQL database
- Responsive frontend built with Next.js App Router

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **Backend:** Next.js API routes
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT + HTTP-only cookies
- **Styling:** CSS
- **Other libraries:** `bcryptjs`, `jose`, `bip39`

## Project Structure

```bash
prisma/
public/
src/
  app/
    api/
    dashboard/
    contact/
    login/
    register/
  components/
  lib/
  middleware.ts
```

## Local development

```bash
git clone https://github.com/Ex1t-S/botx-IA.git
cd botx-IA
```

Create a local `.env` file with a development PostgreSQL connection string in `DATABASE_URL` and a strong, unique value for `JWT_SECRET`. The authentication module requires `JWT_SECRET`; keep real credentials out of version control.

```bash
npm install
npm run db:deploy
npm run dev
```

Apply migrations only to a dedicated demo database. For a production-style local build:

```bash
npm run build
npm start
```

## Demo boundaries

The wallet discovery engine and displayed findings are simulated. This project does not demonstrate access to third-party funds, real wallet recovery, or guaranteed returns. Withdrawal requests are application records and should not be interpreted as proof of on-chain transfers.

The project is best evaluated as a full-stack UI and data-modeling demo: authentication, account state, license lifecycle, persistence, and dashboard interactions.
