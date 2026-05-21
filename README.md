<div align="center">

# Mukti Portal

### Digital Trust Infrastructure for Informal Workers

<p>
  <b>Transforming daily informal work into verified digital identity, trust records, and credit-ready proof.</b>
</p>

<img src="assets/images/architecture-overview.png" alt="Mukti Portal Architecture Overview" width="82%" />

</div>

---

## Problem Statement

Millions of informal workers such as plumbers, maids, electricians, cleaners, and daily service providers perform real work every day, but their work history remains undocumented.

Because of this, they face major barriers:

- No verified proof of completed work
- No structured income history
- No digital reputation
- No trusted record for banks, customers, or institutions
- Limited access to formal financial services

Mukti Portal solves this by converting verified daily work into a trusted digital identity.

---

## Solution Overview

Mukti Portal is a trust-building platform where workers generate proof after completing a job, customers validate that proof, and the system converts each verified job into structured trust data.

The platform creates:

- Verified job history
- Worker trust score
- Monthly activity insights
- Customer-backed work validation
- Credit-ready digital work reports

> Mukti Portal is not just a service platform.  
> It is a digital trust infrastructure for informal workers.

---

## Core Workflow

<div align="center">

<img src="assets/images/system-flow.png" alt="Mukti Portal System Flow" width="78%" />

</div>

### 1. Worker Onboarding

Workers register with basic details such as mobile number, skill, and location.  
The system creates a digital worker identity.

### 2. Job Proof Creation

After completing a job, the worker generates a time-bound QR proof request.

### 3. Customer Validation

The customer scans the QR and confirms the completed job with a rating.

### 4. Trust Verification

The system validates role, QR validity, and prevents self-verification or fake entries.

### 5. Trust Score Generation

Verified work records are converted into trust signals based on consistency, ratings, and repeat customers.

### 6. Credit-Ready Output

The system generates a digital work report that can support alternative credit evaluation.

---

## Key Features

<table>
<tr>
<td width="50%">

### Worker Identity
- Skill-based worker profile
- Location mapping
- Verified work history
- Digital reputation building

</td>
<td width="50%">

### QR-Based Verification
- Time-bound QR proof
- Customer-side confirmation
- Self-verification prevention
- Fake entry reduction

</td>
</tr>

<tr>
<td width="50%">

### Trust Score Engine
- Job frequency analysis
- Rating stability
- Repeat customer signals
- Reliability measurement

</td>
<td width="50%">

### Work Report Generation
- Verified job records
- Monthly work trends
- Estimated income insights
- Credit-ready documentation

</td>
</tr>
</table>

---

## System Architecture

Mukti Portal is structured around three core layers:

### Identity Layer

Manages worker and customer profiles, authentication, and role-based access.

### Verification Layer

Handles QR generation, QR scanning, job confirmation, and validation rules.

### Trust Intelligence Layer

Transforms verified work into trust score, work history, and reportable financial identity.

---

## Technology Stack

<table>
<tr>
<td width="33%">

### Frontend
- React
- TypeScript
- Tailwind CSS
- Shadcn UI
- Framer Motion
- Recharts
- Leaflet

</td>
<td width="33%">

### Backend
- Node.js
- Express.js
- TypeScript
- Firebase Admin SDK
- PDFKit
- Zod Validation

</td>
<td width="33%">

### Data & Intelligence
- Firebase Auth
- Firestore
- Firebase Storage
- Python Flask
- TextBlob NLP
- Fraud Risk Scoring

</td>
</tr>
</table>

---

## Security & Validation

Mukti Portal includes multiple trust-protection checks:

- Role-based access control
- Customer-only job confirmation
- Time-limited QR validation
- Worker self-confirmation prevention
- Schema-level input validation
- Suspicious activity risk detection
- Secure Firebase authentication

---

## Why This Project Matters

Informal workers often work continuously but remain invisible to formal financial systems. Mukti Portal bridges this gap by converting everyday labor into verifiable digital records.

This enables:

- Better worker credibility
- Transparent customer validation
- Stronger digital reputation
- Alternative credit assessment
- Financial inclusion for informal workers

---

## Getting Started

### Install Dependencies

```bash
npm install
````

### Configure Environment

Create `.env` files using the provided `.env.example` references.

Required configuration may include:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
FIREBASE_SERVICE_ACCOUNT=
```

### Run Development Server

```bash
npm run dev
```

### Run Full Stack Setup

```bash
npm run dev:all
```

---

## Project Impact

Mukti Portal converts informal work into formal digital proof.

It helps workers move from:

```text
Unverified Work → Verified Job History → Trust Score → Digital Work Report → Financial Visibility
```

---

<div align="center">

## Final Vision

<b>Mukti Portal empowers informal workers by turning daily verified work into a trusted digital identity.</b>

<br/>

<i>Built as a real-world trust infrastructure, not just a student-level service platform.</i>

</div>
