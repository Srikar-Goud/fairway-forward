import Stripe from 'https://esm.sh/stripe@17.5.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const auth = req.headers.get('Authorization')
  if (!auth) return json({ error: 'Unauthorized' }, 401)
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-12-18.acacia', httpClient: Stripe.createFetchHttpClient() })
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { global: { headers: { Authorization: auth } } })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return json({ error: 'Unauthorized' }, 401)
  const { plan, charityId, charityPercent } = await req.json()
  const priceId = plan === 'yearly' ? Deno.env.get('STRIPE_YEARLY_PRICE_ID') : Deno.env.get('STRIPE_MONTHLY_PRICE_ID')
  if (!priceId) return json({ error: 'Stripe price ID is not configured.' }, 500)
  const origin = req.headers.get('origin') || Deno.env.get('PUBLIC_SITE_URL')
  const session = await stripe.checkout.sessions.create({ mode: 'subscription', line_items: [{ price: priceId, quantity: 1 }], customer_email: user.email, success_url: `${origin}/dashboard?payment=success`, cancel_url: `${origin}/subscribe?payment=cancelled`, metadata: { user_id: user.id, charity_id: charityId, charity_percent: String(charityPercent) } })
  return json({ url: session.url })
})
