const { useState, useEffect, useRef, useMemo, useCallback, Fragment } = React;

/* ============================================================
   POLICY (internal — never displayed as a rupee amount)
   ============================================================ */
const POLICY_THRESHOLD = 50000;

/* ============================================================
   SCENARIOS — `lastPrice` and `rounds` arrays are kept internally
   for math but NEVER shown as rupee figures. UI displays index,
   percent-below-baseline, or qualitative tier.
   ============================================================ */
const SCENARIOS = {
  cartridges: {
    id: 'cartridges',
    iconKey: 'printer',
    accent: 'from-blue-500 to-indigo-500',
    chipLabel: 'Reorder 500 printer cartridges, same as last quarter',
    requestText: 'Reorder 500 printer cartridges, same as last quarter',
    item: 'HP printer cartridges (mixed black & color)',
    category: 'Office Supplies · Print',
    categoryCode: 'PRINT_CONSUMABLES',
    intent: 'REORDER_KNOWN_SKU',
    bu: 'finance-mh',
    quantity: 500,
    unitShort: 'unit',
    unitLabel: 'cartridges',
    lastVendor: 'InkJet Bharat',
    lastPrice: 450,
    region: 'IN · pan-India',
    discovered: 247,
    creditDist: [4, 8, 12],
    esgPass: 18,
    esgFlag: 6,
    msmeCount: 9,
    targetIndex: 88,
    floorIndex: 85,
    vendors: [
      { name: 'InkJet Bharat',      rating: 4.6, location: 'Pune',       sla: '48hr', credit: 'A',  esg: 'pass', msme: true,  rounds: [460, 430, 410, 395], dropOutAfterRound: null },
      { name: 'PrintPlus Supplies', rating: 4.3, location: 'Delhi NCR',  sla: '72hr', credit: 'A',  esg: 'pass', msme: false, rounds: [470, 445, 420, 405], dropOutAfterRound: null },
      { name: 'CartridgeHub India', rating: 4.4, location: 'Bengaluru',  sla: '60hr', credit: 'B+', esg: 'pass', msme: true,  rounds: [455, 425, 408, 400], dropOutAfterRound: null },
    ],
    winnerIndex: 0,
    consolidationNote: null,
    flavor: 'Recurring reorder · benchmarked against last 4 quarters',
  },
  stationery: {
    id: 'stationery',
    iconKey: 'pen',
    accent: 'from-teal-500 to-emerald-500',
    chipLabel: 'Office stationery bundle for the Mumbai team',
    requestText: 'Office stationery bundle for the Mumbai team',
    item: 'Stationery bundle (notebooks, pens, files, sticky notes — 25 SKUs)',
    category: 'Office Supplies · Stationery',
    categoryCode: 'OFFICE_STATIONERY',
    intent: 'NEW_BUNDLE_REQUEST',
    bu: 'ops-mumbai',
    quantity: 1,
    unitShort: 'bundle',
    unitLabel: 'bundle',
    lastVendor: 'PaperPlus Traders',
    lastPrice: 14200,
    region: 'IN · Maharashtra',
    discovered: 86,
    creditDist: [3, 6, 9],
    esgPass: 11,
    esgFlag: 3,
    msmeCount: 7,
    targetIndex: 88,
    floorIndex: 85,
    vendors: [
      { name: 'PaperPlus Traders',  rating: 4.5, location: 'Mumbai', sla: '24hr', credit: 'A',  esg: 'pass', msme: true,  rounds: [14200, 12900, 12400], dropOutAfterRound: null },
      { name: 'Mumbai Office Mart', rating: 4.2, location: 'Mumbai', sla: '48hr', credit: 'B+', esg: 'pass', msme: true,  rounds: [14500, 13200, 12800], dropOutAfterRound: null },
      { name: 'Stationery World',   rating: 4.0, location: 'Thane',  sla: '48hr', credit: 'B',  esg: 'pass', msme: false, rounds: [15000, 13800, 13100], dropOutAfterRound: null },
    ],
    winnerIndex: 0,
    consolidationNote: null,
    flavor: 'Single-site delivery · auto-approve eligible',
  },
  pantry: {
    id: 'pantry',
    iconKey: 'coffee',
    accent: 'from-amber-500 to-orange-500',
    chipLabel: 'Monthly pantry & coffee supplies refill',
    requestText: 'Monthly pantry & coffee supplies refill',
    item: 'Pantry & coffee refill (monthly HQ bundle)',
    category: 'Pantry & Beverages',
    categoryCode: 'PANTRY_BEVERAGES',
    intent: 'RECURRING_REFILL',
    bu: 'admin-mumbai',
    quantity: 1,
    unitShort: 'month',
    unitLabel: 'monthly refill',
    lastVendor: 'GreenBean Suppliers',
    lastPrice: 38000,
    region: 'IN · Maharashtra',
    discovered: 142,
    creditDist: [5, 9, 10],
    esgPass: 16,
    esgFlag: 4,
    msmeCount: 8,
    targetIndex: 89,
    floorIndex: 86,
    vendors: [
      { name: 'GreenBean Suppliers', rating: 4.7, location: 'Mumbai', sla: '24hr', credit: 'A+', esg: 'pass', msme: true,  rounds: [39000, 36500, 34800, 33500], dropOutAfterRound: null },
      { name: 'PantryPro India',     rating: 4.1, location: 'Pune',   sla: '48hr', credit: 'B',  esg: 'pass', msme: false, rounds: [38500, 35800, null, null],   dropOutAfterRound: 1 },
      { name: 'CafeFresh Mumbai',    rating: 4.3, location: 'Mumbai', sla: '24hr', credit: 'A',  esg: 'pass', msme: true,  rounds: [40000, 37200, 35600, 34200], dropOutAfterRound: null },
    ],
    winnerIndex: 0,
    consolidationNote: null,
    flavor: 'Vendor walked away mid-negotiation · remaining 2 closed the deal',
  },
  cleaning: {
    id: 'cleaning',
    iconKey: 'spray',
    accent: 'from-cyan-500 to-blue-500',
    chipLabel: 'Cleaning supplies for 3 floors',
    requestText: 'Cleaning supplies for 3 floors',
    item: 'Cleaning supplies for 3 floors (monthly)',
    category: 'Facilities · Cleaning',
    categoryCode: 'FACILITIES_CLEANING',
    intent: 'RECURRING_REFILL',
    bu: 'facilities-mh',
    quantity: 1,
    unitShort: 'month',
    unitLabel: 'monthly supply',
    lastVendor: 'CleanCo Services',
    lastPrice: 22000,
    region: 'IN · Maharashtra',
    discovered: 198,
    creditDist: [6, 11, 14],
    esgPass: 20,
    esgFlag: 5,
    msmeCount: 11,
    targetIndex: 90,
    floorIndex: 91,
    vendors: [
      { name: 'CleanCo Services', rating: 4.4, location: 'Mumbai',      sla: '24hr', credit: 'A',  esg: 'pass', msme: true,  rounds: [22500, 21000, 20400, 20200], dropOutAfterRound: null, hitFloor: true },
      { name: 'HygienePlus',      rating: 4.2, location: 'Pune',        sla: '48hr', credit: 'B+', esg: 'pass', msme: true,  rounds: [23000, 21500, 20800, 20500], dropOutAfterRound: null },
      { name: 'SparkleMax',       rating: 4.0, location: 'Navi Mumbai', sla: '36hr', credit: 'B',  esg: 'pass', msme: false, rounds: [22800, 21200, 20600, 20300], dropOutAfterRound: null },
    ],
    winnerIndex: 0,
    consolidationNote: null,
    flavor: 'Negotiation hit a market floor · modest savings, auto-approved',
  },
  it: {
    id: 'it',
    iconKey: 'mouse',
    accent: 'from-violet-500 to-fuchsia-500',
    chipLabel: '50 wireless mice and keyboards for new hires',
    requestText: '50 wireless mice and keyboards for new hires',
    item: 'Wireless mouse + keyboard sets (employee-grade)',
    category: 'IT Hardware · Peripherals',
    categoryCode: 'IT_PERIPHERALS',
    intent: 'NEW_HIRE_KIT',
    bu: 'it-pan-in',
    quantity: 50,
    unitShort: 'set',
    unitLabel: 'sets',
    lastVendor: 'TechSource India',
    lastPrice: 1850,
    region: 'IN · pan-India',
    discovered: 312,
    creditDist: [7, 14, 18],
    esgPass: 24,
    esgFlag: 8,
    msmeCount: 12,
    targetIndex: 89,
    floorIndex: 86,
    vendors: [
      { name: 'TechSource India',     rating: 4.5, location: 'Bengaluru', sla: '72hr', credit: 'A+', esg: 'pass', msme: true,  rounds: [1890, 1750, 1680, 1640], dropOutAfterRound: null },
      { name: 'DigiKart Enterprise',  rating: 4.3, location: 'Gurugram',  sla: '96hr', credit: 'A',  esg: 'pass', msme: false, rounds: [1920, 1800, 1720, 1690], dropOutAfterRound: null },
      { name: 'GadgetWorld B2B',      rating: 4.2, location: 'Mumbai',    sla: '72hr', credit: 'B+', esg: 'pass', msme: true,  rounds: [1850, 1740, 1670, 1650], dropOutAfterRound: null },
    ],
    winnerIndex: 0,
    consolidationNote: 'Across 8 BUs there are 3 overlapping IT peripheral vendors. Consolidating to a single preferred supplier projects ~14% additional savings.',
    flavor: 'Larger IT order · requires human approval + a consolidation insight',
  },
};

/* ============================================================
   HELPERS
   ============================================================ */
const indexOf = (p, b) => Math.round((p / b) * 100);
const pctBelow = (p, b) => Math.round(((b - p) / b) * 1000) / 10;
const formatINR = (n) => '₹' + Number(n).toLocaleString('en-IN');
const formatINRShort = (n) => {
  if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2) + ' Cr';
  if (n >= 100000) return '₹' + (n / 100000).toFixed(2) + ' L';
  if (n >= 1000) return '₹' + (n / 1000).toFixed(1) + 'K';
  return '₹' + n;
};

const computeTotals = (s) => {
  const winner = s.vendors[s.winnerIndex];
  const finalUnit = winner.rounds[winner.rounds.length - 1];
  const finalTotal = finalUnit * s.quantity;
  const baselineTotal = s.lastPrice * s.quantity;
  const finalIndex = indexOf(finalUnit, s.lastPrice);
  const savingsPct = pctBelow(finalUnit, s.lastPrice);
  const tier = finalTotal >= POLICY_THRESHOLD ? 'material' : 'standard';
  const requiresHuman = tier === 'material';
  return { winner, finalIndex, savingsPct, tier, requiresHuman, finalTotal, baselineTotal };
};

const STEPS = [
  { key: 'intake',        label: 'Request' },
  { key: 'orchestration', label: 'Vendor Discovery' },
  { key: 'negotiation',   label: 'Negotiation' },
  { key: 'governance',    label: 'Governance' },
  { key: 'outcome',       label: 'Outcome' },
];

const PHASES = [
  { id: 'planning',   label: 'Intent & Planning',         tone: 'blue',    icon: 'human',    short: 'Planning'   },
  { id: 'listing',    label: 'Listing & Discovery',       tone: 'teal',    icon: 'search',   short: 'Listing'    },
  { id: 'strategy',   label: 'Negotiation Strategy',      tone: 'violet',  icon: 'sparkles', short: 'Strategy'   },
  { id: 'rounds',     label: 'Multi-Round Negotiation',   tone: 'emerald', icon: 'graph',    short: 'Rounds'     },
  { id: 'governance', label: 'Governance & Policy',       tone: 'amber',   icon: 'shield',   short: 'Governance' },
  { id: 'closure',    label: 'Closure & Audit',           tone: 'rose',    icon: 'check',    short: 'Closure'    },
];

/* ============================================================
   LOG BUILDERS — rich, sub-agent-level events per phase
   ============================================================ */
const buildPlanningLogs = (s) => [
  { phase: 'planning', agent: 'Supervisor', sub: 'intent_classifier()',                  tone: 'blue',
    msg: `request parsed → category=<b>${s.categoryCode}</b> · intent=<b>${s.intent}</b> · qty=<b>${s.quantity}</b> · region=${s.region}` },
  { phase: 'planning', agent: 'Supervisor', sub: 'intent_classifier.confidence()',       tone: 'blue',
    msg: `confidence <b>0.94</b> · disambiguation skipped · no clarifying question needed` },
  { phase: 'planning', agent: 'Supervisor', sub: 'routing_planner()',                    tone: 'blue',
    msg: `agent graph queued: <b>Listing → Negotiator → Governance → Closer</b>` },
  { phase: 'planning', agent: 'Memory',     sub: 'short_term.init()',                    tone: 'violet',
    msg: `session ctx loaded · user=<b>priya.sharma</b> · org=coca-cola.in · BU=${s.bu}` },
  { phase: 'planning', agent: 'Memory',     sub: 'long_term.fetch("purchase_history", 12mo)', tone: 'violet',
    msg: `<b>4 prior orders</b> retrieved · last from <b>"${s.lastVendor}"</b> @ <b>${formatINR(s.lastPrice)}</b>/${s.unitShort}` },
  { phase: 'planning', agent: 'Memory',     sub: 'semantic_cache.lookup()',              tone: 'violet',
    msg: `2 semantically similar past requests · pattern matched → re-use shortlist scoring weights` },
  { phase: 'planning', agent: 'Knowledge',  sub: 'rag.policy_engine.fetch()',            tone: 'amber',
    msg: `loaded <b>P-04.2</b> (auto-approve ≤ ${formatINR(POLICY_THRESHOLD)}) · <b>P-09.1</b> (vendor ESG) · <b>P-12.4</b> (MSME quotas)` },
];

const buildListingLogs = (s) => [
  { phase: 'listing', agent: 'Listing',   sub: 'vendor_discovery.search()', tone: 'teal',
    msg: `supplier_network.query(category="${s.categoryCode}", region="${s.region}") → <b>${s.discovered} candidates</b>` },
  { phase: 'listing', agent: 'Listing',   sub: 'profile_enricher.credit_lookup()', tone: 'teal',
    msg: `batch enriched top 24 · Crisil distribution: <b>A+ ${s.creditDist[0]} · A ${s.creditDist[1]} · B+ ${s.creditDist[2]}</b>` },
  { phase: 'listing', agent: 'Listing',   sub: 'profile_enricher.esg_audit()', tone: 'teal',
    msg: `<b>${s.esgPass} pass</b>, ${s.esgFlag} flagged · adversarial supplier list cross-checked` },
  { phase: 'listing', agent: 'Listing',   sub: 'profile_enricher.msme_check()', tone: 'teal',
    msg: `<b>${s.msmeCount} MSME</b> finalists · helps meet GoI procurement quota` },
  { phase: 'listing', agent: 'Listing',   sub: 'shortlister.apply_filters()', tone: 'teal',
    msg: `credit ≥ B, ESG=pass, distance ≤ 1500km · <b>6 finalists</b>` },
  { phase: 'listing', agent: 'Listing',   sub: 'shortlister.rank()', tone: 'teal',
    msg: `composite score (price 40% · SLA 30% · ESG 20% · MSME 10%) · <b>top 3 selected</b>` },
  { phase: 'listing', agent: 'Memory',    sub: 'long_term.lookup("relationships")', tone: 'violet',
    msg: `2 prior partners · 1 new vendor · negotiation patterns retrieved` },
];

const buildStrategyLogs = (s) => {
  const targetPrice = Math.round(s.lastPrice * s.targetIndex / 100);
  const floorPrice = Math.round(s.lastPrice * s.floorIndex / 100);
  return [
    { phase: 'strategy', agent: 'Negotiator', sub: 'strategy_planner.anchor_analysis()', tone: 'emerald',
      msg: `market anchor analysis → benchmark band <b>${formatINR(floorPrice)}–${formatINR(targetPrice)}</b>/${s.unitShort} achievable in 3–4 rounds` },
    { phase: 'strategy', agent: 'Negotiator', sub: 'strategy_planner.set_target()', tone: 'emerald',
      msg: `target = <b>${formatINR(targetPrice)}</b>/${s.unitShort} · floor = <b>${formatINR(floorPrice)}</b>/${s.unitShort} · BATNA = spot market` },
    { phase: 'strategy', agent: 'Knowledge',  sub: 'rag.category_playbook.fetch()', tone: 'amber',
      msg: `loaded play <b>"multi-round ${s.categoryCode}"</b> · 4-round protocol · concession step ≤ 3%` },
    { phase: 'strategy', agent: 'Memory',     sub: 'long_term.fetch("negotiation_patterns")', tone: 'violet',
      msg: `historical: this category typically yields <b>8–12%</b> across 3 rounds · drop-out risk ${s.id === 'pantry' ? 'high' : 'low'}` },
    { phase: 'strategy', agent: 'Negotiator', sub: 'outreach_bot.dispatch_rfq()', tone: 'emerald',
      msg: `RFQ packets sent to 3 finalists · template <b>T-RFQ-08</b> · response window 2hr` },
  ];
};

const buildGovernanceLogs = (s, totals) => {
  const base = [
    { phase: 'governance', agent: 'Governance', sub: 'policy_engine.evaluate()', tone: 'amber',
      msg: `deal envelope <b>${formatINR(totals.finalTotal)}</b> checked against <b>P-04.2 tier table</b>` },
    { phase: 'governance', agent: 'Governance', sub: 'policy_engine.classify()', tone: 'amber',
      msg: `tier = <b>${totals.tier === 'material' ? 'Material Order' : 'Standard Order'}</b> · ${totals.requiresHuman ? `${formatINR(totals.finalTotal - POLICY_THRESHOLD)} above ${formatINR(POLICY_THRESHOLD)} cutoff · human approval required` : `within ${formatINR(POLICY_THRESHOLD)} cutoff · auto-approve eligible`}` },
    { phase: 'governance', agent: 'Governance', sub: 'risk_scorer.compute()', tone: 'amber',
      msg: `risk score <b>2.1 / 10</b> (low) · vendor track record + ESG + MSME all green` },
    { phase: 'governance', agent: 'Governance', sub: 'compliance_gatekeeper.verify()', tone: 'amber',
      msg: `winning vendor re-verified · GST ✓ · MSME ${totals.winner.msme ? '✓' : '—'} · ESG ${totals.winner.esg}` },
  ];
  if (totals.requiresHuman) {
    base.push({ phase: 'governance', agent: 'Governance', sub: 'approval_router.route()', tone: 'amber',
      msg: `routed to <b>priya.sharma@coca-cola.in</b> (Cat-Mgr Maharashtra) · SLA 24h` });
  } else {
    base.push({ phase: 'governance', agent: 'Governance', sub: 'approval_router.auto_approve()', tone: 'emerald',
      msg: `auto-approve issued · no human intervention needed` });
  }
  return base;
};

const buildClosureLogs = (s, totals) => [
  { phase: 'closure', agent: 'Closer', sub: 'po_generator.draft()', tone: 'rose',
    msg: `PO drafted from template <b>TPL-12-A</b> · digitally signed · attachments: contract, SLA, ESG cert` },
  { phase: 'closure', agent: 'Closer', sub: 'email_dispatcher.notify_vendor()', tone: 'rose',
    msg: `<b>${totals.winner.name}</b> notified · acknowledgement expected within 12hr` },
  { phase: 'closure', agent: 'Closer', sub: 'audit_writer.seal()', tone: 'rose',
    msg: `immutable audit record sealed · session=<b>mer-${4912 + s.id.length}</b> · <b>SOX-ready</b>` },
  { phase: 'closure', agent: 'Closer', sub: 'audit_writer.close()', tone: 'rose',
    msg: `session closed · events recorded across <b>6 phases</b> · ready for review` },
];

/* ============================================================
   ICONS
   ============================================================ */
const Icon = ({ name, className = 'w-5 h-5' }) => {
  const common = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.7', strokeLinecap: 'round', strokeLinejoin: 'round', className };
  switch (name) {
    case 'printer':    return <svg {...common}><path d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v7H6z"/></svg>;
    case 'pen':        return <svg {...common}><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><circle cx="9" cy="11" r="2"/></svg>;
    case 'coffee':     return <svg {...common}><path d="M17 8h1a4 4 0 010 8h-1M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3"/></svg>;
    case 'spray':      return <svg {...common}><path d="M9 11h6v10H9z"/><path d="M12 7v4M8 3h8M10 5h4"/></svg>;
    case 'mouse':      return <svg {...common}><rect x="6" y="3" width="12" height="18" rx="6"/><path d="M12 7v4"/></svg>;
    case 'check':      return <svg {...common} strokeWidth="2.4"><path d="M5 13l4 4L19 7"/></svg>;
    case 'arrow':      return <svg {...common}><path d="M5 12h14M13 5l7 7-7 7"/></svg>;
    case 'clock':      return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case 'shield':     return <svg {...common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    case 'sparkles':   return <svg {...common}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>;
    case 'down':       return <svg {...common} strokeWidth="2.2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>;
    case 'up':         return <svg {...common} strokeWidth="2.2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>;
    case 'pencil':     return <svg {...common}><path d="M12 20h9M16.5 3.5a2.12 2.12 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>;
    case 'human':      return <svg {...common}><circle cx="12" cy="7" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>;
    case 'bolt':       return <svg {...common}><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg>;
    case 'doc':        return <svg {...common}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6M8 13h8M8 17h5"/></svg>;
    case 'eye':        return <svg {...common}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'eyeOff':     return <svg {...common}><path d="M17.94 17.94A10.94 10.94 0 0112 19c-7 0-10-7-10-7a19.8 19.8 0 014.22-5.94M9.9 4.24A10.94 10.94 0 0112 4c7 0 10 7 10 7a19.8 19.8 0 01-2.16 3.19M14.12 14.12A3 3 0 119.88 9.88M1 1l22 22"/></svg>;
    case 'refresh':    return <svg {...common}><path d="M3 12a9 9 0 0115-6.7L21 8M21 3v5h-5M21 12a9 9 0 01-15 6.7L3 16M3 21v-5h5"/></svg>;
    case 'graph':      return <svg {...common}><path d="M3 3v18h18M7 16l4-6 4 3 6-9"/></svg>;
    case 'database':   return <svg {...common}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v6c0 1.7 4 3 9 3s9-1.3 9-3V5M3 11v6c0 1.7 4 3 9 3s9-1.3 9-3v-6"/></svg>;
    case 'book':       return <svg {...common}><path d="M4 19.5A2.5 2.5 0 016.5 17H20V2H6.5A2.5 2.5 0 004 4.5v15zM4 19.5A2.5 2.5 0 006.5 22H20v-5"/></svg>;
    case 'tool':       return <svg {...common}><path d="M14.7 6.3a4 4 0 015.7 5.7l-9.5 9.5a2 2 0 01-2.8 0l-2.6-2.6a2 2 0 010-2.8l9.2-9.8z"/></svg>;
    case 'search':     return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>;
    case 'flag':       return <svg {...common}><path d="M4 22V4M4 4h13l-2 4 2 4H4"/></svg>;
    case 'chevDown':   return <svg {...common} strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>;
    case 'chevRight':  return <svg {...common} strokeWidth="2"><path d="M9 6l6 6-6 6"/></svg>;
    case 'percent':    return <svg {...common} strokeWidth="2"><path d="M19 5L5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>;
    case 'layers':     return <svg {...common}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>;
    case 'rupee':      return <svg {...common} strokeWidth="2"><path d="M6 3h12M6 8h12M6 13h7c2.8 0 5-2.2 5-5M9 13l9 8"/></svg>;
    default: return null;
  }
};

/* ============================================================
   APP — top-level state
   ============================================================ */
const App = () => {
  const [screen, setScreen] = useState('intake');
  const [scenarioId, setScenarioId] = useState(null);
  const [customRequest, setCustomRequest] = useState('');
  const [auditTrail, setAuditTrail] = useState([]);
  const [governanceDecision, setGovernanceDecision] = useState(null);
  const sessionStartRef = useRef(null);

  const scenario = scenarioId ? SCENARIOS[scenarioId] : null;
  const totals = useMemo(() => (scenario ? computeTotals(scenario) : null), [scenario]);

  const appendAudit = useCallback((entry) => {
    setAuditTrail((prev) => {
      const t = sessionStartRef.current ? Date.now() - sessionStartRef.current : 0;
      const mm = String(Math.floor(t / 60000)).padStart(2, '0');
      const ss = String(Math.floor((t % 60000) / 1000)).padStart(2, '0');
      const ms = String(t % 1000).padStart(3, '0').slice(0, 3);
      return [...prev, { ...entry, ts: `${mm}:${ss}.${ms}` }];
    });
  }, []);

  const startScenario = useCallback((id) => {
    sessionStartRef.current = Date.now();
    setScenarioId(id);
    setAuditTrail([]);
    setGovernanceDecision(null);
    setScreen('orchestration');
  }, []);

  const resetAll = useCallback(() => {
    setScreen('intake');
    setScenarioId(null);
    setCustomRequest('');
    setAuditTrail([]);
    setGovernanceDecision(null);
    sessionStartRef.current = null;
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar screen={screen} scenario={scenario} />
      <main key={screen} data-screen-root className="flex-1">
        {screen === 'intake' && (
          <IntakeScreen onSubmit={startScenario} customRequest={customRequest} setCustomRequest={setCustomRequest} />
        )}
        {screen === 'orchestration' && scenario && (
          <OrchestrationScreen scenario={scenario} auditTrail={auditTrail} appendAudit={appendAudit} onContinue={() => setScreen('negotiation')} />
        )}
        {screen === 'negotiation' && scenario && (
          <NegotiationScreen scenario={scenario} auditTrail={auditTrail} appendAudit={appendAudit} onContinue={() => setScreen('governance')} />
        )}
        {screen === 'governance' && scenario && (
          <GovernanceScreen
            scenario={scenario}
            totals={totals}
            auditTrail={auditTrail}
            appendAudit={appendAudit}
            decision={governanceDecision}
            setDecision={setGovernanceDecision}
            onContinue={() => setScreen('outcome')}
          />
        )}
        {screen === 'outcome' && scenario && (
          <OutcomeScreen scenario={scenario} totals={totals} auditTrail={auditTrail} decision={governanceDecision} onReset={resetAll} appendAudit={appendAudit} />
        )}
      </main>
      <footer className="py-6 px-6 text-center text-[11px] text-slate-400 border-t border-slate-200/60 bg-white/40">
        <span className="font-medium text-slate-500">AI decides · Suite governs · Enterprise stays in control</span>
        <span className="mx-2 text-slate-300">·</span>
        <span>Prototype for Zycus product round · all data simulated</span>
      </footer>
    </div>
  );
};

/* ============================================================
   TOP BAR
   ============================================================ */
const TopBar = ({ screen, scenario }) => {
  const activeIdx = STEPS.findIndex((s) => s.key === screen);
  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-6">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Icon name="sparkles" className="w-5 h-5" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-slate-900 text-[14.5px] tracking-tight">Merlin <span className="text-slate-400 font-normal">· Tail-Spend Agent</span></div>
            <div className="text-[10.5px] text-slate-500 font-medium tracking-wide">BY ZYCUS · ENTERPRISE PROCUREMENT</div>
          </div>
        </div>

        <div className="hidden lg:flex flex-1 items-center justify-center gap-1.5">
          {STEPS.map((s, i) => (
            <Fragment key={s.key}>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                i === activeIdx ? 'bg-slate-900 text-white shadow-sm' :
                i < activeIdx ? 'text-slate-500' : 'text-slate-400'
              }`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                  i === activeIdx ? 'bg-white text-slate-900' :
                  i < activeIdx ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                }`}>{i < activeIdx ? <Icon name="check" className="w-2.5 h-2.5" /> : i + 1}</span>
                {s.label}
              </div>
              {i < STEPS.length - 1 && <div className={`w-3 h-px ${i < activeIdx ? 'bg-emerald-300' : 'bg-slate-200'}`}></div>}
            </Fragment>
          ))}
        </div>

        <div className="ml-auto lg:ml-0 flex items-center gap-3 shrink-0">
          {scenario && screen !== 'intake' && screen !== 'outcome' && (
            <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-500">
              <span className="font-mono">REQ-{scenario.id.toUpperCase().slice(0,4)}-{String(Math.floor((scenario.quantity * 137) % 10000)).padStart(4, '0')}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-soft"></span>
            <span className="text-[10.5px] font-semibold text-emerald-700 tracking-wide">AGENT ONLINE</span>
          </div>
        </div>
      </div>
    </header>
  );
};

/* ============================================================
   INTAKE
   ============================================================ */
const IntakeScreen = ({ onSubmit, customRequest, setCustomRequest }) => {
  const [matchedId, setMatchedId] = useState(null);

  useEffect(() => {
    if (!customRequest.trim()) { setMatchedId(null); return; }
    const t = customRequest.toLowerCase();
    let found = null;
    if (t.includes('cartridge') || t.includes('printer') || t.includes('ink')) found = 'cartridges';
    else if (t.includes('stationery') || t.includes('notebook') || t.includes('pen')) found = 'stationery';
    else if (t.includes('pantry') || t.includes('coffee') || t.includes('tea') || t.includes('snack')) found = 'pantry';
    else if (t.includes('clean') || t.includes('sanitizer') || t.includes('hygien')) found = 'cleaning';
    else if (t.includes('mouse') || t.includes('keyboard') || t.includes('it') || t.includes('peripheral')) found = 'it';
    setMatchedId(found);
  }, [customRequest]);

  const handleSubmit = () => {
    if (matchedId) return onSubmit(matchedId);
    onSubmit('cartridges');
  };

  return (
    <div className="max-w-5xl mx-auto px-6 pt-14 pb-20">
      <div className="text-center mb-12 fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-[11px] font-medium text-slate-700 mb-7">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-soft"></span>
          <span className="text-slate-500">AGENT ONLINE</span>
          <span className="text-slate-300">·</span>
          <span>ready to take a request</span>
        </div>
        <h1 className="text-[44px] md:text-5xl font-bold tracking-tight text-slate-900 mb-4 leading-tight">
          What do you <span className="gradient-text">need?</span>
        </h1>
        <p className="text-slate-500 text-[17px] max-w-xl mx-auto leading-relaxed">
          Tell us in plain English. Merlin handles vendor discovery, multi-round negotiation, and compliance — touchless.
        </p>
      </div>

      <div className="max-w-3xl mx-auto fade-in" style={{ animationDelay: '60ms' }}>
        <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-2">
          <div className="flex items-center gap-3 p-2.5">
            <div className="w-10 h-10 rounded-xl gradient-bg-soft flex items-center justify-center text-blue-600 shrink-0">
              <Icon name="pencil" className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={customRequest}
              onChange={(e) => setCustomRequest(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              placeholder="e.g. ‘Reorder 500 printer cartridges, same as last quarter’"
              className="flex-1 outline-none text-[15.5px] text-slate-900 placeholder-slate-400 bg-transparent"
            />
            <button
              onClick={handleSubmit}
              className="gradient-bg text-white px-5 py-2.5 rounded-xl text-[13.5px] font-semibold shadow-sm hover:shadow-lg hover:shadow-blue-500/20 transition-all flex items-center gap-1.5 shrink-0"
            >
              Submit request <Icon name="arrow" className="w-4 h-4" />
            </button>
          </div>
          {matchedId && (
            <div className="px-3 pb-2.5 -mt-1 flex items-center gap-2 text-[12px] text-blue-600 fade-in">
              <Icon name="sparkles" className="w-3.5 h-3.5" />
              <span>Matched to scenario · <span className="font-medium">{SCENARIOS[matchedId].category}</span></span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto mt-10 fade-in" style={{ animationDelay: '140ms' }}>
        <div className="text-center mb-4 text-[11px] uppercase tracking-[0.15em] text-slate-400 font-semibold">
          Or pick a recent request
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.values(SCENARIOS).map((s, i) => (
            <button
              key={s.id}
              onClick={() => { setCustomRequest(s.chipLabel); onSubmit(s.id); }}
              className="group text-left bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md rounded-xl p-4 transition-all flex items-start gap-3 fade-in"
              style={{ animationDelay: `${160 + i * 50}ms` }}
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.accent} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                <Icon name={s.iconKey} className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium text-slate-900 leading-snug">{s.chipLabel}</div>
                <div className="text-[11px] text-slate-500 mt-1 font-medium tracking-wide uppercase">{s.category}</div>
              </div>
              <div className="text-slate-300 group-hover:text-blue-500 transition-colors mt-1">
                <Icon name="arrow" className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 fade-in" style={{ animationDelay: '440ms' }}>
        <CapabilityPill icon="search"   label="Vendor discovery" sub="247-vendor network · enriched" />
        <CapabilityPill icon="graph"    label="Multi-round negotiation" sub="strategy · counter-offers · floor" />
        <CapabilityPill icon="shield"   label="Policy gating"    sub="tier classification · risk score" />
        <CapabilityPill icon="doc"      label="Full audit trail" sub="immutable · SOX-ready" />
      </div>

      <div className="text-center mt-10 text-[12px] text-slate-400 fade-in" style={{ animationDelay: '540ms' }}>
        AI decides · Suite governs · Enterprise stays in control
      </div>
    </div>
  );
};

const StatPill = ({ icon, label, value, sub }) => (
  <div className="bg-white rounded-xl border border-slate-200 px-4 py-3.5 flex items-center gap-3 shadow-sm">
    <div className="w-9 h-9 rounded-lg gradient-bg-soft flex items-center justify-center text-blue-600 shrink-0">
      <Icon name={icon} className="w-[18px] h-[18px]" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[10.5px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="text-[18px] font-bold text-slate-900 num-tab leading-tight">{value}</div>
      <div className="text-[10.5px] text-slate-400">{sub}</div>
    </div>
  </div>
);

const CapabilityPill = ({ icon, label, sub }) => (
  <div className="bg-white rounded-xl border border-slate-200 px-4 py-3.5 shadow-sm">
    <div className="flex items-center gap-2 mb-1.5">
      <div className="w-7 h-7 rounded-lg gradient-bg-soft flex items-center justify-center text-blue-600 shrink-0">
        <Icon name={icon} className="w-4 h-4" />
      </div>
      <div className="text-[12px] font-semibold text-slate-900 leading-tight">{label}</div>
    </div>
    <div className="text-[10.5px] text-slate-500 leading-snug">{sub}</div>
  </div>
);

/* ============================================================
   REQUEST SUMMARY
   ============================================================ */
const RequestSummary = ({ scenario }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-start gap-4">
    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${scenario.accent} text-white flex items-center justify-center shrink-0 shadow-sm`}>
      <Icon name={scenario.iconKey} className="w-6 h-6" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[10.5px] uppercase tracking-wider text-slate-500 font-semibold mb-0.5">Request</div>
      <div className="text-[15px] font-semibold text-slate-900 leading-snug">{scenario.requestText}</div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11.5px] text-slate-500">
        <span><strong className="text-slate-700">{scenario.quantity}</strong> {scenario.unitLabel}</span>
        <span className="text-slate-300">·</span>
        <span>{scenario.category}</span>
        <span className="text-slate-300">·</span>
        <span>{scenario.region}</span>
      </div>
    </div>
    <div className="text-right shrink-0">
      <div className="text-[10.5px] uppercase tracking-wider text-slate-400 font-semibold">Baseline</div>
      <div className="text-[18px] font-bold text-slate-900 num-tab">{formatINR(scenario.lastPrice * scenario.quantity)}</div>
      <div className="text-[10.5px] text-slate-400">@ {formatINR(scenario.lastPrice)}/{scenario.unitShort}</div>
    </div>
  </div>
);

/* ============================================================
   SECTIONED CONSOLE — bifurcated by phase
   ============================================================ */
const TONE_BG = {
  blue:    'bg-blue-500/15 text-blue-300 border-blue-500/25',
  violet:  'bg-violet-500/15 text-violet-300 border-violet-500/25',
  amber:   'bg-amber-500/15 text-amber-300 border-amber-500/25',
  teal:    'bg-teal-500/15 text-teal-300 border-teal-500/25',
  emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  rose:    'bg-rose-500/15 text-rose-300 border-rose-500/25',
  slate:   'bg-slate-500/15 text-slate-300 border-slate-500/25',
};
const TONE_TEXT = {
  blue: 'text-blue-300', violet: 'text-violet-300', amber: 'text-amber-300',
  teal: 'text-teal-300', emerald: 'text-emerald-300', rose: 'text-rose-300', slate: 'text-slate-300',
};
const TONE_DOT = {
  blue: 'bg-blue-400', violet: 'bg-violet-400', amber: 'bg-amber-400',
  teal: 'bg-teal-400', emerald: 'bg-emerald-400', rose: 'bg-rose-400', slate: 'bg-slate-400',
};

const SectionedConsole = ({ logs, activePhaseId, streaming, title = 'merlin · agent.activity.log', maxHeight = 'max-h-[640px]', defaultCollapsed = false }) => {
  const grouped = useMemo(() => {
    const g = {};
    PHASES.forEach(p => g[p.id] = []);
    logs.forEach(l => { if (g[l.phase]) g[l.phase].push(l); });
    return g;
  }, [logs]);

  const [collapsed, setCollapsed] = useState(() => {
    const init = {};
    PHASES.forEach(p => { init[p.id] = defaultCollapsed; });
    return init;
  });
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current && streaming) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs.length, streaming]);

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800/80 shadow-xl shadow-slate-900/10 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-950/70 border-b border-slate-800/80">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400/70"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70"></span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono ml-2 tracking-tight">{title}</div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[10px] text-slate-500 font-mono">{logs.length} events · {Object.values(grouped).filter(g => g.length).length}/6 phases</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${streaming ? 'bg-emerald-400 pulse-soft' : 'bg-slate-500'}`}></span>
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{streaming ? 'streaming' : 'idle'}</span>
          </div>
        </div>
      </div>
      <div ref={scrollRef} className={`p-3 ${maxHeight} overflow-y-auto scroll-fade`}>
        {PHASES.map((phase, idx) => {
          const entries = grouped[phase.id];
          const hasEntries = entries.length > 0;
          const isActive = activePhaseId === phase.id;
          const status = !hasEntries && !isActive ? 'pending' : (isActive && streaming ? 'active' : 'done');
          return (
            <PhaseSection
              key={phase.id}
              phase={phase}
              index={idx}
              entries={entries}
              status={status}
              collapsed={collapsed[phase.id]}
              onToggle={() => setCollapsed(c => ({ ...c, [phase.id]: !c[phase.id] }))}
              streaming={isActive && streaming}
            />
          );
        })}
      </div>
    </div>
  );
};

const PhaseSection = ({ phase, index, entries, status, collapsed, onToggle, streaming }) => {
  const statusLabel = status === 'done' ? `${entries.length} events` : status === 'active' ? `${entries.length} events · live` : 'pending';
  return (
    <div className="mb-2 last:mb-0">
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-2 px-2 py-2 rounded-md transition-colors text-left ${
          status === 'pending' ? 'opacity-50' : 'hover:bg-slate-800/40'
        }`}
      >
        <Icon name={collapsed ? 'chevRight' : 'chevDown'} className="w-3 h-3 text-slate-500 shrink-0" />
        <span className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
          status === 'done' ? 'bg-emerald-500/20 text-emerald-300' :
          status === 'active' ? `bg-${phase.tone}-500/20 ${TONE_TEXT[phase.tone]}` :
          'bg-slate-700/40 text-slate-500'
        }`}>
          {status === 'done' ? <Icon name="check" className="w-3 h-3" /> : <Icon name={phase.icon} className="w-3 h-3" />}
        </span>
        <span className="font-mono text-[10px] text-slate-500 shrink-0">P{index + 1}</span>
        <span className="font-semibold text-[11.5px] uppercase tracking-wider text-slate-200">{phase.label}</span>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-slate-500 shrink-0">
          {status === 'active' && <span className={`w-1.5 h-1.5 rounded-full ${TONE_DOT[phase.tone]} pulse-soft`}></span>}
          {statusLabel}
        </span>
      </button>
      {!collapsed && (
        <div className="ml-3 pl-4 border-l border-slate-800 mt-0.5 pb-1 space-y-2">
          {entries.length === 0 && status === 'pending' && (
            <div className="text-[11px] text-slate-600 font-mono italic py-1">awaiting agent dispatch…</div>
          )}
          {entries.length === 0 && status === 'active' && (
            <div className="text-[11px] text-slate-500 font-mono py-1">initializing<span className="blink">_</span></div>
          )}
          {entries.map((e, i) => (
            <LogEntry key={i} index={i + 1} entry={e} />
          ))}
          {streaming && entries.length > 0 && <div className="text-slate-600 font-mono text-[11px]"><span className="blink">▌</span></div>}
        </div>
      )}
    </div>
  );
};

const LogEntry = ({ index, entry }) => (
  <div className="fade-in">
    <div className="flex items-baseline gap-2">
      <span className="text-slate-700 font-mono text-[10px] w-5 shrink-0 text-right">{String(index).padStart(2, '0')}</span>
      <span className={`px-1.5 py-[1px] rounded text-[9.5px] font-semibold uppercase tracking-wider border shrink-0 ${TONE_BG[entry.tone]}`}>{entry.agent}</span>
      <span className="font-mono text-[11px] text-slate-400 truncate">{entry.sub}</span>
    </div>
    <div className="ml-7 mt-0.5 text-[12.5px] text-slate-300 leading-relaxed font-mono" dangerouslySetInnerHTML={{ __html: entry.msg.replace(/<b>/g, '<b class="text-slate-100 font-semibold">') }} />
  </div>
);

const ConsoleCollapsed = ({ count }) => (
  <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 text-center">
    <div className="w-12 h-12 mx-auto rounded-full gradient-bg-soft flex items-center justify-center text-blue-600 mb-3">
      <Icon name="eyeOff" className="w-5 h-5" />
    </div>
    <div className="text-[14px] font-semibold text-slate-900">Agent activity hidden</div>
    <div className="text-[12.5px] text-slate-500 mt-1">{count} agent events processed · toggle on to inspect</div>
  </div>
);

/* ============================================================
   CONTINUE BAR — bottom CTA replacing auto-advance
   ============================================================ */
const ContinueBar = ({ enabled, label, sub, onClick, secondary }) => (
  <div className="sticky bottom-0 z-30 -mx-6 px-6 pt-3 pb-4 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent">
    <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 shadow-md px-5 py-3.5">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-2 h-2 rounded-full shrink-0 ${enabled ? 'bg-emerald-500' : 'bg-amber-400 pulse-soft'}`}></div>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-slate-900 truncate">{enabled ? 'Stage complete · ready when you are' : 'Agents working…'}</div>
          {sub && <div className="text-[11.5px] text-slate-500 truncate">{sub}</div>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {secondary}
        <button
          onClick={enabled ? onClick : undefined}
          disabled={!enabled}
          className={`px-5 py-2.5 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-all ${
            enabled
              ? 'gradient-bg text-white shadow-sm hover:shadow-lg hover:shadow-blue-500/20'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {label} <Icon name="arrow" className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
);

/* ============================================================
   SCREEN 2 — ORCHESTRATION (planning + listing)
   ============================================================ */
const ArchPill = ({ icon, label, tone, active }) => {
  const tones = {
    blue: active ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-400 border-slate-200',
    violet: active ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-white text-slate-400 border-slate-200',
    amber: active ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-slate-400 border-slate-200',
    teal: active ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-white text-slate-400 border-slate-200',
    emerald: active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-400 border-slate-200',
    rose: active ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-white text-slate-400 border-slate-200',
  };
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all ${tones[tone]}`}>
      <Icon name={icon} className="w-3.5 h-3.5" />
      <span>{label}</span>
      {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-current pulse-soft"></span>}
    </div>
  );
};

const OrchestrationScreen = ({ scenario, auditTrail, appendAudit, onContinue }) => {
  const logs = useMemo(() => [...buildPlanningLogs(scenario), ...buildListingLogs(scenario)], [scenario]);
  const [visible, setVisible] = useState(0);
  const [showConsole, setShowConsole] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setVisible(i);
      appendAudit(logs[i - 1]);
      if (i >= logs.length) {
        clearInterval(id);
        setDone(true);
      }
    }, 520);
    return () => clearInterval(id);
  }, []);

  const planningCount = buildPlanningLogs(scenario).length;
  const activePhaseId = visible <= planningCount ? 'planning' : 'listing';
  const phaseLogsForConsole = auditTrail.slice(0); // entire trail so far

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.12fr] gap-6">
        <div className="space-y-5">
          <RequestSummary scenario={scenario} />

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl gradient-bg flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
                {done ? <Icon name="check" className="w-5 h-5" /> : <div className="w-5 h-5 rounded-full border-[2.5px] border-white/40 border-t-white animate-spin"></div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-slate-900 leading-tight">{done ? 'Vendor discovery complete · ready for negotiation' : 'Understanding your request & finding vendors…'}</div>
                <div className="text-[12px] text-slate-500 mt-0.5">Intent → Listing → Discovery → Shortlist</div>
              </div>
            </div>

            <div className="space-y-4">
              <ProgressGroup
                title="Intent & Planning"
                tone="blue"
                steps={[
                  { label: 'Parse request & classify intent',       threshold: 2 },
                  { label: 'Route to agent graph',                   threshold: 3 },
                  { label: 'Load session + 12-mo purchase memory',   threshold: 5 },
                  { label: 'Retrieve relevant policies (RAG)',       threshold: 7 },
                ]}
                visible={visible}
              />

              <ProgressGroup
                title="Listing & Discovery"
                tone="teal"
                steps={[
                  { label: `Discover ${scenario.discovered} vendor candidates`,  threshold: 8 },
                  { label: 'Enrich with credit · ESG · MSME data',               threshold: 11 },
                  { label: 'Apply eligibility filters → 6 finalists',            threshold: 12 },
                  { label: 'Rank by composite score → top 3 selected',           threshold: 14 },
                ]}
                visible={visible}
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50/60 to-teal-50/60 border border-blue-100/60 rounded-2xl p-5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-blue-600 shrink-0">
              <Icon name="sparkles" className="w-4 h-4" />
            </div>
            <div className="text-[13px] text-slate-700 leading-relaxed">
              <strong className="text-slate-900">Touchless by design.</strong> Listing alone replaces ~2 hours of manual sourcing per request — Merlin runs vendor discovery, credit/ESG/MSME checks, and ranking in parallel, then hands off a vetted top-3 to the negotiator.
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3 sticky top-[68px] z-10 bg-slate-50 py-1">
            <div className="flex items-center gap-2">
              <div className="text-[10.5px] uppercase tracking-[0.15em] font-semibold text-slate-500">Agent activity · live</div>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400">
                <span className="w-1 h-1 rounded-full bg-emerald-500 pulse-soft"></span>
                {visible}/{logs.length}
              </span>
            </div>
            <button
              onClick={() => setShowConsole(!showConsole)}
              className={`flex items-center gap-1.5 text-[11.5px] font-medium px-3 py-1.5 rounded-full transition-all ${
                showConsole ? 'bg-slate-900 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon name={showConsole ? 'eye' : 'eyeOff'} className="w-3.5 h-3.5" />
              {showConsole ? 'Hide agent activity' : 'Show agent activity'}
            </button>
          </div>
          {showConsole ? (
            <SectionedConsole logs={phaseLogsForConsole} activePhaseId={activePhaseId} streaming={!done} />
          ) : (
            <ConsoleCollapsed count={visible} />
          )}

          <div className="mt-3 grid grid-cols-4 gap-2">
            <ArchPill icon="human"    label="Supervisor" tone="blue"   active={visible >= 1} />
            <ArchPill icon="database" label="Memory"     tone="violet" active={visible >= 4} />
            <ArchPill icon="book"     label="Knowledge"  tone="amber"  active={visible >= 7} />
            <ArchPill icon="search"   label="Listing"    tone="teal"   active={visible >= 8} />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <ContinueBar
          enabled={done}
          onClick={onContinue}
          label="Continue to Negotiation Theater"
          sub={done ? 'Top 3 vendors selected · negotiator briefed' : `${visible}/${logs.length} agent events streamed · please wait`}
        />
      </div>
    </div>
  );
};

const ProgressGroup = ({ title, tone, steps, visible }) => {
  const dotCls = { blue: 'bg-blue-500', teal: 'bg-teal-500', violet: 'bg-violet-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500' }[tone];
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`}></span>
        <div className="text-[10.5px] uppercase tracking-[0.15em] font-semibold text-slate-500">{title}</div>
      </div>
      <ul className="space-y-2 pl-3.5 border-l border-slate-200">
        {steps.map((s, i) => {
          const isDone = visible >= s.threshold;
          const isActive = !isDone && visible >= (steps[i - 1]?.threshold ?? 0);
          return (
            <li key={i} className="flex items-center gap-2.5">
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold -ml-[22px] border-2 border-slate-50 transition-all ${
                isDone ? 'bg-emerald-500 text-white' : isActive ? `${dotCls} text-white ring-pulse` : 'bg-slate-200 text-slate-400'
              }`}>
                {isDone ? <Icon name="check" className="w-2 h-2" /> : ''}
              </span>
              <span className={`text-[13px] transition-colors ${isDone ? 'text-slate-900' : isActive ? 'text-slate-700' : 'text-slate-400'}`}>{s.label}</span>
              {isActive && <span className="ml-auto text-[10px] text-blue-600 font-medium tracking-wide uppercase shimmer px-1.5 py-0.5 rounded">working</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

/* ============================================================
   SCREEN 3 — NEGOTIATION (strategy + rounds)
   ============================================================ */
const NegotiationScreen = ({ scenario, auditTrail, appendAudit, onContinue }) => {
  const strategyLogs = useMemo(() => buildStrategyLogs(scenario), [scenario]);
  const numRounds = scenario.vendors[0].rounds.length;

  const [phase, setPhase] = useState('strategy');     // 'strategy' | 'rounds' | 'settled'
  const [strategyVisible, setStrategyVisible] = useState(0);
  const [roundIdx, setRoundIdx] = useState(-1);
  const [showConsole, setShowConsole] = useState(true);

  useEffect(() => {
    // Strategy stream
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setStrategyVisible(i);
      appendAudit(strategyLogs[i - 1]);
      if (i >= strategyLogs.length) {
        clearInterval(id);
        setTimeout(() => setPhase('rounds'), 500);
      }
    }, 520);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (phase !== 'rounds') return;
    const timeouts = [];
    let t = 200;

    for (let r = 0; r < numRounds; r++) {
      timeouts.push(setTimeout(() => {
        setRoundIdx(r);
        const activeVendors = scenario.vendors.filter(v => !(v.dropOutAfterRound != null && r > v.dropOutAfterRound + 1));
        appendAudit({ phase: 'rounds', agent: 'Negotiator', sub: 'round_coordinator()', tone: 'emerald',
          msg: `<b>Round ${r + 1}</b> opened · ${activeVendors.length} active vendor${activeVendors.length === 1 ? '' : 's'} · counters dispatched` });
      }, t));
      t += 700;

      scenario.vendors.forEach(v => {
        timeouts.push(setTimeout(() => {
          const isAlreadyDropped = v.dropOutAfterRound != null && r > v.dropOutAfterRound + 1;
          const justDropped = v.dropOutAfterRound != null && r === v.dropOutAfterRound + 1;
          if (isAlreadyDropped) return;
          if (justDropped) {
            appendAudit({ phase: 'rounds', agent: 'Negotiator', sub: 'walkaway_detector()', tone: 'rose',
              msg: `<b>${v.name}</b> withdrew from negotiation · signaled internal pricing floor reached` });
            return;
          }
          if (v.rounds[r] != null) {
            const drop = pctBelow(v.rounds[r], scenario.lastPrice);
            const isHittingFloor = v.hitFloor && r === numRounds - 1;
            appendAudit({ phase: 'rounds', agent: 'Vendor', sub: `${v.name.split(' ')[0].toLowerCase()}.counter_offer()`, tone: 'slate',
              msg: `<b>${v.name}</b> → <b>${formatINR(v.rounds[r])}</b>/${scenario.unitShort} · <b>${drop}%</b> below baseline${isHittingFloor ? ' <span class="text-amber-300">· floor reached</span>' : ''}` });
          }
        }, t));
        t += 220;
      });
      t += 350;
    }

    timeouts.push(setTimeout(() => {
      const w = scenario.vendors[scenario.winnerIndex];
      const wPrice = w.rounds[w.rounds.length - 1];
      const wPct = pctBelow(wPrice, scenario.lastPrice);
      appendAudit({ phase: 'rounds', agent: 'Negotiator', sub: 'round_coordinator.settle()', tone: 'emerald',
        msg: `<b>Deal locked</b> · winner <b>${w.name}</b> at <b>${formatINR(wPrice)}</b>/${scenario.unitShort} (${wPct}% below baseline)` });
      setPhase('settled');
    }, t));

    return () => timeouts.forEach(clearTimeout);
  }, [phase]);

  const currentBestPrice = useMemo(() => {
    if (roundIdx < 0) return scenario.lastPrice;
    const active = scenario.vendors.filter(v => !(v.dropOutAfterRound != null && roundIdx > v.dropOutAfterRound + 1));
    const prices = active.map(v => v.rounds[Math.min(roundIdx, v.rounds.length - 1)]).filter(p => p != null);
    if (!prices.length) return scenario.lastPrice;
    return Math.min(...prices);
  }, [roundIdx, scenario]);

  const activePhaseId = phase === 'strategy' ? 'strategy' : 'rounds';

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.15em] font-semibold text-blue-600 mb-1">Negotiation theater · live</div>
          <h2 className="text-[26px] font-bold text-slate-900 tracking-tight leading-tight">Negotiator agent + sub-agents at work</h2>
          <div className="text-[13px] text-slate-500 mt-1">{scenario.flavor}</div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className={`w-2 h-2 rounded-full ${phase === 'settled' ? 'bg-emerald-500' : 'bg-blue-500 pulse-soft'}`}></div>
          <div className="text-[12px] font-mono text-slate-600">
            phase <span className="text-slate-900 font-semibold">{phase}</span>
            {phase === 'rounds' && roundIdx >= 0 && <> · round <span className="text-slate-900 font-semibold">{Math.min(roundIdx + 1, numRounds)}</span> / {numRounds}</>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {scenario.vendors.map((v, vi) => (
          <VendorCard key={v.name} vendor={v} scenario={scenario} roundIdx={Math.max(0, roundIdx)} isWinner={phase === 'settled' && vi === scenario.winnerIndex} phase={phase} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1.4fr] gap-4">
        <PriceTracker scenario={scenario} currentBestPrice={currentBestPrice} phase={phase} />
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10.5px] uppercase tracking-[0.15em] font-semibold text-slate-500">Agent activity · live</div>
            <button
              onClick={() => setShowConsole(!showConsole)}
              className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full transition-all ${
                showConsole ? 'bg-slate-900 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon name={showConsole ? 'eye' : 'eyeOff'} className="w-3 h-3" />
              {showConsole ? 'Hide' : 'Show'}
            </button>
          </div>
          {showConsole ? (
            <SectionedConsole logs={auditTrail} activePhaseId={activePhaseId} streaming={phase !== 'settled'} title="merlin · negotiator.log" maxHeight="max-h-[460px]" defaultCollapsed={false} />
          ) : (
            <ConsoleCollapsed count={auditTrail.length} />
          )}
        </div>
      </div>

      <div className="mt-6">
        <ContinueBar
          enabled={phase === 'settled'}
          onClick={onContinue}
          label="Continue to Governance Gate"
          sub={phase === 'settled' ? 'Deal locked · awaiting policy check' : phase === 'strategy' ? 'Setting target & dispatching RFQs…' : `Round ${Math.min(roundIdx + 1, numRounds)} of ${numRounds} in progress`}
        />
      </div>
    </div>
  );
};

const VendorCard = ({ vendor, scenario, roundIdx, isWinner, phase }) => {
  const isDroppedOut = vendor.dropOutAfterRound != null && roundIdx > vendor.dropOutAfterRound;
  const lastValidRound = isDroppedOut ? vendor.dropOutAfterRound : Math.min(roundIdx, vendor.rounds.length - 1);
  const currentPrice = vendor.rounds[lastValidRound] ?? scenario.lastPrice;
  const prevPrice = lastValidRound === 0 ? scenario.lastPrice : (vendor.rounds[lastValidRound - 1] ?? scenario.lastPrice);
  const currentIdx = indexOf(currentPrice, scenario.lastPrice);
  const currentPctOff = pctBelow(currentPrice, scenario.lastPrice);
  const delta = prevPrice - currentPrice;
  const deltaPct = prevPrice ? ((delta / prevPrice) * 100).toFixed(1) : '0.0';

  return (
    <div className={`relative bg-white rounded-2xl border transition-all overflow-hidden ${
      isWinner ? 'border-emerald-300 shadow-lg shadow-emerald-100/60 ring-2 ring-emerald-100' :
      isDroppedOut ? 'border-slate-200 opacity-60 grayscale' :
      'border-slate-200 shadow-sm'
    }`}>
      {isWinner && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-400"></div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shadow-sm ${
              isWinner ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : `bg-gradient-to-br ${scenario.accent}`
            }`}>{vendor.name[0]}</div>
            <div>
              <div className="text-[14px] font-semibold text-slate-900 leading-tight">{vendor.name}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{vendor.location} · SLA {vendor.sla}</div>
            </div>
          </div>
          <StatusBadge isWinner={isWinner} isDroppedOut={isDroppedOut} phase={phase} />
        </div>

        <div className="flex items-center gap-1 mb-2">
          {[1,2,3,4,5].map(n => (
            <span key={n} className={`w-3 h-3 rounded-sm ${n <= Math.floor(vendor.rating) ? 'bg-amber-400' : n - 0.5 <= vendor.rating ? 'bg-amber-300' : 'bg-slate-200'}`}></span>
          ))}
          <span className="text-[11px] text-slate-500 ml-1.5 font-medium num-tab">{vendor.rating.toFixed(1)}</span>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">Crisil {vendor.credit}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">ESG {vendor.esg}</span>
          {vendor.msme && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700 font-medium">MSME</span>}
        </div>

        <div className={`rounded-xl p-3.5 ${isWinner ? 'bg-emerald-50/60' : isDroppedOut ? 'bg-slate-50' : 'gradient-bg-soft'}`}>
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Current offer</div>
              <div className={`text-[28px] font-bold num-tab leading-none ${isWinner ? 'text-emerald-700' : isDroppedOut ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                {formatINR(currentPrice)}
              </div>
              <div className="text-[10.5px] text-slate-500 mt-0.5">per {scenario.unitShort} · ×{scenario.quantity} · {currentPctOff > 0 ? <><b className="text-emerald-600 num-tab">▼ {currentPctOff}%</b> vs. baseline</> : 'opening'}</div>
            </div>
            {!isDroppedOut && delta > 0 && (
              <div className="flex items-center gap-1 text-[12px] font-semibold text-emerald-600 num-tab tick-down" key={`${vendor.name}-${roundIdx}`}>
                <Icon name="down" className="w-3.5 h-3.5" />
                {deltaPct}%
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1">
          {vendor.rounds.map((p, i) => {
            const isHere = i === roundIdx;
            const isPast = i < roundIdx;
            const isDropped = vendor.dropOutAfterRound != null && i > vendor.dropOutAfterRound;
            return (
              <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${
                isDropped ? 'bg-rose-200' :
                isWinner && i === vendor.rounds.length - 1 ? 'bg-emerald-500' :
                isHere ? 'bg-blue-500 pulse-soft' :
                isPast ? 'bg-blue-200' : 'bg-slate-200'
              }`}></div>
            );
          })}
        </div>

        {isDroppedOut && (
          <div className="mt-3 text-[11.5px] text-rose-600 font-medium flex items-center gap-1.5">
            <Icon name="flag" className="w-3.5 h-3.5" /> Withdrew after round {vendor.dropOutAfterRound + 1}
          </div>
        )}
      </div>
    </div>
  );
};

const StatusBadge = ({ isWinner, isDroppedOut, phase }) => {
  if (isWinner) return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500 text-white text-[10.5px] font-semibold tracking-wide">
      <Icon name="check" className="w-3 h-3" /> Winner
    </div>
  );
  if (isDroppedOut) return (
    <div className="px-2 py-1 rounded-full bg-rose-100 text-rose-700 text-[10.5px] font-semibold tracking-wide">Dropped out</div>
  );
  if (phase === 'settled') return (
    <div className="px-2 py-1 rounded-full bg-slate-100 text-slate-500 text-[10.5px] font-semibold tracking-wide">Not selected</div>
  );
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-[10.5px] font-semibold tracking-wide">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 pulse-soft"></span> Negotiating
    </div>
  );
};

const PriceTracker = ({ scenario, currentBestPrice, phase }) => {
  const targetPrice = Math.round(scenario.lastPrice * scenario.targetIndex / 100);
  const floorPrice = Math.round(scenario.lastPrice * scenario.floorIndex / 100);
  const baselineTotal = scenario.lastPrice * scenario.quantity;
  const currentBestTotal = currentBestPrice * scenario.quantity;
  const savedSoFar = baselineTotal - currentBestTotal;
  const pctOff = pctBelow(currentBestPrice, scenario.lastPrice);
  const minPrice = floorPrice * 0.98;
  const maxPrice = scenario.lastPrice * 1.02;
  const pct = Math.max(0, Math.min(100, ((maxPrice - currentBestPrice) / (maxPrice - minPrice)) * 100));
  const targetPct = ((maxPrice - targetPrice) / (maxPrice - minPrice)) * 100;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.15em] font-semibold text-slate-500">Best offer · ticking down</div>
          <div className="flex items-baseline gap-2 mt-1">
            <div className="text-[28px] font-bold text-slate-900 num-tab leading-none">{formatINR(currentBestPrice)}</div>
            <div className="text-[12px] text-slate-500">per {scenario.unitShort}</div>
          </div>
          <div className="text-[12px] text-slate-500 mt-1 num-tab">Order total: <span className="text-slate-900 font-semibold">{formatINR(currentBestTotal)}</span></div>
        </div>
        <div className="text-right">
          <div className="text-[10.5px] uppercase tracking-[0.15em] font-semibold text-emerald-600">Saved so far</div>
          <div className="text-[22px] font-bold text-emerald-600 num-tab leading-tight">{formatINR(savedSoFar)}</div>
          <div className="text-[11px] text-emerald-700/80 num-tab">{pctOff > 0 ? `${pctOff}% below baseline` : 'no movement yet'}</div>
        </div>
      </div>

      <div className="relative h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="absolute inset-y-0 left-0 gradient-bg transition-all duration-700 ease-out" style={{ width: `${pct}%` }}></div>
        <div className="absolute top-1/2 -translate-y-1/2 h-3 w-0.5 bg-slate-400" style={{ left: `${targetPct}%` }}></div>
      </div>
      <div className="flex justify-between mt-1.5 text-[10.5px] text-slate-500 num-tab">
        <span>baseline {formatINR(scenario.lastPrice)}</span>
        <span className="font-medium text-slate-700">target {formatINR(targetPrice)}</span>
        <span>floor {formatINR(floorPrice)}</span>
      </div>
    </div>
  );
};

/* ============================================================
   SCREEN 4 — GOVERNANCE (tier-based, no rupees)
   ============================================================ */
const GovernanceScreen = ({ scenario, totals, auditTrail, appendAudit, decision, setDecision, onContinue }) => {
  const govLogs = useMemo(() => buildGovernanceLogs(scenario, totals), [scenario, totals]);
  const [visible, setVisible] = useState(0);
  const [done, setDone] = useState(false);
  const [overrideRequested, setOverrideRequested] = useState(false);
  const [showConsole, setShowConsole] = useState(true);

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setVisible(i);
      appendAudit(govLogs[i - 1]);
      if (i >= govLogs.length) {
        clearInterval(id);
        setDone(true);
        if (!totals.requiresHuman) setDecision('auto-approved');
      }
    }, 550);
    return () => clearInterval(id);
  }, []);

  const handleApprove = () => {
    appendAudit({ phase: 'governance', agent: 'Governance', sub: 'human_approver.accept()', tone: 'emerald', message: 'Human approver accepted recommendation · proceeding to PO', msg: 'Human approver accepted recommendation · proceeding to PO' });
    setDecision('human-approved');
  };

  const handleOverride = () => {
    if (overrideRequested) return;
    appendAudit({ phase: 'governance', agent: 'Governance', sub: 'human_approver.override()', tone: 'amber', message: 'Override requested · negotiator re-briefed with stricter targets', msg: 'Override requested · negotiator re-briefed with stricter targets' });
    setOverrideRequested(true);
  };

  const canContinue = totals.requiresHuman ? (decision === 'human-approved') : done;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="text-center mb-6 fade-in">
        <div className="text-[10.5px] uppercase tracking-[0.15em] font-semibold text-blue-600 mb-2">Governance gate</div>
        <h2 className="text-[28px] font-bold text-slate-900 tracking-tight">Suite governs</h2>
        <p className="text-slate-500 mt-1 text-[14px]">Every deal is classified by tier and checked against your written policy before it can proceed.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-6">
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 fade-in">
            <div className="grid grid-cols-2 gap-5 mb-5">
              <div>
                <div className="text-[10.5px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Deal classification</div>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12.5px] font-semibold ${
                  totals.tier === 'material' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${totals.tier === 'material' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                  {totals.tier === 'material' ? 'Material Order Tier' : 'Standard Order Tier'}
                </div>
                <div className="text-[12px] text-slate-500 mt-2 leading-relaxed">{totals.tier === 'material' ? `Above ${formatINR(POLICY_THRESHOLD)} auto-approve cutoff · requires human-in-the-loop` : `Within ${formatINR(POLICY_THRESHOLD)} auto-approve cutoff · agent issues PO directly`}</div>
              </div>
              <div>
                <div className="text-[10.5px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Final deal total</div>
                <div className="text-[28px] font-bold text-slate-900 num-tab leading-none">{formatINR(totals.finalTotal)}</div>
                <div className="text-[12px] text-slate-500 mt-1 num-tab">{scenario.quantity} × {formatINR(totals.winner.rounds[totals.winner.rounds.length - 1])}/{scenario.unitShort}</div>
                <div className="text-[12px] text-emerald-700 font-medium num-tab mt-1">▼ {formatINR(totals.baselineTotal - totals.finalTotal)} ({totals.savingsPct}%)</div>
              </div>
            </div>

            <ThresholdBar dealTotal={totals.finalTotal} threshold={POLICY_THRESHOLD} />
          </div>

          {!totals.requiresHuman && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 fade-in">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/30">
                  <Icon name="check" className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="text-[18px] font-bold text-emerald-900">Auto-approved <span className="text-emerald-600 font-normal text-[14px]">· within policy</span></div>
                  <div className="text-[13.5px] text-emerald-800/80 mt-1.5 leading-relaxed">
                    Standard Order tier · no human approval required. Closer agent will draft the PO and notify <strong>{totals.winner.name}</strong>.
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-emerald-700">
                    <span className="px-2 py-0.5 bg-white/70 rounded-full font-mono">policy_check: pass</span>
                    <span className="px-2 py-0.5 bg-white/70 rounded-full font-mono">risk: 2.1/10</span>
                    <span className="px-2 py-0.5 bg-white/70 rounded-full font-mono">esg: pass</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {totals.requiresHuman && (
            <div className="bg-white rounded-2xl border-2 border-amber-200 shadow-sm overflow-hidden fade-in">
              <div className="bg-amber-50/70 px-6 py-3 border-b border-amber-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <Icon name="human" className="w-[18px] h-[18px]" />
                </div>
                <div>
                  <div className="text-[13.5px] font-semibold text-amber-900">Human approval required</div>
                  <div className="text-[11.5px] text-amber-800/70">Material Order tier · routed to category manager</div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <div className="text-[10.5px] uppercase tracking-wider text-slate-500 font-semibold mb-2">What the agent did</div>
                  <ul className="space-y-1.5 text-[13px] text-slate-700">
                    <li className="flex items-start gap-2"><Icon name="check" className="w-3.5 h-3.5 text-emerald-500 mt-1 shrink-0" /> Discovered {scenario.discovered} vendors · enriched, ranked, shortlisted top 3</li>
                    <li className="flex items-start gap-2"><Icon name="check" className="w-3.5 h-3.5 text-emerald-500 mt-1 shrink-0" /> Ran {scenario.vendors[0].rounds.length}-round negotiation · achieved {totals.savingsPct}% below baseline ({formatINR(totals.baselineTotal - totals.finalTotal)} saved)</li>
                    <li className="flex items-start gap-2"><Icon name="check" className="w-3.5 h-3.5 text-emerald-500 mt-1 shrink-0" /> Verified compliance (Crisil {totals.winner.credit} · ESG pass · {totals.winner.msme ? 'MSME ✓' : 'non-MSME'})</li>
                    {scenario.consolidationNote && (
                      <li className="flex items-start gap-2"><Icon name="sparkles" className="w-3.5 h-3.5 text-blue-500 mt-1 shrink-0" /> <span><strong className="text-slate-900">Insight:</strong> {scenario.consolidationNote}</span></li>
                    )}
                  </ul>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="text-[10.5px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Agent recommends</div>
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${scenario.accent} text-white flex items-center justify-center shadow-sm font-bold`}>
                      {totals.winner.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14.5px] font-semibold text-slate-900">{totals.winner.name}</div>
                      <div className="text-[11.5px] text-slate-500">{totals.winner.location} · SLA {totals.winner.sla} · ★ {totals.winner.rating}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[16px] font-bold text-slate-900 num-tab">{formatINR(totals.finalTotal)}</div>
                      <div className="text-[11px] text-emerald-600 font-medium num-tab">▼ {formatINR(totals.baselineTotal - totals.finalTotal)} ({totals.savingsPct}%)</div>
                    </div>
                  </div>
                </div>

                {overrideRequested && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 flex items-start gap-3 fade-in">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                      <Icon name="refresh" className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-[12.5px] text-amber-900 leading-relaxed">
                      <strong>Override registered.</strong> Negotiator has been re-briefed with stricter targets. You can still approve the current deal below.
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-1">
                  <button onClick={handleApprove} disabled={decision === 'human-approved'} className={`flex-1 px-5 py-3 rounded-xl text-[14px] font-semibold transition-all flex items-center justify-center gap-2 ${
                    decision === 'human-approved' ? 'bg-emerald-500 text-white' : 'gradient-bg text-white shadow-sm hover:shadow-lg hover:shadow-blue-500/20'
                  }`}>
                    <Icon name="check" className="w-4 h-4" /> {decision === 'human-approved' ? 'Approved' : 'Approve · issue PO'}
                  </button>
                  <button
                    onClick={handleOverride}
                    disabled={overrideRequested || decision === 'human-approved'}
                    className={`px-5 py-3 rounded-xl text-[14px] font-semibold border transition-all flex items-center gap-2 ${
                      overrideRequested || decision === 'human-approved'
                        ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                        : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <Icon name="refresh" className="w-4 h-4" /> {overrideRequested ? 'Override sent' : 'Override · re-negotiate'}
                  </button>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Icon name="shield" className="w-3 h-3" /> Approver: <span className="font-mono">priya.sharma@coca-cola.in</span> · routed via Suite governance
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10.5px] uppercase tracking-[0.15em] font-semibold text-slate-500">Agent activity · live</div>
            <button
              onClick={() => setShowConsole(!showConsole)}
              className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full transition-all ${
                showConsole ? 'bg-slate-900 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon name={showConsole ? 'eye' : 'eyeOff'} className="w-3 h-3" />
              {showConsole ? 'Hide' : 'Show'}
            </button>
          </div>
          {showConsole ? (
            <SectionedConsole logs={auditTrail} activePhaseId="governance" streaming={!done || (totals.requiresHuman && decision !== 'human-approved')} title="merlin · governance.log" maxHeight="max-h-[560px]" />
          ) : (
            <ConsoleCollapsed count={auditTrail.length} />
          )}
        </div>
      </div>

      <div className="mt-6">
        <ContinueBar
          enabled={canContinue}
          onClick={onContinue}
          label="Continue to Outcome"
          sub={canContinue ? (totals.requiresHuman ? 'Human-approved · finalizing PO' : 'Auto-approved · finalizing PO') : (totals.requiresHuman ? 'Awaiting your approval above' : 'Policy check in progress…')}
        />
      </div>
    </div>
  );
};

const ThresholdBar = ({ dealTotal, threshold }) => {
  const max = Math.max(dealTotal * 1.4, threshold * 1.6);
  const dealPct = (dealTotal / max) * 100;
  const thresholdPct = (threshold / max) * 100;
  const isOver = dealTotal >= threshold;
  return (
    <div>
      <div className="relative h-3 rounded-full bg-slate-100 overflow-visible">
        <div className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out ${isOver ? 'bg-gradient-to-r from-amber-400 to-rose-400' : 'bg-gradient-to-r from-emerald-400 to-teal-400'}`} style={{ width: `${dealPct}%` }}></div>
        <div className="absolute top-1/2 -translate-y-1/2 h-5 w-0.5 bg-slate-700" style={{ left: `${thresholdPct}%` }}>
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-slate-700 whitespace-nowrap">policy</div>
        </div>
        <div className="absolute -bottom-5 text-[10.5px] font-semibold num-tab whitespace-nowrap" style={{ left: `calc(${dealPct}% - 30px)`, color: isOver ? '#b45309' : '#047857' }}>
          {formatINR(dealTotal)}
        </div>
      </div>
      <div className="flex justify-between mt-7 text-[10.5px] text-slate-400 num-tab">
        <span>₹0</span>
        <span className="font-medium text-slate-500">threshold {formatINR(threshold)}</span>
        <span>{formatINRShort(max)}</span>
      </div>
    </div>
  );
};

/* ============================================================
   SCREEN 5 — OUTCOME (no rupees · full audit · closure)
   ============================================================ */
const OutcomeScreen = ({ scenario, totals, auditTrail, decision, onReset, appendAudit }) => {
  const closureLogs = useMemo(() => buildClosureLogs(scenario, totals), [scenario, totals]);
  const [appended, setAppended] = useState(false);

  useEffect(() => {
    if (appended) return;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      appendAudit(closureLogs[i - 1]);
      if (i >= closureLogs.length) {
        clearInterval(id);
        setAppended(true);
      }
    }, 400);
    return () => clearInterval(id);
  }, []);

  const dropOutVendor = scenario.vendors.find(v => v.dropOutAfterRound != null);
  const hitFloor = scenario.vendors.some(v => v.hitFloor);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="text-center mb-8 fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700 mb-4">
          <Icon name="check" className="w-3.5 h-3.5" />
          DEAL CLOSED · PO ISSUED
          {decision === 'human-approved' && <span className="text-emerald-600/70">· human-approved</span>}
          {decision === 'auto-approved' && <span className="text-emerald-600/70">· auto-approved</span>}
        </div>
        <h2 className="text-[32px] font-bold text-slate-900 tracking-tight">You saved <span className="gradient-text num-tab">{formatINR(totals.baselineTotal - totals.finalTotal)}</span> <span className="text-slate-400 font-normal">·</span> {totals.savingsPct}% below baseline</h2>
        <p className="text-slate-500 mt-1.5 text-[14px]">Procured from <span className="font-medium text-slate-700">{totals.winner.name}</span> · {scenario.quantity} {scenario.unitLabel} @ <span className="font-medium text-slate-700 num-tab">{formatINR(totals.winner.rounds[totals.winner.rounds.length - 1])}/{scenario.unitShort}</span></p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
        <OutcomeStat
          icon="rupee" accent="from-emerald-500 to-teal-500"
          label="Savings"
          value={formatINR(totals.baselineTotal - totals.finalTotal)}
          sub={`${totals.savingsPct}% below baseline`}
          extra={<span className="text-emerald-600 font-medium num-tab">{formatINR(totals.baselineTotal)} → {formatINR(totals.finalTotal)}</span>}
        />
        <OutcomeStat
          icon="clock" accent="from-blue-500 to-indigo-500"
          label="Time saved"
          value="Touchless"
          sub="no buyer hours needed"
          extra={<span className="text-blue-600 font-medium">agent handled end-to-end</span>}
        />
        <OutcomeStat
          icon={scenario.iconKey} accent={scenario.accent}
          label="Vendor"
          value={totals.winner.name}
          sub={`★ ${totals.winner.rating} · ${totals.winner.location} · SLA ${totals.winner.sla}`}
          extra={<span className="text-slate-500 font-medium">Crisil {totals.winner.credit} · ESG pass{totals.winner.msme ? ' · MSME' : ''}</span>}
        />
        <OutcomeStat
          icon="shield" accent="from-violet-500 to-fuchsia-500"
          label="Compliance"
          value="Verified"
          sub="MSME · ESG · GST · policy"
          extra={<span className="text-violet-600 font-medium">{totals.tier === 'material' ? 'Material tier · human-approved' : 'Standard tier · auto-approved'}</span>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="text-[10.5px] uppercase tracking-wider text-slate-500 font-semibold mb-3">Deal summary</div>
            <dl className="space-y-2.5 text-[13px]">
              <Row label="Item" value={scenario.item} />
              <Row label="Quantity" value={`${scenario.quantity} ${scenario.unitLabel}`} />
              <Row label="Baseline price" value={`${formatINR(scenario.lastPrice)}/${scenario.unitShort}`} />
              <Row label="Final price" value={`${formatINR(totals.winner.rounds[totals.winner.rounds.length - 1])}/${scenario.unitShort}`} highlight />
              <Row label="Order total" value={formatINR(totals.finalTotal)} highlight />
              <Row label="Savings" value={`${formatINR(totals.baselineTotal - totals.finalTotal)} · ${totals.savingsPct}%`} highlight />
              <Row label="Vendor" value={`${totals.winner.name} · ${totals.winner.location}`} />
              <Row label="Tier" value={totals.tier === 'material' ? 'Material Order' : 'Standard Order'} />
              <Row label="Approval path" value={decision === 'human-approved' ? 'Human-approved' : 'Auto-approved'} />
              <Row label="Risk score" value="2.1 / 10 (low)" />
            </dl>
          </div>

          {(dropOutVendor || hitFloor || scenario.consolidationNote) && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="text-[10.5px] uppercase tracking-wider text-slate-500 font-semibold mb-3 flex items-center gap-1.5">
                <Icon name="sparkles" className="w-3.5 h-3.5 text-blue-500" /> Agent insights
              </div>
              <ul className="space-y-2.5 text-[12.5px] text-slate-700">
                {dropOutVendor && (
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0"></span>
                    <span><strong className="text-slate-900">{dropOutVendor.name}</strong> withdrew mid-negotiation. Walkaway detector flagged it · remaining 2 vendors competed harder.</span>
                  </li>
                )}
                {hitFloor && (
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0"></span>
                    <span>Negotiation hit a <strong className="text-slate-900">market floor</strong>. Further pressure risked SLA quality — agent stopped and locked the deal.</span>
                  </li>
                )}
                {scenario.consolidationNote && (
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></span>
                    <span><strong className="text-slate-900">Consolidation opportunity:</strong> {scenario.consolidationNote}</span>
                  </li>
                )}
              </ul>
            </div>
          )}

          <button onClick={onReset} className="w-full gradient-bg text-white px-5 py-4 rounded-2xl text-[15px] font-semibold shadow-sm hover:shadow-lg hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2">
            <Icon name="refresh" className="w-4 h-4" />
            Start new request
          </button>
        </div>

        <AuditPanel auditTrail={auditTrail} />
      </div>
    </div>
  );
};

const OutcomeStat = ({ icon, accent, label, value, sub, extra }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
    <div className="flex items-center gap-2.5 mb-3">
      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${accent} text-white flex items-center justify-center shadow-sm`}>
        <Icon name={icon} className="w-[18px] h-[18px]" />
      </div>
      <div className="text-[10.5px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
    </div>
    <div className="text-[22px] font-bold text-slate-900 num-tab leading-tight truncate">{value}</div>
    <div className="text-[12px] text-slate-500 mt-0.5 truncate">{sub}</div>
    {extra && <div className="text-[11px] mt-2 num-tab truncate">{extra}</div>}
  </div>
);

const Row = ({ label, value, highlight }) => (
  <div className="flex items-start justify-between gap-4 py-1">
    <dt className="text-slate-500 shrink-0">{label}</dt>
    <dd className={`text-right ${highlight ? 'font-semibold text-slate-900' : 'text-slate-700'} num-tab`}>{value}</dd>
  </div>
);

/* ============================================================
   AUDIT PANEL — bifurcated by phase, light theme
   ============================================================ */
const PHASE_LIGHT_BG = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  teal: 'bg-teal-50 text-teal-700 border-teal-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  slate: 'bg-slate-50 text-slate-600 border-slate-200',
};

const AuditPanel = ({ auditTrail }) => {
  const grouped = useMemo(() => {
    const g = {};
    PHASES.forEach(p => g[p.id] = []);
    auditTrail.forEach(e => { if (g[e.phase]) g[e.phase].push(e); });
    return g;
  }, [auditTrail]);

  const [collapsed, setCollapsed] = useState({});

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-fit lg:max-h-[820px] flex flex-col">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50/50 to-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
            <Icon name="doc" className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[13.5px] font-semibold text-slate-900">Full audit trail · 6 phases</div>
            <div className="text-[11px] text-slate-500">{auditTrail.length} agent events · timestamped · immutable</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
          <Icon name="shield" className="w-3 h-3 text-emerald-600" />
          <span className="text-[10.5px] font-semibold text-emerald-700 tracking-wide">SOX-READY</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scroll-fade p-3">
        {PHASES.map((phase, pIdx) => {
          const entries = grouped[phase.id];
          if (entries.length === 0) return null;
          const isCollapsed = collapsed[phase.id] ?? false;
          return (
            <div key={phase.id} className="mb-3 last:mb-0">
              <button
                onClick={() => setCollapsed(c => ({ ...c, [phase.id]: !isCollapsed }))}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-slate-50 transition-colors text-left"
              >
                <Icon name={isCollapsed ? 'chevRight' : 'chevDown'} className="w-3 h-3 text-slate-400 shrink-0" />
                <span className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border ${PHASE_LIGHT_BG[phase.tone]}`}>
                  <Icon name={phase.icon} className="w-3 h-3" />
                </span>
                <span className="font-mono text-[10px] text-slate-400 shrink-0">P{pIdx + 1}</span>
                <span className="font-semibold text-[11.5px] uppercase tracking-wider text-slate-700">{phase.label}</span>
                <span className="ml-auto text-[10.5px] font-mono text-slate-400">{entries.length} events</span>
              </button>
              {!isCollapsed && (
                <div className="ml-3 pl-4 border-l border-slate-200 mt-1 space-y-2">
                  {entries.map((e, i) => (
                    <div key={i} className="flex items-start gap-2.5 py-1">
                      <div className="text-[10.5px] font-mono text-slate-400 mt-0.5 shrink-0 w-16">{e.ts}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9.5px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${PHASE_LIGHT_BG[phase.tone]}`}>{e.agent}</span>
                          <span className="font-mono text-[10.5px] text-slate-500 truncate">{e.sub}</span>
                        </div>
                        <div className="text-[12.5px] text-slate-700 leading-relaxed mt-0.5" dangerouslySetInnerHTML={{ __html: (e.msg || e.message || '').replace(/<b>/g, '<b class="text-slate-900 font-semibold">') }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50/60 text-[10.5px] text-slate-500 font-mono flex items-center justify-between">
        <span>session_id: <span className="text-slate-700">mer-{4912 + (scenarioOrEmpty(auditTrail))}</span></span>
        <span>signed by · merlin@zycus</span>
      </div>
    </div>
  );
};

const scenarioOrEmpty = (trail) => trail.length;

/* ============================================================
   MOUNT
   ============================================================ */
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
