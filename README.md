# Merlin · Tail-Spend Agent

A clickable prototype of an autonomous, multi-agent procurement system for **tail spend** — built for a Zycus product round.

**Tagline:** *AI decides · Suite governs · Enterprise stays in control.*

## What it shows

A single touchless flow across 5 screens:

1. **Intake** — plain-English request (free text or pre-filled chip).
2. **Orchestration** — Supervisor / Memory / Knowledge (RAG) / Tools / Negotiator agents work the request live, streamed into an *Agent Activity* console (toggleable for business vs. technical viewers).
3. **Negotiation Theater** — 3 vendor cards animate through multiple rounds; price ticks down toward a target; one vendor may drop out.
4. **Governance Gate** — deal compared against the policy threshold (₹50,000). Under → auto-approved. Over → human-in-the-loop with Approve / Override.
5. **Outcome + Audit** — savings, time saved, vendor, compliance + a full timestamped audit trail.

5 scripted scenarios demonstrate range: small auto-approve, large human-approval, vendor walkaway, market-floor negotiation, IT consolidation insight.

## Run it

```bash
# Just open the file
open index.html
```

Or deploy to Netlify / Vercel by dragging this folder in — it's a single self-contained `index.html` (React via CDN + Tailwind via CDN, no build step).

## Stack

- React 18 (UMD CDN)
- Tailwind CSS (Play CDN)
- Babel Standalone (in-browser JSX)
- No backend, no LLM call, no auth — all animations are scripted and deterministic.
