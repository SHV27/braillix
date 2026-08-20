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

## Parked after arcs 7–10 (20 Aug 2026, evening)

- **Bharati maths braille** — still the biggest open item, and still blocked on the same thing: the
  NIEPVD maths notation has no open machine-readable table. What changed is that the *language*
  half now exists (`core/bharati.ts`), so the seam is real rather than theoretical — a maths table
  would slot in beside it. Would need someone with the printed NIEPVD code to author it.
- **More Indian languages.** The Bharati tables cover nine scripts; Braillix implements Devanagari.
  Marathi and Nepali would work today (same script); Bengali, Gujarati, Punjabi, Tamil, Telugu,
  Kannada, Malayalam and Oriya each need their own letter table plus a font subset. The interface
  translation table is the other half — `ui/i18n.ts` is keyed for it, `LANGS` is a list.
- **A second reading of a photograph.** When the recogniser judges its own answer "check this one",
  it could re-run with different preprocessing and offer both readings. Cheap (about a second) and
  a real accuracy gain on bad handwriting. Not built: it needs its own measurement before it can be
  claimed, and the six shipped samples all read correctly as they are.
- **Worksheet sharing by QR code.** A worksheet is a small JSON file; a QR code would move one
  between two laptops with no cable and no network. Charming, and genuinely useful in a school
  with one laptop per teacher. Needs a QR encoder (~3 KB) and a camera decode path.
- **Per-student assignment.** Worksheets are for the class; a teacher may want "Asha does sheet A,
  Ravi does sheet B". The data model already carries both ids on every record, so this is interface
  work rather than a change of shape.
- **Speech in more voices.** The Hindi transcript is always shown; hearing it depends on a system
  voice. A bundled voice is out of scope (tens of megabytes, and licensing).

## Measured, and honestly not yet measured (20 Aug 2026)

- **The second reading of an uncertain image.** Built and shipped: when the model judges its own
  answer "check this one", Braillix reads the image again with the greys pushed apart and offers
  both readings, with agreement between the two shown as what it is — evidence of a kind the model
  cannot give about itself. What is *not* measured is how much it helps, because all six shipped
  samples are read confidently first time, so the second pass never fires on them. Measuring it
  properly needs a set of genuinely hard photographs — real pencil, real classroom light — which is
  a morning at a school, not an afternoon at a keyboard. Until then the interface claims only what
  it does: a second opinion, offered, never asserted.
