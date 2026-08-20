# NOTES — parked ideas, never silently built

Anything here is **not** in an arc's acceptance list. It gets built only if it is promoted into an
arc plan first.

## Parked at boardroom (20 Aug 2026)

- **Bharati maths braille table** — NIEPVD's maths/science code has no open machine-readable table.
  The translation layer is an interface, so this is a drop-in later. Would need someone with the
  printed NIEPVD code to author the table.
- **Grade-2 contractions** — irrelevant inside Nemeth (uncontracted by definition); would only matter
  if we ever show surrounding prose.
- **Whole-page / PDF OCR** — FormulaNet is documented as good at isolated formulas, poor at dense
  pages. Would need a layout-detection stage (Pix2Text does this in Python).
- **mDNS auto-discovery of pods** — manual IP + saved list covers the real need.
- **Teacher dashboard / class management** — no identified user before 22 Aug.
- **Online (stroke-based) handwriting recognition** — different research problem from image HMER.
- **Native mobile app** — the web app is responsive and installable.
- **Public deploy (Vercel/Netlify)** — Autonomy Charter escalation #3. The production bundle is
  built and verified locally; going public is one command whenever Shaurya says so.

## Ideas that arrived mid-build

- **Cloud recognition provider** — *cut on 20 Aug, see DECISIONS D5.1.* If it is ever wanted, the
  design was: a second `RecognitionProvider` calling a free-tier vision model, with the key typed at
  runtime and held in memory only (never a file, never `import.meta.env` — Vite inlines that into
  the static bundle), off by default, opt-in per image, with an on-screen notice before the request.
  The provider interface in `app/src/recognise/types.ts` is the seam. Do not add it without
  re-reading D5.1 first: the reasons it was cut have not changed.
- **An in-app "download the model" button.** Deliberately not built. Fetching 76 MB needs a network,
  and making that the primary path would quietly undercut the offline promise. The exact command is
  shown instead.
- **Generating the Cell Atlas from `braille_cam.scad`** rather than from the default bit mapping, so
  the printed sheet comes from the cam geometry itself. Needs the file from the hardware team.
- **A cell status read** (`0xFF 0x02`, then read one byte). The protocol defines it and the cell
  firmware implements it; nothing on the laptop side consumes it yet. It would let the interface say
  *which* cell is stuck rather than "a cell did not acknowledge".
- **Grade-2 contractions for surrounding prose.** Irrelevant inside Nemeth, but if Braillix ever
  displays sentences around the maths, literary braille would want them.
