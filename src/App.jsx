import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight, BarChart3, Check, ChevronRight, CircleDollarSign, Clock3, Gift, Heart,
  LayoutDashboard, LogOut, Menu, ShieldCheck, Sparkles, Trophy, UserRound, X, Zap
} from 'lucide-react'
import { supabase } from './supabase'

const charities = [
  { id: 'greenways', name: 'Greenways Community Trust', category: 'Environment', copy: 'Restoring local habitats and community green spaces.', goal: 180000, raised: 126450, accent: 'leaf' },
  { id: 'fairplay', name: 'Fair Play Youth Foundation', category: 'Youth', copy: 'Giving young people access to mentoring, sport and opportunity.', goal: 150000, raised: 98720, accent: 'sun' },
  { id: 'clubhouse', name: 'The Clubhouse Project', category: 'Community', copy: 'Creating welcoming places where isolated adults can connect.', goal: 120000, raised: 82100, accent: 'hands' },
]

const demoWinners = [
  { month: 'September 2026', match: '5-number match', amount: 12640, status: 'Proof pending' },
  { month: 'August 2026', match: '4-number match', amount: 1820, status: 'Paid' },
]

function money(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
}

function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSession(data.session)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => { mounted = false; listener.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user) { setProfile(null); setLoading(false); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
      setProfile(data)
      setLoading(false)
    }
    loadProfile()
  }, [session])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  async function signOut() {
    await supabase.auth.signOut()
    setToast({ type: 'success', message: 'Signed out safely.' })
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /><span>Loading your impact dashboard…</span></div>

  return <>
    <Navbar session={session} profile={profile} onSignOut={signOut} />
    <Routes>
      <Route path="/" element={<Home session={session} />} />
      <Route path="/charities" element={<CharityDirectory />} />
      <Route path="/charities/:id" element={<CharityDirectory />} />
      <Route path="/draw" element={<DrawPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/subscribe" element={<SubscribePage session={session} />} />
      <Route path="/dashboard" element={<Protected session={session}><Dashboard session={session} profile={profile} /></Protected>} />
      <Route path="/admin" element={<Protected session={session} requiredRole="admin" role={profile?.role}><AdminDashboard /></Protected>} />
      <Route path="*" element={<Home session={session} />} />
    </Routes>
    {toast && <div className={`toast ${toast.type}`}><Check size={16} />{toast.message}</div>}
    <Footer />
  </>
}

function Navbar({ session, profile, onSignOut }) {
  const [open, setOpen] = useState(false)
  return <header className="nav-wrap">
    <nav className="nav container">
      <Link to="/" className="brand"><span className="brand-mark">FH</span><span>fairway<span>forward</span></span></Link>
      <div className={`nav-links ${open ? 'open' : ''}`}>
        <NavLink to="/" end onClick={() => setOpen(false)}>Home</NavLink>
        <NavLink to="/charities" onClick={() => setOpen(false)}>Charities</NavLink>
        <NavLink to="/draw" onClick={() => setOpen(false)}>How it works</NavLink>
        {session ? <NavLink to={profile?.role === 'admin' ? '/admin' : '/dashboard'} onClick={() => setOpen(false)}>Dashboard</NavLink> : <NavLink to="/auth" onClick={() => setOpen(false)}>Sign in</NavLink>}
        {session ? <button className="text-btn" onClick={onSignOut}><LogOut size={15}/> Sign out</button> : <Link className="nav-cta" to="/subscribe">Join the club <ArrowRight size={16}/></Link>}
      </div>
      <button className="menu-btn" onClick={() => setOpen(v => !v)} aria-label="Toggle menu">{open ? <X/> : <Menu/>}</button>
    </nav>
  </header>
}

function Home({ session }) {
  return <main>
    <section className="hero container">
      <div className="hero-copy">
        <div className="eyebrow"><span className="pulse"/> PLAY. GIVE. WIN.</div>
        <h1>Your score can<br/><em>change a life.</em></h1>
        <p className="hero-lead">A new kind of golf membership. Track your Stableford scores, enter the monthly draw, and direct part of your subscription to a cause you choose.</p>
        <div className="hero-actions">
          <Link className="btn primary" to={session ? '/dashboard' : '/subscribe'}>{session ? 'Open my dashboard' : 'Start your membership'} <ArrowRight size={18}/></Link>
          <Link className="btn ghost" to="/charities">Explore charities <Heart size={17}/></Link>
        </div>
        <div className="trust-row"><span><ShieldCheck size={17}/> Secure payments</span><span><Heart size={17}/> 10%+ to charity</span><span><Zap size={17}/> Monthly draws</span></div>
      </div>
      <div className="hero-art">
        <div className="impact-card floating-card"><div className="card-label">THIS MONTH'S IMPACT</div><strong>₹1.84L</strong><span>directed to causes</span><div className="mini-bars"><i/><i/><i/><i/><i/><i/></div></div>
        <div className="orb orb-one"/><div className="orb orb-two"/>
        <div className="hero-circle"><span className="circle-word">GOOD<br/>GOLF</span><span className="circle-number">01</span></div>
        <div className="draw-card floating-card"><div className="draw-icon"><Gift size={20}/></div><div><span>SEPTEMBER DRAW</span><strong>₹12,640 jackpot</strong></div><span className="live-dot"/></div>
      </div>
    </section>

    <section className="marquee"><div>GOOD GOLF <span>•</span> REAL IMPACT <span>•</span> MONTHLY REWARDS <span>•</span> GOOD GOLF <span>•</span> REAL IMPACT <span>•</span> MONTHLY REWARDS</div></section>

    <section className="section container">
      <div className="section-heading"><div><div className="eyebrow">HOW IT WORKS</div><h2>Three things.<br/><em>One better game.</em></h2></div><p>Everything is built around a simple idea: enjoying your golf while making every membership count for something bigger.</p></div>
      <div className="steps">
        <Step num="01" icon={<UserRound/>} title="Join" copy="Pick a monthly or yearly membership and choose a charity. At least 10% goes directly toward your chosen cause." />
        <Step num="02" icon={<BarChart3/>} title="Play & score" copy="Enter your latest five Stableford scores. Your score history stays tidy, current and ready for each draw." />
        <Step num="03" icon={<Trophy/>} title="Win & give" copy="Your membership enters the monthly draw. Match 3, 4 or 5 numbers and split the relevant prize tier." />
      </div>
    </section>

    <section className="impact-section">
      <div className="container impact-grid">
        <div><div className="eyebrow light">WHY IT MATTERS</div><h2>Golf is the game.<br/><em>Impact is the point.</em></h2><p>Choose where your contribution goes, follow the impact, and keep playing. Charity is not a footnote here — it is part of the product.</p><Link className="underlink" to="/charities">Meet the causes <ChevronRight size={16}/></Link></div>
        <div className="impact-stat"><span>MEMBERSHIP CONTRIBUTION</span><strong>10%+</strong><p>Minimum directed to your chosen charity. You can voluntarily increase your percentage.</p><div className="stat-line"><i/></div><small>Every subscriber chooses their cause at signup.</small></div>
      </div>
    </section>

    <section className="section container charity-preview">
      <div className="section-heading"><div><div className="eyebrow">CAUSES IN FOCUS</div><h2>Pick something<br/><em>worth playing for.</em></h2></div><Link className="underlink" to="/charities">View all charities <ChevronRight size={16}/></Link></div>
      <div className="charity-grid">{charities.map(c => <CharityCard key={c.id} charity={c}/>)}</div>
    </section>

    <section className="final-cta container"><div><Sparkles size={21}/><span>READY WHEN YOU ARE</span></div><h2>Make your next round<br/><em>mean a little more.</em></h2><Link className="btn primary" to="/subscribe">Become a member <ArrowRight size={18}/></Link></section>
  </main>
}

function Step({ num, icon, title, copy }) { return <article className="step-card"><div className="step-top"><span>{num}</span><div className="step-icon">{icon}</div></div><h3>{title}</h3><p>{copy}</p><div className="step-arrow"><ArrowRight size={17}/></div></article> }
function CharityCard({ charity }) { return <article className="charity-card"><div className={`charity-art ${charity.accent}`}><Heart size={27}/><span>{charity.category}</span></div><div className="charity-body"><h3>{charity.name}</h3><p>{charity.copy}</p><div className="progress"><i style={{ width: `${Math.min(100, charity.raised / charity.goal * 100)}%` }}/></div><div className="charity-meta"><span>{money(charity.raised)} raised</span><span>{Math.round(charity.raised / charity.goal * 100)}%</span></div><Link to={`/charities/${charity.id}`} className="card-link">View cause <ArrowRight size={15}/></Link></div></article> }

function CharityDirectory() {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => charities.filter(c => `${c.name} ${c.category}`.toLowerCase().includes(query.toLowerCase())), [query])
  return <main className="page container"><div className="page-hero"><div className="eyebrow">THE DIRECTORY</div><h1>Causes worth<br/><em>showing up for.</em></h1><p>Discover the organisations members can support and see how their contributions are moving.</p></div><div className="toolbar"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search charities or causes…"/><span>{filtered.length} causes</span></div><div className="charity-grid directory-grid">{filtered.map(c => <CharityCard key={c.id} charity={c}/>)}</div></main>
}

function DrawPage() {
  return <main className="page container"><div className="page-hero split"><div><div className="eyebrow">THE MONTHLY DRAW</div><h1>Random by default.<br/><em>Fair by design.</em></h1><p>Every active subscriber participates in a monthly draw. The platform supports random lottery-style draws and an algorithmic mode based on score frequency.</p></div><div className="jackpot-display"><span>CURRENT JACKPOT</span><strong>₹12,640</strong><small>5-number match · rolls over if unclaimed</small></div></div><div className="pool-table"><div className="pool-row head"><span>MATCH</span><span>POOL SHARE</span><span>ROLLOVER</span></div><div className="pool-row"><b>5-number match</b><strong>40%</strong><span className="yes">Yes — jackpot</span></div><div className="pool-row"><b>4-number match</b><strong>35%</strong><span>No</span></div><div className="pool-row"><b>3-number match</b><strong>25%</strong><span>No</span></div></div><div className="draw-notes"><article><Gift/><h3>Monthly cadence</h3><p>Admins control simulation and publishing. Results are not published until the draw is reviewed.</p></article><article><ShieldCheck/><h3>Winner verification</h3><p>Winners upload proof of their golf-platform scores. Admin review moves a payout from pending to paid.</p></article><article><CircleDollarSign/><h3>Equal splits</h3><p>Multiple winners in the same tier share that tier equally.</p></article></div></main>
}

function AuthPage() {
  const [mode, setMode] = useState('login'); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [name, setName] = useState(''); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  const navigate = useNavigate()
  async function submit(e) { e.preventDefault(); setBusy(true); setMessage(''); try { if (mode === 'login') { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error; navigate('/dashboard') } else { const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } }); if (error) throw error; setMessage('Account created. Check your email if confirmation is enabled, then sign in.'); setMode('login') } } catch (err) { setMessage(err.message || 'Something went wrong.') } finally { setBusy(false) } }
  return <main className="auth-page"><div className="auth-card"><div className="eyebrow">FAIRWAY FORWARD</div><h1>{mode === 'login' ? 'Welcome back.' : 'Start your good game.'}</h1><p>{mode === 'login' ? 'Sign in to manage scores, charity and draw participation.' : 'Create your member account in under a minute.'}</p><form onSubmit={submit}>{mode === 'signup' && <input required value={name} onChange={e => setName(e.target.value)} placeholder="Full name"/>}<input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address"/><input required minLength={6} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (6+ characters)"/><button className="btn primary full" disabled={busy}>{busy ? 'Working…' : mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={17}/></button></form>{message && <div className="form-message">{message}</div>}<button className="switch-btn" onClick={() => {setMode(mode === 'login' ? 'signup' : 'login');setMessage('')}}>{mode === 'login' ? 'Need an account? Create one' : 'Already a member? Sign in'}</button></div></main>
}

function SubscribePage({ session }) {
  const [plan, setPlan] = useState('monthly'); const [charity, setCharity] = useState(charities[0].id); const [pct, setPct] = useState(10); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(''); const navigate = useNavigate()
  const prices = { monthly: 499, yearly: 4990 }; const fee = prices[plan]; const donation = Math.round(fee * pct / 100)
  async function activateDemo() { if (!session) return navigate('/auth'); setBusy(true); setNotice(''); const { error } = await supabase.from('subscriptions').upsert({ user_id: session.user.id, plan, status: 'active', amount: fee, charity_id: charity, charity_percent: pct, current_period_end: new Date(Date.now() + (plan === 'monthly' ? 30 : 365) * 86400000).toISOString() }); if (error) setNotice(error.message); else { await supabase.from('profiles').update({ selected_charity_id: charity, charity_percent: pct }).eq('id', session.user.id); setNotice('Demo membership activated. For production, connect the Stripe Checkout Edge Function described in the README.'); setTimeout(() => navigate('/dashboard'), 1200) } setBusy(false) }
  return <main className="subscribe-page container"><div className="subscribe-grid"><div><div className="eyebrow">MEMBERSHIP</div><h1>Subscribe.<br/><em>Give. Play.</em></h1><p>Choose your rhythm and your cause. The charity contribution can be increased above the 10% minimum.</p><div className="plan-toggle"><button className={plan === 'monthly' ? 'active' : ''} onClick={() => setPlan('monthly')}>Monthly <span>₹499</span></button><button className={plan === 'yearly' ? 'active' : ''} onClick={() => setPlan('yearly')}>Yearly <span>₹4,990</span></button></div><label className="field-label">Your charity</label><div className="charity-select">{charities.map(c => <button key={c.id} className={charity === c.id ? 'selected' : ''} onClick={() => setCharity(c.id)}><span>{c.name}</span><Check size={16}/></button>)}</div><label className="field-label">Charity contribution <strong>{pct}%</strong></label><input className="range" type="range" min="10" max="50" step="5" value={pct} onChange={e => setPct(Number(e.target.value))}/><div className="range-labels"><span>10% minimum</span><span>50%</span></div></div><aside className="checkout-card"><div className="checkout-head"><span>YOUR MEMBERSHIP</span><span className="secure"><ShieldCheck size={14}/> secure</span></div><div className="price"><strong>{money(fee)}</strong><span>/{plan === 'monthly' ? 'month' : 'year'}</span></div><div className="summary-line"><span>Charity contribution</span><strong>{money(donation)}</strong></div><div className="summary-line"><span>Draw participation</span><strong>Included</strong></div><div className="summary-line"><span>Score dashboard</span><strong>Included</strong></div><div className="summary-total"><span>Total</span><strong>{money(fee)}</strong></div><button className="btn primary full" onClick={activateDemo} disabled={busy}>{busy ? 'Activating…' : session ? 'Activate membership' : 'Sign in to continue'} <ArrowRight size={18}/></button><p className="fine-print">Assignment/demo mode stores the membership in Supabase. Replace the activation handler with Stripe Checkout using the supplied Edge Function before production.</p>{notice && <div className="form-message">{notice}</div>}</aside></div></main>
}

function Protected({ session, requiredRole, role, children }) { if (!session) return <RedirectAuth/>; if (requiredRole && role !== requiredRole) return <RedirectAuth/>; return children }
function RedirectAuth() { const navigate = useNavigate(); useEffect(() => navigate('/auth'), [navigate]); return null }

function Dashboard({ session, profile }) {
  const [scores, setScores] = useState([]); const [sub, setSub] = useState(null); const [score, setScore] = useState({ score: '', date: new Date().toISOString().slice(0,10) }); const [editingId, setEditingId] = useState(null); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false)
  async function load() { const [{ data: s }, { data: ss }] = await Promise.all([supabase.from('scores').select('*').eq('user_id', session.user.id).order('score_date', { ascending: false }), supabase.from('subscriptions').select('*').eq('user_id', session.user.id).maybeSingle()]); setScores(s || []); setSub(ss) }
  useEffect(() => { load() }, [])
  async function saveScore(e) { e.preventDefault(); setBusy(true); setMessage(''); const value = Number(score.score); if (value < 1 || value > 45) { setMessage('Stableford score must be between 1 and 45.'); setBusy(false); return } const { data: existing } = await supabase.from('scores').select('id').eq('user_id', session.user.id).eq('score_date', score.date).maybeSingle(); if (existing) { setMessage('One score per date is allowed. Edit or delete the existing entry.'); setBusy(false); return } const { error } = await supabase.from('scores').insert({ user_id: session.user.id, score: value, score_date: score.date }); if (error) setMessage(error.message); else { setMessage('Score saved. The rolling five-score rule is enforced by the database.'); setScore({ score: '', date: new Date().toISOString().slice(0,10) }); await load() } setBusy(false) }
  async function deleteScore(id) { await supabase.from('scores').delete().eq('id', id).eq('user_id', session.user.id); if (editingId === id) setEditingId(null); await load() }
  function beginEdit(row) { setEditingId(row.id); setScore({ score: String(row.score), date: row.score_date }) }
  async function updateScore(e) { e.preventDefault(); setBusy(true); setMessage(''); const value = Number(score.score); if (value < 1 || value > 45) { setMessage('Stableford score must be between 1 and 45.'); setBusy(false); return } const { data: duplicate } = await supabase.from('scores').select('id').eq('user_id', session.user.id).eq('score_date', score.date).neq('id', editingId).maybeSingle(); if (duplicate) { setMessage('Another score already exists for that date.'); setBusy(false); return } const { error } = await supabase.from('scores').update({ score: value, score_date: score.date }).eq('id', editingId).eq('user_id', session.user.id); if (error) setMessage(error.message); else { setMessage('Score updated.'); setEditingId(null); setScore({ score: '', date: new Date().toISOString().slice(0,10) }); await load() } setBusy(false) }
  return <main className="dashboard-page container"><div className="dash-top"><div><div className="eyebrow">MEMBER DASHBOARD</div><h1>Good morning, {profile?.full_name?.split(' ')[0] || 'golfer'}.</h1><p>Your membership, scores, cause and draw activity — all in one place.</p></div><div className={`status-pill ${sub?.status === 'active' ? 'active' : ''}`}><span/> {sub?.status === 'active' ? 'Membership active' : 'Membership inactive'}</div></div><div className="dashboard-grid"><section className="dash-card wide"><div className="card-head"><div><span className="card-kicker">SCORECARD</span><h2>Latest five</h2></div><BarChart3/></div><form className="score-form" onSubmit={editingId ? updateScore : saveScore}><input required type="number" min="1" max="45" value={score.score} onChange={e => setScore({...score, score: e.target.value})} placeholder="Stableford 1–45"/><input required type="date" value={score.date} onChange={e => setScore({...score, date: e.target.value})}/><button className="btn primary" disabled={busy}>{editingId ? 'Save changes' : 'Add score'} <ArrowRight size={16}/></button></form>{message && <div className="form-message">{message}</div>}<div className="score-list">{scores.slice(0,5).map(s => <div className="score-row" key={s.id}><div className="score-number">{s.score}</div><div><strong>Stableford score</strong><span>{new Date(s.score_date + 'T00:00:00').toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</span></div><div className="score-actions"><button onClick={() => beginEdit(s)} aria-label="Edit score">Edit</button><button onClick={() => deleteScore(s.id)} aria-label="Delete score"><X size={15}/></button></div></div>)}{scores.length === 0 && <div className="empty">No scores yet. Add your latest round above.</div>}</div></section><section className="dash-card"><div className="card-head"><div><span className="card-kicker">YOUR CAUSE</span><h2>{charities.find(c => c.id === (profile?.selected_charity_id || sub?.charity_id))?.name || 'Not selected'}</h2></div><Heart/></div><div className="cause-percent">{profile?.charity_percent || sub?.charity_percent || 10}% <span>of subscription</span></div><p>Your chosen charity receives your selected contribution. The minimum is 10%.</p><Link to="/charities" className="underlink">Explore causes <ChevronRight size={15}/></Link></section><section className="dash-card"><div className="card-head"><div><span className="card-kicker">NEXT DRAW</span><h2>September 2026</h2></div><Gift/></div><div className="next-jackpot">{money(12640)}</div><p>5-number jackpot · active members included.</p><Link to="/draw" className="underlink">See draw rules <ChevronRight size={15}/></Link></section><section className="dash-card wide"><div className="card-head"><div><span className="card-kicker">WINNINGS</span><h2>Your prize history</h2></div><Trophy/></div><div className="winner-list">{demoWinners.map(w => <div className="winner-row" key={w.month}><div><strong>{w.month}</strong><span>{w.match}</span></div><b>{money(w.amount)}</b><span className={`payment ${w.status === 'Paid' ? 'paid' : ''}`}>{w.status}</span></div>)}</div></section><section className="dash-card"><div className="card-head"><div><span className="card-kicker">WINNER VERIFICATION</span><h2>Proof upload</h2></div><ShieldCheck/></div><p>If you are selected as a winner, upload a screenshot of the score platform here for admin verification.</p><ProofUpload session={session}/></section></div></main>
}

function ProofUpload({ session }) {
  const [file, setFile] = useState(null); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  async function upload() { if (!file) return; setBusy(true); setMessage(''); const ext = file.name.split('.').pop(); const path = `${session.user.id}/${crypto.randomUUID()}.${ext}`; const { error } = await supabase.storage.from('winner-proofs').upload(path, file, { upsert: false }); if (error) setMessage(error.message); else setMessage('Proof uploaded securely for admin review.'); setBusy(false) }
  return <div className="proof-upload"><input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={e => setFile(e.target.files?.[0] || null)}/><button className="btn ghost" disabled={!file || busy} onClick={upload}>{busy ? 'Uploading…' : 'Upload proof'} <ArrowRight size={15}/></button>{message && <div className="form-message">{message}</div>}</div>
}

function AdminDashboard() {
  const [tab, setTab] = useState('overview'); const [users, setUsers] = useState([]); const [charityRows, setCharityRows] = useState(charities); const [simulation, setSimulation] = useState(null); const [message, setMessage] = useState('')
  useEffect(() => { supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100).then(({data}) => setUsers(data || [])) }, [])
  function simulate() { const nums = Array.from({length: 5}, () => Math.floor(Math.random() * 45) + 1); setSimulation(nums.sort((a,b) => a-b)); setMessage('Simulation generated. Publishing should be a separate audited action.') }
  return <main className="admin-page container"><div className="dash-top"><div><div className="eyebrow">ADMIN CONTROL ROOM</div><h1>Full control, clearly surfaced.</h1><p>Manage members, draws, causes, winners and reporting from one operational view.</p></div><div className="admin-badge"><ShieldCheck size={16}/> Administrator</div></div><div className="admin-tabs">{[['overview','Overview'],['users','Users'],['draw','Draw management'],['charity','Charities'],['winners','Winners'],['reports','Reports']].map(([id,label]) => <button key={id} className={tab===id?'active':''} onClick={() => setTab(id)}>{label}</button>)}</div>{tab === 'overview' && <div className="admin-grid"><AdminStat label="Total users" value={users.length || '—'} icon={<UserRound/>}/><AdminStat label="Prize pool" value="₹31,600" icon={<Gift/>}/><AdminStat label="Charity contributions" value="₹1.84L" icon={<Heart/>}/><AdminStat label="Draw status" value="Open" icon={<Clock3/>}/><section className="admin-panel full-panel"><div className="panel-title"><div><span className="card-kicker">QUICK ACTIONS</span><h2>Operational checklist</h2></div><Sparkles/></div><div className="checklist"><span><Check/> Membership lifecycle</span><span><Check/> Score validation</span><span><Check/> Draw simulation</span><span><Check/> Winner proof review</span><span><Check/> Payout tracking</span><span><Check/> Charity reporting</span></div></section></div>}{tab === 'users' && <section className="admin-panel"><div className="panel-title"><h2>User management</h2><span>{users.length} loaded</span></div><div className="admin-table"><div className="tr th"><span>Name</span><span>Email</span><span>Role</span><span>Created</span></div>{users.map(u => <div className="tr" key={u.id}><span>{u.full_name || '—'}</span><span>{u.email || '—'}</span><span>{u.role}</span><span>{u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : '—'}</span></div>)}</div></section>}{tab === 'draw' && <section className="admin-panel"><div className="panel-title"><div><span className="card-kicker">DRAW MANAGEMENT</span><h2>Simulate before publish</h2></div><Gift/></div><p>Generate a five-number result locally for review. Production publishing is handled by the secured admin draw function.</p><button className="btn primary" onClick={simulate}>Run simulation <Zap size={16}/></button>{simulation && <div className="number-balls">{simulation.map(n => <span key={n}>{n}</span>)}</div>}{message && <div className="form-message">{message}</div>}</section>}{tab === 'charity' && <section className="admin-panel"><div className="panel-title"><h2>Charity management</h2><span>{charityRows.length} active</span></div><div className="admin-charities">{charityRows.map(c => <div key={c.id}><div className="charity-dot"><Heart size={16}/></div><div><strong>{c.name}</strong><span>{c.category}</span></div><button onClick={() => setCharityRows(rows => rows.filter(x => x.id !== c.id))}>Delete</button></div>)}</div><button className="btn ghost" onClick={() => setCharityRows(rows => [...rows, { id: `new-${Date.now()}`, name: 'New community cause', category: 'Community', copy: 'Draft charity listing.', goal: 100000, raised: 0, accent: 'hands' }])}>Add charity <ArrowRight size={15}/></button></section>}{tab === 'winners' && <section className="admin-panel"><div className="panel-title"><h2>Winner verification</h2><span>2 recent</span></div>{demoWinners.map(w => <div className="admin-winner" key={w.month}><div><strong>{w.month}</strong><span>{w.match} · {money(w.amount)}</span></div><span className={`payment ${w.status === 'Paid' ? 'paid' : ''}`}>{w.status}</span><button className="btn small ghost">Review proof</button></div>)}</section>}{tab === 'reports' && <section className="admin-panel"><div className="panel-title"><h2>Reports & analytics</h2><BarChart3/></div><div className="report-grid"><AdminStat label="Total users" value={users.length || '—'} icon={<UserRound/>}/><AdminStat label="Total prize pool" value="₹31,600" icon={<Gift/>}/><AdminStat label="Charity total" value="₹1.84L" icon={<Heart/>}/><AdminStat label="Draws completed" value="8" icon={<Trophy/>}/></div></section>}</main>
}
function AdminStat({label,value,icon}) { return <div className="admin-stat"><div>{icon}</div><span>{label}</span><strong>{value}</strong></div> }

function Footer() { return <footer><div className="container footer-grid"><div><Link to="/" className="brand"><span className="brand-mark">FH</span><span>fairway<span>forward</span></span></Link><p>Golf that gives something back.</p></div><div><span className="footer-label">Explore</span><Link to="/charities">Charities</Link><Link to="/draw">How it works</Link><Link to="/subscribe">Membership</Link></div><div><span className="footer-label">Member</span><Link to="/auth">Sign in</Link><Link to="/dashboard">Dashboard</Link></div></div><div className="container footer-bottom"><span>© 2026 Fairway Forward · Digital Heroes assignment</span><span>Built for impact.</span></div></footer> }

export default App
