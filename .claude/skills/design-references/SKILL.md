---
name: design-references
description: Library of real DESIGN.md files (74 companies — Stripe, Linear, Vercel, Apple, Airbnb, Figma, Notion, Nike, Tesla, etc.) analyzing actual production design languages: tokens, type scales, spacing, motion, component rules. Use to ground a design decision in how a specific real product actually solves it, instead of an invented or generic-AI default — e.g. "make this feel like Linear" or "what does Stripe do for form errors".
---

# Design References (Awesome DESIGN.md)

Source: https://github.com/voltagent/awesome-design-md — curated `DESIGN.md` analyses of real
companies' shipped design systems (the `DESIGN.md` convention comes from Google Stitch: a
plain-text file a design agent reads to reproduce a visual language).

Each `references/<company>/` folder contains a `DESIGN.md` (colors, type scale, spacing, motion,
component conventions extracted from the real product) and usually a `README.md`.

## When to use this

- The user names a real product as a reference point ("je veux un style Linear", "quelque chose
  comme Stripe", "nav bar façon PLB/Apple") — read that company's `DESIGN.md` before inventing an
  interpretation from memory.
- You want to check how a mature product actually solves a concrete problem (empty states, form
  errors, dense data tables, dark mode tokens) instead of guessing.
- Combined with [[taste-skill]] / [[impeccable]] for anti-generic execution: this folder answers
  "what does the real thing look like", the other skills answer "how do I build it without it
  reading as AI-generated".

## How to use it

1. `ls references/` to see the available companies (`stripe`, `linear.app`, `vercel`, `apple`,
   `airbnb`, `figma`, `notion` is not listed — check the actual folder name before assuming).
2. Read the matching `references/<company>/DESIGN.md` directly — it is plain markdown, no tooling
   needed.
3. Treat it as **inspiration and grounding**, not a license to copy verbatim: adapt the tokens/
   rules to Titan Kinetic's own palette and content, the same way [[taste-skill]] treats brand
   references — reproduce the *language*, not a clone of the source brand.

## Available companies

airbnb, airtable, apple, binance, bmw, bmw-m, bugatti, cal, claude, clay, clickhouse, cohere,
coinbase, composio, cursor, dell-1996, elevenlabs, expo, ferrari, figma, framer, hashicorp, hp,
ibm, intercom, kraken, lamborghini, linear.app, lovable, mastercard, meta, minimax, mintlify,
miro, mistral.ai, mongodb, nike, nintendo-2001, notion, nvidia, ollama, opencode.ai, pinterest,
playstation, posthog, raycast, renault, replicate, resend, revolut, runwayml, sanity, sentry,
shopify, slack, spacex, spotify, starbucks, stripe, supabase, superhuman, tesla, theverge,
together.ai, uber, vercel, vodafone, voltagent, warp, webflow, wired, wise, x.ai, zapier.

(Run `ls references/` for the exact current list — this repo gets updated upstream.)
