# Digital Heroes — Fairway Forward

A polished full-stack assignment implementation based on the supplied Digital Heroes PRD (Level 1). The UI deliberately avoids traditional golf-site clichés and leads with charitable impact.

## Stack
- React + Vite
- Supabase Auth + Postgres + Row Level Security
- Supabase Edge Functions for privileged draw / Stripe operations
- Lucide React + Recharts-ready dashboard architecture
- Vercel-compatible frontend deployment

## PRD coverage
- Public visitor: concept, charity directory, draw mechanics, subscription CTA
- Authenticated member: signup/login, subscription state, Stableford score entry, rolling latest five, charity selection, contribution %, draw participation and winnings dashboard
- Admin: user management, draw simulation, charity management, winner verification surface, reports/analytics
- Draw tiers: 5-match 40% rollover jackpot, 4-match 35%, 3-match 25%; equal tier split for multiple winners
- Charity: 10% minimum, configurable upward, independent directory
- Winner verification: proof -> admin review -> pending/paid state
- Responsive mobile/desktop UI and edge-case validation

## 1. Create a NEW Supabase project
The assignment explicitly requires a new Supabase project. In its SQL editor, run `supabase/schema.sql`.

Then create a new Vercel project/account as required by the assignment and set:

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

## 2. Install and run

```bash
npm install
npm run dev
```

## 3. Create test credentials

Sign up through `/auth`. If email confirmation is enabled in Supabase, confirm the email or disable confirmation for the assessment test project.

Promote the evaluator/admin test account in Supabase SQL:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@example.com';
```

## 4. Assignment/demo subscription mode

The visible subscription flow has an assignment-safe activation path that writes a real subscription row to Supabase without pretending a card payment succeeded. This makes the full product testable before Stripe credentials exist.

For a production-like payment flow, deploy the supplied `supabase/functions/stripe-checkout` function and set:

```text
STRIPE_SECRET_KEY=...
STRIPE_MONTHLY_PRICE_ID=...
STRIPE_YEARLY_PRICE_ID=...
PUBLIC_SITE_URL=https://your-vercel-domain.vercel.app
```

The client can then call the function and redirect to Stripe Checkout. Do not expose the Stripe secret key in Vite environment variables.

## 5. Draw engine

`supabase/functions/admin-draw` supports:
- `simulate` — returns five numbers without publishing
- `publish` — persists the published draw
- `random` draw mode
- algorithmic/weighted mode based on score frequency

The PRD's 40/35/25 pool allocation and rollover rules are represented in the data model and UI. A production implementation should calculate the pool from active subscribers at publish time and persist an auditable payout breakdown.

## 6. Important deployment note

I cannot create the required new Vercel/Supabase/Stripe accounts or deploy into accounts I do not control. The codebase is prepared for those steps, but the account-owner actions and secrets must be performed by you.

## Test checklist

1. Create account -> sign in.
2. Activate monthly membership in assignment/demo mode.
3. Add six scores: database trigger retains only the latest five.
4. Try two scores on the same date: unique constraint + UI validation blocks duplicate.
5. Verify 1–45 score validation.
6. Browse/search charities.
7. Open draw rules.
8. Promote test account to admin and open `/admin`.
9. Run draw simulation.
10. Verify mobile layout.

## Source of truth
The supplied `Digital Heroes PRD (Level 1).pdf` is the source used for this implementation. See pages 3–13 for the product overview, roles, subscription/scoring, draw/prize pool, charity, verification/dashboard, admin, UI/UX, deliverables and evaluation criteria.
