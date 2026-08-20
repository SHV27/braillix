# VISION BRIEF v2 — BRAILLIX (Software)

From: Shaurya (Showie), founder · To: the studio team (Claude Code + studio-* skills)
Captured 21 August 2026, early morning IST
**This brief REPLACES the earlier `VISION-BRIEF-Braillix.md` completely.**

---

## READ THIS FIRST — instructions for the team

A version of this software already exists (deployed, tested, documented). **I have looked at it
and it is not the product I asked for.** This brief exists to correct the vision, not to extend
that build.

Your instructions:

1. **Inherit zero product bias from what exists.** Do not open the old app and iterate on its
   screens, its feature list, its workflows or its vocabulary. Do not treat any of its
   existing features as a floor. Start the product thinking from nothing.
2. Run the full pipeline properly: `studio-recon` → `studio-boardroom` → `studio-architecture`
   → `studio-constitution` → `studio-arcs` → build in arcs, each closed with `studio-verify`.
   **Recon must go to the user level**, not just the technology level: who is the teacher, what
   is a real classroom hour like, what does a real blind-school maths lesson actually look
   like in India, what do existing devices cost and where do they fail people. Real market and
   user analysis, live.
3. **Use the Chrome DevTools MCP throughout.** Do not declare anything working because a unit
   test passed. Drive the real app in a real browser, click the real buttons, watch the real
   console, and prove each thing works the way a teacher would experience it. "It works" means
   you watched it work.
4. **Whether any part of the existing codebase is salvageable is entirely your call**, made
   after your own review, with the clock as the deciding factor. Reuse something only if your
   own verification proves it is correct and it fits the product *you* design — never because
   it already exists. If starting a piece from scratch is better, **hesitate zero percent.**
5. There is no check-in. Work continuously until the deadline or the usage limit. Keep
   `PROGRESS.md` current so a fresh session resumes cold from "read PROGRESS.md and continue."

---

## THE DREAM — in my words, because this is the part that got lost

**The app has to become the teacher's blackboard.**

> "jaise maths hum seekhte hain hamare teachers blackboard pe sikhate, similarly ussi
> intensity se utne hi ache se with our software voh teachers bhi apne bachon ko sab sikha
> payein"

Think about how anyone actually learns maths. A teacher stands at a blackboard. She writes a
proper question — a statement sum, a worded problem, a full equation. She works through it,
line by line, explaining as she goes. The student follows the *whole thing*: the question, the
steps, the answer.

> "ab aise toh hota nhi bass equation likh ke chor deta hai teacher, toh buddy how can
> students learn when jab hamari app bhi sirf utna kar payegi"

That is the failure of what was built. It displays *an expression*. Displaying an expression is
not teaching maths. A blind child sitting in that classroom needs to receive what a sighted
child receives off the blackboard — the whole lesson, as it is being taught, live.

So: **whatever the teacher wants to teach, at that moment, she can put it on the child's
fingers.** She writes it, or types it, or scans it straight out of the textbook she is
teaching from, or any other way that is easy — and it appears on the child's cells, synced,
immediately.

> "teacher ka blackboard bann jaye ye app bass ye chahiye, aur synced cells ki help se bache
> blackboard read kar payein, jaise apne yahaan proper likhte blackboard pe teachers jo mann
> mein aaye vaisa hi banne kaam"

**Why it matters to me:**

> "bache samjh payein seekh payein, and kabhi bhi teacher jo kuch sikhana chahe sikha paye…
> problem hi yahi hai ye bache ache se nhi maths seekh paate and current devices bhi bade
> costly hote hain. I want to change their lives for good, my whole capstone team wants to."

## WHO IT IS FOR — and the bar this sets

**The teacher.** A maths teacher at an Indian school for the blind. Assume she is
**not technical at all**:

> "voh simple whatsapp, youtube, facebook use karne wale log hain"

That is the entire usability bar. If a person who only uses WhatsApp, YouTube and Facebook
cannot pick this up and teach a lesson with it without being trained, it has failed —
regardless of how good the engineering underneath is. Typing maths should feel like typing on
WhatsApp or using a calculator. Scanning a page should feel like Google Lens.

> "app super easy to use banne, intuitive ho, use karna bahut easy, for non tech savy to like
> bilkul hi jinhe sirf whatsapp facebook aata hai unke liye"

> "app teachers ko samjh aaye kaise use karni hai"

**The student.** A blind child, any class. Universal:

> "universal si cheez banne ki kisi bhi class ke bache ko koi bhi teacher maths sikha paye
> isse"

## WHAT WAS BUILT AND WHY IT MISSED — founder feedback, verbatim

I don't have the domain knowledge to give you a bug list. This is what I can tell you, and it
is exactly what I saw:

> "this app feels ridiculous for some reason, is too complex"

> "faltu features zyada hain kaam ke se, things dont work, things arent accurate, bache nhi
> samjh sakte, cheezein intuitive nhi, workflows nhi hain, faltu practice ye voh hai,
> straightforward cheezein chahiye voh hi nhi hain theek se kaam karne ko"

> "ispe nhi lectures deliver ho sakte ache se"

Specific things I hit:

- **The image reading does not work.** I drew an expression, and the button to read it was
  dead. Whether photographs work at all, I have no idea. Whether an equation can actually be
  extracted from an image, I have no idea — nobody has ever shown me it happening.
  > "ye read image aint working, photo graph wala working or not no idea, image mein se
  > equation extract hogi ki nhi kaise hoga uska no idea abhi tak and my whole team is
  > taunting me ki advanced ocr use kar rha hai na koi tu ki nhi, aur ocr chale hi na"

  This one is not optional and it is not cosmetic. It has to genuinely work, on a real photo
  of real handwriting and on a real page of a real textbook, and I have to be able to watch it
  work.
- **The symbols do not go far enough.** A senior-class student's maths is not covered.
  > "How will it help if bade bachon ko eleventh twelfth wali maths type kuch karna ho saare
  > symbols tak hi nhi hain??"

  Every symbol needed for higher maths must be there and must be correct.
- **The workflow is complicated.** Features are fine — I like having capability — but every one
  of them has to be immediately understandable.
  > "features hon kafi acha lagta hai but simply samjh aayein"
- **There is content in it nobody asked for.** Pre-planned lessons, drills, practice modules,
  worksheet libraries — I do not want any of that.

## THE NON-NEGOTIABLES

1. **Accuracy, above everything.** This is the word I keep coming back to.
   > "results should totally be accurate, like text detection, conversion, hardware
   > integration sab easy and totally accurate ho ekdum"
   > "bahut bahut zyada accurate, bahut zyada"
   > "galti ki gunjaish nhi hai bilkul bhi"

   A blind child cannot see that a dot is wrong. Wrong braille is worse than no braille. Where
   something genuinely cannot be made certain, it must **say so out loud** rather than quietly
   guess — a silent wrong answer is the one unforgivable failure mode in this product.
2. **Everything that ships, works.** No dead buttons, no feature that only works in a demo
   path, no model that needs a hidden manual step before it functions. If a capability needs
   something downloaded or set up, the app handles it or tells the teacher plainly in one line.
   > "models etc sab bahut strong hon, working hon accurate hon"
3. **The full lesson, not the lone expression.** Worded problems, statement sums, full
   questions, working shown step by step the way it goes on a blackboard.
4. **Every symbol a school-maths curriculum needs, through class 11–12.**
5. **Input must be effortless and multiple ways.** Type it, write it, scan it out of the book
   she is teaching from — whatever is easiest in that moment.
   > "jaise google lens scan karta text waise app move karre hamari, teachers bahut asaani se
   > padha sakein, jo likhein type karein scan karein, voh reflect ho student ke uspe cell pe"
6. **Cells sync, live.** What the teacher puts up is what the child's cells show, in sync.
7. **Any number of cells, discovered not assumed.** Hardware is one cell today and will stack.
   How cells stack is hardware's problem; the software simply adapts.
   > "cells stack karna kaise karna ye hardware pe hai, but software adaptable ho aur easily
   > integrate ho jaye yahi chahiye bass humein"
8. **Hardware integration must be dead easy.** This is the seam I am most afraid of.
9. **Software still stands completely alone.** It must be fully demonstrable with nothing
   plugged in. That has not changed.
10. **English and Hindi only.**
    > "tu english hindi mein hi rhe bass"

## EXPLICIT NOT-NOW — cut these

- Pre-planned worksheets, lesson libraries, practice drills, structured courses, per-student
  progress records.
  > "kuch pre planned worksheets etc nhi rakhne, bass chahiye teacher apne lesson araam se
  > deliver kar sake"
- Language coverage beyond English and Hindi.
- Anything that exists to look impressive rather than to help a teacher teach or a child read.

Innovation itself is not restricted — decide freely what the product needs.
> "I do want my app to have features jo hardware team wants software to keep and many more
> that can be there, ofcourse my team will decide that using skills, because innovation and
> decisions aint gonna stop na" — but every feature must pass the WhatsApp-teacher test.

## CONSTRAINTS ONLY I KNOW

- **Time: about 6–7 hours from the start of this session, no more.** After that my team writes
  their report off the software, and we prepare for the panel evaluation. Work without stopping.
  > "bass bina bother kiye claude code kaam karta rhe and 6 hours 7 hours mein bass final
  > product dede mujhe"
- **Money: free only.** No paid services, no paid APIs, no paid models.
- **Hardware reality:** most likely exactly one working cell exists on the 22nd. Integration is
  a collaborative effort with the hardware team; I own the software side.
- **Ground truth for the hardware seam** is the Braillix Software Team Handoff document — the
  pod/muscle-cell protocol, cam numbering, I2C addressing, homing, nav buttons. Read it
  directly; keep it in this folder.
- **Repo:** software lives in its own GitHub repository, committed properly as you go. Never
  restructure or damage the hardware/firmware repo.
- **My own knowledge:** I cannot audit you.
  > "mujhe domain knowledge bilkul nhi… main koi error nhi nikaal paunga ya suggestion nhi de
  > paunga, claude code needs to come up with fully functional app that solves everything"

  So the verification burden is entirely yours. Do not hand me something and ask me whether it
  is right. Prove it is right, and show me the proof in a form I can hold up to a panel.

## TASTE ANCHOR

None from me. Decide it yourself (`studio-taste`) — with one instruction that overrides
aesthetics: **it must look and feel obvious to a non-technical teacher.** Beautiful is welcome;
intimidating is not.

## UNSPECIFIED — you decide, log it in `DECISIONS.md`

- Everything about how the product is shaped: screens, flows, feature set, naming, stack,
  architecture, art direction. All of it. I have deliberately not chosen any of it.
- How a lesson gets from the teacher's device onto the child's cells, in what unit, at what
  pace, and how the child moves through it.
- What happens when recognition is uncertain, and how that is surfaced honestly.
- Whether anything from the existing codebase survives.

## THE AUTONOMY CHARTER — stricter than last time

I am not available. I will be studying. Do not wait for me, do not ask me to choose, do not ask
me to confirm. Interrupt me **only** for:

1. Spending real money / anything outside a free tier.
2. Anything irreversible — including anything touching the hardware/firmware repo.
3. Publishing publicly for the first time.
4. A missing credential — ask once, in one message, with exact baby-step instructions.

Everything else: decide it, log one line in `DECISIONS.md`, keep moving. Ideas that arrive
mid-arc and do not fit go to `NOTES.md` unbuilt. `PROGRESS.md` always holds current state and
exactly one next action.

> "if scratch se sochna work karna pade toh claude code 0 percent hesitate karre, bilkul zero"

## HOW I WILL JUDGE IT IN THE MORNING

Not by the test count. By this: **could a maths teacher who has never seen this app, and who
only uses WhatsApp, sit down and teach one real lesson from her own textbook to a blind child
on it — and would every dot that child felt be correct?**

If yes, it worked. If any part of that sentence needs an explanation from me, it didn't.

---

## LAUNCH INSTRUCTIONS (for Shaurya — do not remove)

1. Fresh Claude Code session. This file and the hardware handoff document in the folder.
2. Paste:

   > Read VISION-BRIEF-Braillix-v2.md and the Braillix Software Team Handoff. This replaces
   > any earlier brief. Inherit zero product bias from anything already built — start the
   > product thinking from nothing. Run the full studio-pipeline from research, taking recon
   > all the way down to the real user and the real classroom, then boardroom, architecture,
   > constitution, arcs. Use the Chrome DevTools MCP to verify everything in a real browser
   > rather than trusting tests. Follow the Autonomy Charter — do not come back to me except
   > for the escalation list. Work continuously.

3. After any break or limit reset:

   > read PROGRESS.md and continue.
