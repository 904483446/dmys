# Homepage Experience Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the VibeVerify homepage into a responsive, evidence-first SaaS landing page without changing its existing route or CTA behavior.

**Architecture:** Keep `app/page.tsx` as a Server Component and preserve the `/new` link. Add semantic homepage sections and page-scoped CSS classes to `styles.css`; no API, state, or dependency changes.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, native CSS.

---

### Task 1: Lock the homepage content contract

**Files:**
- Modify: `apps/web/src/app/page.test.tsx`
- Modify: `apps/web/src/app/page.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
expect(html).toContain('验收结论');
expect(html).toContain('证据链');
expect(html).toContain('开始验收');
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @vibeverify/web test -- page.test.tsx`

Expected: FAIL because the existing homepage has none of the new evidence-first labels.

- [ ] **Step 3: Implement semantic homepage sections**

Keep the existing `Link` destination `/new`; replace the single hero/demo sequence with a hero copy block, a product-preview panel, and an evidence explainer section. Use headings and text already consistent with the product: “验收结论”, “证据链”, and “开始验收”.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @vibeverify/web test -- page.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/page.tsx apps/web/src/app/page.test.tsx
git commit -m "feat(web): restructure homepage content"
```

### Task 2: Implement responsive visual system

**Files:**
- Modify: `apps/web/src/app/styles.css`

- [ ] **Step 1: Write the failing visual assertion**

Add class assertions to `apps/web/src/app/page.test.tsx` for `home-hero`, `home-preview`, and `home-evidence`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @vibeverify/web test -- page.test.tsx`

Expected: FAIL because those classes do not exist in the markup.

- [ ] **Step 3: Implement CSS**

Define a contained two-column desktop grid, a single-column layout below 760px, separate display/body typography, stable two-line headline wrapping, high-contrast CTA states, and reduced-motion fallback. Do not alter generic report styles.

- [ ] **Step 4: Verify**

Run:

```bash
pnpm --filter @vibeverify/web test -- page.test.tsx
pnpm --filter @vibeverify/web typecheck
pnpm --filter @vibeverify/web build
```

Expected: all commands pass.

- [ ] **Step 5: Visual check and commit**

Inspect desktop and 390px-wide browser screenshots. Confirm no one-character Chinese headline lines, no horizontal scrolling, and that “开始验收” remains visible.

```bash
git add apps/web/src/app/styles.css apps/web/src/app/page.tsx apps/web/src/app/page.test.tsx
git commit -m "feat(web): polish responsive homepage experience"
```
