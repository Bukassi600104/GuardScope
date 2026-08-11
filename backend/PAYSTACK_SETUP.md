# GuardScope Paystack activation

The subscription code is deploy-safe while billing is disabled. Keep these values in place until the Paystack plans and webhook are ready:

```env
GUARDSCOPE_ACCESS_MODE=legacy
PAYMENTS_ENABLED=false
PAYSTACK_SECRET_KEY=
PAYSTACK_PRO_MONTHLY_PLAN_CODE=
PAYSTACK_PRO_ANNUAL_PLAN_CODE=
```

## Activation order

1. Apply `supabase/migrations/20260811160000_subscription_foundation.sql`.
2. Create monthly and annual recurring plans in Paystack, both in NGN.
3. Configure the Paystack webhook URL as `https://guardscope.app/api/paystack/webhook`.
4. Add the live secret key and both plan codes to the production environment.
5. Set `PAYMENTS_ENABLED=true` and verify both checkout intervals with a real low-value test plan before launch pricing is finalized.
6. Set `GUARDSCOPE_ACCESS_MODE=trial` to require accounts and enforce the five lifetime trial scans.
7. After checkout, renewal, failed-payment, cancellation, and management-link checks pass, set `GUARDSCOPE_ACCESS_MODE=paid`.

`legacy` preserves the currently published extension behavior. `trial` and `paid` use the same server-authoritative entitlement record; neither mode trusts a counter stored in the browser extension.
