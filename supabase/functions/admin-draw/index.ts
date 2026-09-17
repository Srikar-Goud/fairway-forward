import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const auth = req.headers.get('Authorization')
  if (!auth) return json({ error: 'Unauthorized' }, 401)
  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } })
  const { data: { user } } = await client.auth.getUser()
  if (!user) return json({ error: 'Unauthorized' }, 401)
  const { data: profile } = await client.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return json({ error: 'Admin only' }, 403)

  const { action = 'simulate', drawType = 'random' } = await req.json().catch(() => ({}))
  const numbers = drawType === 'random'
    ? Array.from({ length: 5 }, () => Math.floor(Math.random() * 45) + 1)
    : await weightedNumbers(client)
  const unique = [...new Set(numbers)]
  while (unique.length < 5) unique.push(Math.floor(Math.random() * 45) + 1)
  unique.sort((a,b) => a-b)
  if (action === 'simulate') return json({ numbers: unique, drawType })

  const month = new Date().toISOString().slice(0, 10)
  const { data, error } = await client.from('draws').insert({ draw_month: month, draw_type: drawType, status: 'published', numbers: unique, published_at: new Date().toISOString() }).select().single()
  if (error) return json({ error: error.message }, 400)
  return json({ draw: data })
})

async function weightedNumbers(client: any) {
  const { data } = await client.from('scores').select('score').limit(5000)
  const freq = new Map<number, number>()
  for (const row of data || []) freq.set(row.score, (freq.get(row.score) || 0) + 1)
  const pool = [...freq.entries()].flatMap(([n, count]) => Array(Math.min(count, 10)).fill(n))
  if (pool.length < 5) return Array.from({ length: 5 }, () => Math.floor(Math.random() * 45) + 1)
  return Array.from({ length: 5 }, () => pool[Math.floor(Math.random() * pool.length)])
}
