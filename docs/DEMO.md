# Braillix — the demo (one page)

**The sentence to open with:** *"This app is the teacher's blackboard; the braille cells are the
child's eyes. A teacher writes whatever she is teaching — by hand, by typing, or by photographing
a book — and it lands on the student's fingers, live and verified."*

Everything below works with **nothing plugged in and no network**. Use **Chrome or Edge**.
The live site is **https://braillix.vercel.app** — it carries the full recognition model.

## Setup (night before, two minutes)

Open https://braillix.vercel.app once on the demo machine (it caches itself for offline).
Or run locally: `npm install && npm run fetch:model && npm run dev`.
Sanity check: **Help → Is everything working?** — all lamps green.

## The walk (eight minutes)

1. **Open the app.** *(30 s)* One screen: a blackboard with a worked quadratic already standing
   on it, the braille cell showing it, the chalk tray below. Say: *"There is nothing to learn
   here. If you have used WhatsApp, you can teach on this."*

2. **Type a line, like a message.** *(1 min)* Type `1/2 + 1/3` — the print preview and the dots
   move with every keystroke. Point at the green line: *"a second engine reads the dots back and
   confirms they say what I typed — a blind child cannot see a wrong dot, so the app checks
   every line before it reaches them."* Press **Enter**. The line lands on the board and is
   spoken aloud.

3. **Write by hand — the blackboard moment.** *(2 min)* Press the **pencil**. Write `x^2` (or
   anything) with the mouse/finger, large. Pause — the reading appears in the box below with
   its preview and verdict. Fix it if it misread (say: *"the teacher is always the last word —
   nothing recognised reaches a child unconfirmed"*). Press **Put on the board**: the line lands
   with the teacher's own handwriting kept faintly behind it.

4. **A question in Hindi.** *(1 min)* Type `दो संख्याओं का योग 12 है`. The words become Bharati
   Braille, the number stays Nemeth, the line is spoken in Hindi. Press **हिन्दी** in the corner:
   the whole interface follows.

5. **The child's side.** *(1.5 min)* Point at the cells strip: *"this is the hardware truth —
   one cell today, forty tomorrow; the software never assumes."* Drag the cell slider to 6.
   Page with **← →** — the walk the pod's own buttons take. Press **Explore**: the quadratic
   formula folds from 19 cells to 5 — *"a whole equation, navigable on one cell — that is the
   core invention."* Press **Why these dots?** — every cell, its meaning, its cam number.

6. **Photograph a textbook.** *(1 min)* Press the **camera** grip, load a sample, read it, and
   send it to the board through the same confirm gate.

7. **Prove it.** *(1 min)* **Help → Prove the syllabus**: all 175 curriculum lines, classes
   1–12, translated and read back live in about a second. *(If hardware is present: Device →
   USB → connect, and the same lesson drives real cams — `npm run pod` emulates one otherwise.)*

## Questions to expect

- **"What if the recognition is wrong?"** — It lands in an editable box behind a preview and a
  braille verdict; the teacher's press is the gate. A silent wrong answer is the one failure
  this product refuses to allow.
- **"What does it need to run?"** — A browser. No server, no account, no key, no network after
  first load. Student data never leaves the machine.
- **"Is the braille correct?"** — Nemeth (BANA 2022) and Bharati tables tested against the
  published standards; every line is independently read back from the dots; 175/175 syllabus
  lines verified live, on stage, in front of you.
