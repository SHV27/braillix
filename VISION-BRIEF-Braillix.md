# VISION BRIEF — Braillix (Software)

From: Shaurya (Showie), founder · To: the studio team (Claude Code + studio-* skills)
Captured 20 August 2026, 01:00 IST

---

## READ THIS FIRST — instructions for the team

This is my intent and my constraints. It is **NOT** a spec, **NOT** a stack choice, **NOT** a
design, **NOT** an architecture. Nothing below has been pre-decided for you except what I
explicitly state as a hard constraint.

Run your own full pipeline starting from research:

1. `studio-recon` — research this domain live. Refreshable braille displays, braille/math
   encoding, handwritten-math recognition, and how software normally drives stepper/cam
   actuators. Do not assume anything below is complete or current.
2. `studio-boardroom` — debate the features and pick the pillars yourself. I have not
   pre-selected them.
3. `studio-architecture` — choose and lock the stack yourself, live-verified.
4. `studio-constitution` → `studio-arcs` — set the project up and plan the build.
5. Build in arcs, closing each with `studio-verify`, following the Autonomy Charter at the
   bottom so you do not need to come back to me except for the escalation list.

**Do not skip stages on the assumption this brief already decided them. It didn't.**

### The one document that is ground truth

`SOFTWARE_TEAM_README` (the Braillix Software Team Handoff) is the real, current spec of the
hardware I have to drive. **Read it before anything else.** It should be sitting in this same
folder — if it isn't, stop and ask me for it once.

Explicitly superseded, do not build from them:
- the two older "Full Project Plan" documents (human-friendly and technical/AI-ready). They
  are 4–5 months old, written for our first panel evaluation, and describe a single-cell,
  Raspberry-Pi-and-solenoid era system we have moved past. Their mechanical reasoning is
  historically interesting; their system design is dead.
- `VisionMaths` — a different team's (our seniors') capstone proposal. Not a predecessor,
  not a reference, not something to stay compatible with. Different actuation, different
  architecture, different display model. Do not let it shape anything.

---

## THE DREAM

Braillix is a refreshable braille display that lets a visually impaired student read
mathematics with their hands, built cheap enough to actually reach Indian schools for the
blind. My half of it is the software: everything from "here is a math expression" through to
"the right dots are raised on the right cells."

I want all three of these to be real, not one of them:

- **type or input a math expression → the dots move, live**
- **a proper app/website flow — learn, practice, feedback — with the braille display as its
  output**
- **a camera photo of handwritten math → it gets read → the dots move**

The thing I care about most: **the software has to be complete and working entirely on its
own.** If hardware integration doesn't happen in time, I still need to be able to show the
software and have it genuinely work, end to end, with nothing plugged in. That is not a
fallback mode I'm asking for grudgingly — it is the primary requirement. Integration on top
of that is a bonus that will get handled.

And I want it to be studio-grade. This is going in front of a capstone panel and it is my
name on it. I don't want my work to draw criticism.

## SUCCESS, IN MY WORDS

- The software is complete in itself and runs smoothly, whatever happens with hardware.
- When integration does happen, it goes cleanly — no nasty surprises later in the product's
  life because of a decision made now.
- Nothing about it invites criticism. It should look and feel like real work, not a student
  demo.

## WHO TOUCHES IT

- **Audience:** primarily me, on my laptop, for the demo — but my teammates need to be able
  to run it too, so it can't depend on secret knowledge that lives only in my head.
- **Data sensitivity:** not specified. Treat any student input as if it might be a real
  person's work and don't do anything careless with it; if you hit a real fork here, log the
  call in `DECISIONS.md`.

## BOUNDARIES I DREW

**Must matter most — my words:**
> "I want software apne aap mein complete ho entirely — like integration nhi bhi hogi will be
> handled, but I need software apne aap mein toh kaam karna hi chahiye kuch bhi ho jaye chahe."

Alongside that, the thing I flagged hardest myself:

**It must adapt to any number of cells — 1, 2, 3, or many.** The hardware team is building
one cell right now, and more will be stacked on over time. On a single cell an equation
obviously can't be shown all at once. When we took this to the blind school, the feedback we
got was clear: reading a whole expression through a single cell is very difficult. So the
hardware is deliberately being designed so cells can stack — and the software has to simply
adjust to however many cells exist, without being rewritten each time. Do not hardcode a cell
count anywhere, at any layer, including the parts that only ever run on my laptop.

**Explicitly not-now:** nothing is off the table. I did not exclude anything. That does not
mean everything is equally important — read the priority I stated above and let your own
boardroom decide what earns time.

**Time shape:** brutal. It is 01:00 on 20 August. I need the software work done by **11:00 on
21 August**, because our capstone panel evaluation is **early morning on 22 August**, where we
have to show a near-final working product. The panel gives feedback and there is a final demo
roughly a month later for improvements. I will not be sitting next to you for most of this —
I'll leave the laptop running and go study. Work continuously; don't idle waiting on me.

## CONSTRAINTS ONLY I KNOW

- **Money:** free tiers only, for now. If something genuinely needs paid access, that is an
  escalation, not a decision you make.
- **My scope:** I own the software side — everything that counts as software falls to me,
  including whatever runs on the controller if that's software's job. Hardware/software
  integration itself is a collaborative effort with the hardware team.
- **Hardware that will physically exist by 22 August:** most likely exactly **one working
  cell**. Plan for that reality, and for the software being demoed with zero hardware
  attached.
- **Existing assets:** there is already working code referenced in the handoff — a Grade-1
  text-to-braille converter and a working single-cell controller sketch. Reuse rather than
  rewrite where it makes sense, but **the new software lives in a NEW repository of its own.**
  Do not restructure or damage the existing hardware/firmware repo.
- **Version control:** I want a GitHub repo created for the software and maintained properly
  *as we go* — real commits throughout the build, not one dump at the end. If you need
  credentials or a `gh` login to do this, ask once, in one message, with exact baby-step
  instructions.
- **Where it must run:** my laptop, reliably, offline-capable enough to demo in a room where
  the Wi-Fi may not cooperate. Teammates should be able to run it on theirs.

## TASTE ANCHOR

None given. I don't have a reference in my head for this. **Find your own references during
recon and decide the direction yourself** (`studio-taste`) — but the bar is studio-grade. It
should not look like a college project.

## ANYTHING ELSE I FLAGGED

- The single biggest fear: showing up on the 22nd with something that doesn't run. Everything
  else is secondary to that.
- The second fear: an integration that half-works and creates problems for the product later.
  Make the seam between software and hardware clean and honest, whatever form it takes.
- I am effectively doing the software side alone. Two other people are on software on paper,
  but both are busy. Assume no human help arrives.

## UNSPECIFIED (I skipped or didn't fully answer these — team decides, log the call in `DECISIONS.md`)

- **A discrete "must-have three."** I answered with one overriding principle (software
  complete on its own) rather than three separable features. The team must derive its own
  prioritised three during boardroom and log the reasoning.
- **Data sensitivity tier.**
- **Taste anchor / visual direction** — entirely the team's call.
- **Which controller-side work counts as "software" and therefore mine** — resolve it the safe
  way: make the laptop-side complete and self-sufficient regardless of who writes what runs on
  the board.

---

## THE AUTONOMY CHARTER

I want to be interrupted **only** for:

1. Spending real money / exceeding a free tier.
2. Deleting or migrating existing data, or anything irreversible — including anything that
   touches the existing hardware/firmware repo.
3. Publishing publicly for the first time.
4. A genuine product-direction fork where both branches are expensive.
5. A missing credential — ask once, in one message, with exact baby-step instructions for
   where to get it.

Everything else — library choices, naming, copy, missing assets, design judgment, ambiguity,
scope questions, what to do when something fails twice — decide it, log it in `DECISIONS.md`,
keep moving. I am not available for back-and-forth. I am trusting the team's expertise exactly
like a founder trusts a real team.

Keep `PROGRESS.md` current enough that a fresh session can pick up cold, because sessions will
be interrupted by usage limits and I will be away from the laptop.

---

## LAUNCH INSTRUCTIONS (for Shaurya — do not remove this section)

1. Make a folder. Drop **this file** and **`SOFTWARE_TEAM_README.pdf`** inside it. Open Claude
   Code there.
2. Paste:

   > Read VISION-BRIEF-Braillix.md and SOFTWARE_TEAM_README.pdf. Run the full studio-pipeline
   > starting from research — do your own recon, boardroom, and architecture review; this brief
   > tells you my intent and constraints, not the design. Then build it in arcs, following the
   > Autonomy Charter in the brief so you don't need to come back to me except for the
   > escalation list.

3. After any break or limit reset:

   > read PROGRESS.md and continue.
