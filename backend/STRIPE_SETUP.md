# Stripe Payment Integration Setup

## Overview
The application now requires Stripe payment processing for Pro plan upgrades. Users must pay before they can upgrade to Pro.

## Setup Instructions

### 1. Create a Stripe Account
1. Go to https://stripe.com
2. Sign up for a free account
3. Complete the account setup

### 2. Get Your API Keys
1. Go to https://dashboard.stripe.com/apikeys
2. Copy your **Secret Key** (starts with `sk_`)
3. Copy your **Publishable Key** (starts with `pk_`)

### 3. Create a Product and Price
1. Go to https://dashboard.stripe.com/products
2. Click "Add product"
3. Name: "Pro Plan"
4. Description: "Unlimited access to all features"
5. Pricing model: "Recurring"
6. Price: Set your monthly price (e.g., $9.99/month)
7. Billing period: Monthly
8. Click "Save product"
9. Copy the **Price ID** (starts with `price_`)

### 4. Set Up Webhook
1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Endpoint URL: `http://your-domain.com/api/subscription/webhook/`
   - For local testing: Use https://dashboard.stripe.com/test/webhooks and set up a local tunnel (ngrok)
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy the **Webhook Signing Secret** (starts with `whsec_`)

### 5. Add to .env File
Add these to your `backend/.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
PRO_PLAN_PRICE_ID=price_your_price_id_here
FRONTEND_URL=http://localhost:3000
```

### 6. For Local Development (Webhook Testing)
Since Stripe webhooks need a public URL, use ngrok:

1. Install ngrok: https://ngrok.com/download
2. Start your Django server: `python manage.py runserver`
3. In another terminal, run: `ngrok http 8000`
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
5. Add this to Stripe webhook endpoint: `https://abc123.ngrok.io/api/subscription/webhook/`
6. Update `FRONTEND_URL` in `.env` if needed

## Testing

### Test Mode
Stripe provides test cards for testing:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Use any future expiry date and any CVC

### Test the Flow
1. User clicks "Upgrade to Pro"
2. Redirects to Stripe Checkout
3. User enters test card details
4. After payment, redirects back to Settings
5. User is automatically upgraded to Pro

## Production Checklist
- [ ] Switch to live Stripe keys (starts with `sk_live_` and `pk_live_`)
- [ ] Update webhook endpoint to production URL
- [ ] Set up proper error handling and logging
- [ ] Add email notifications for subscription events
- [ ] Test subscription cancellation flow
- [ ] Set up subscription renewal handling

## Security Notes
- Never commit Stripe keys to version control
- Always use environment variables
- Webhook secret is required to verify webhook authenticity
- Use HTTPS in production

