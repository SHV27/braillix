/**
 * The lessons.
 *
 * Ordered the way Nemeth is actually taught: the digits first, because "the numbers are dropped"
 * is the thing that surprises every sighted person and the thing a braille reader must know before
 * anything else makes sense; then the operators; then the structures that turn a line of symbols
 * into an expression.
 *
 * Every item is defined by what a person would type, and the expected braille is produced by the
 * same engine that drives the hardware and the same input parser that reads the Board. Nothing is
 * hand-typed as dot patterns, so a lesson can never drift out of agreement with what the display
 * would actually show — and a teacher's own worksheet can be a drill without a second code path.
 *
 * Every word a student reads is written in **both languages**, in the same place, so a Hindi
 * lesson can never quietly fall back to English half way down the page. `lessons.test.ts` fails
 * the build if either half is missing.
 */

import type { Bilingual } from '../ui/i18n';

export type DrillKind = 'read' | 'write';

export interface LessonItem {
  /**
   * The maths, written the way the Board accepts it — LaTeX, natural maths, or a question with
   * words in it. It goes through exactly the same translation as anything a teacher types, which
   * is what lets a worksheet be a drill.
   */
  readonly source: string;
  /** What to tell the student when they get it wrong. One specific fact, not encouragement. */
  readonly hint: Bilingual;
}

export interface Lesson {
  readonly id: string;
  readonly title: Bilingual;
  /** One line: what this is and why it matters. */
  readonly teaches: Bilingual;
  /** The rule being learned, in the student's language. */
  readonly rule: Bilingual;
  readonly items: readonly LessonItem[];
}

export const LESSONS: readonly Lesson[] = [
  {
    id: 'digits',
    title: ['The dropped numbers', 'नीचे खिसके अंक'],
    teaches: [
      'Numbers in Nemeth sit in the lower part of the cell.',
      'नेमेथ में अंक सेल के निचले हिस्से में बैठते हैं।',
    ],
    rule: [
      'Nemeth writes digits one row DOWN from the letters: 1 is dot 2, 2 is dots 2-3, 3 is dots 2-5. ' +
        'That is why maths braille looks different from ordinary braille even when it is only counting.',
      'नेमेथ अंकों को अक्षरों से एक पंक्ति नीचे लिखता है: 1 यानी डॉट 2, 2 यानी डॉट 2-3, 3 यानी डॉट 2-5। ' +
        'इसीलिए गिनती करते समय भी गणित की ब्रेल आम ब्रेल से अलग दिखती है।',
    ],
    items: [
      { source: '1', hint: ['1 is the letter a moved down: dot 2 instead of dot 1.', '1 यानी अक्षर a नीचे खिसका हुआ: डॉट 1 की जगह डॉट 2।'] },
      { source: '2', hint: ['2 is the letter b moved down: dots 2-3.', '2 यानी अक्षर b नीचे खिसका हुआ: डॉट 2-3।'] },
      { source: '3', hint: ['3 is the letter c moved down: dots 2-5.', '3 यानी अक्षर c नीचे खिसका हुआ: डॉट 2-5।'] },
      { source: '5', hint: ['5 is the letter e moved down: dots 2-6.', '5 यानी अक्षर e नीचे खिसका हुआ: डॉट 2-6।'] },
      { source: '7', hint: ['7 is the letter g moved down: dots 2-3-5-6.', '7 यानी अक्षर g नीचे खिसका हुआ: डॉट 2-3-5-6।'] },
      { source: '0', hint: ['0 is the letter j moved down: dots 3-5-6.', '0 यानी अक्षर j नीचे खिसका हुआ: डॉट 3-5-6।'] },
    ],
  },
  {
    id: 'numeric-indicator',
    title: ['The numeric indicator', 'संख्या-सूचक'],
    teaches: ['A number standing on its own announces itself first.', 'अकेली खड़ी संख्या पहले अपना परिचय देती है।'],
    rule: [
      'A number that starts a fresh numeric context is preceded by ⠼ (dots 3-4-5-6). Without it, the ' +
        'dropped digits could be read as punctuation.',
      'जो संख्या नए सिरे से शुरू होती है, उसके पहले ⠼ (डॉट 3-4-5-6) आता है। इसके बिना नीचे खिसके अंक ' +
        'विराम-चिह्न पढ़े जा सकते हैं।',
    ],
    items: [
      { source: '4', hint: ['Two cells: the numeric indicator ⠼, then the dropped 4.', 'दो सेल: संख्या-सूचक ⠼, फिर नीचे खिसका 4।'] },
      { source: '42', hint: ['One indicator serves the whole number, not one per digit.', 'पूरी संख्या के लिए एक ही सूचक काफ़ी है, हर अंक के लिए नहीं।'] },
      { source: '100', hint: ['Still one indicator — then 1, 0, 0.', 'फिर भी एक ही सूचक — उसके बाद 1, 0, 0।'] },
    ],
  },
  {
    id: 'letters',
    title: ['Letters stay where they are', 'अक्षर अपनी जगह रहते हैं'],
    teaches: ['Variables are ordinary braille letters, uncontracted.', 'चर आम ब्रेल अक्षर ही हैं, बिना संक्षेप के।'],
    rule: [
      'Nemeth never contracts inside maths, so x is just x: dots 1-3-4-6. Nothing is abbreviated, ' +
        'because in an equation every character means something.',
      'नेमेथ गणित के भीतर कभी संक्षेप नहीं करता, इसलिए x सिर्फ़ x है: डॉट 1-3-4-6। कुछ भी छोटा नहीं किया जाता, ' +
        'क्योंकि समीकरण में हर चिह्न का अपना अर्थ होता है।',
    ],
    items: [
      { source: 'a', hint: ['a is dot 1 — the first cell in braille.', 'a यानी डॉट 1 — ब्रेल की पहली सेल।'] },
      { source: 'x', hint: ['x is dots 1-3-4-6.', 'x यानी डॉट 1-3-4-6।'] },
      { source: 'n', hint: ['n is dots 1-3-4-5.', 'n यानी डॉट 1-3-4-5।'] },
      { source: 'y', hint: ['y is dots 1-3-4-5-6.', 'y यानी डॉट 1-3-4-5-6।'] },
    ],
  },
  {
    id: 'plus-minus',
    title: ['Plus and minus', 'जोड़ और घटा'],
    teaches: ['The two operators you will meet most.', 'सबसे ज़्यादा मिलने वाले दो चिह्न।'],
    rule: [
      'Plus is ⠬ (dots 3-4-6). Minus is ⠤ (dots 3-6). Both sit low in the cell, like the digits.',
      'जोड़ ⠬ (डॉट 3-4-6) है। घटा ⠤ (डॉट 3-6) है। दोनों अंकों की तरह सेल में नीचे बैठते हैं।',
    ],
    items: [
      { source: '1+1', hint: ['Indicator, 1, plus, 1 — the plus does not restart the number.', 'सूचक, 1, जोड़, 1 — जोड़ का चिह्न संख्या दोबारा शुरू नहीं करता।'] },
      { source: '5-2', hint: ['Minus is dots 3-6 — just the right-hand column of the plus.', 'घटा यानी डॉट 3-6 — जोड़ के चिह्न का सिर्फ़ दायाँ स्तंभ।'] },
      { source: 'a+b', hint: ['Letters need no indicator; the plus is still dots 3-4-6.', 'अक्षरों को सूचक नहीं चाहिए; जोड़ फिर भी डॉट 3-4-6 है।'] },
    ],
  },
  {
    id: 'equals',
    title: ['Equals takes two cells', 'बराबर के लिए दो सेल'],
    teaches: [
      'Comparison signs are two-cell symbols with a space either side.',
      'तुलना के चिह्न दो सेल के होते हैं और दोनों ओर एक खाली जगह लेते हैं।',
    ],
    rule: [
      'Equals is ⠨⠅ — dots 4-6, then dots 1-3. It is written with a space before and after, which is ' +
        'why an equation is wider in braille than you expect.',
      'बराबर ⠨⠅ है — पहले डॉट 4-6, फिर डॉट 1-3। इसके आगे-पीछे एक-एक खाली जगह आती है, इसीलिए ब्रेल में ' +
        'समीकरण अपेक्षा से चौड़ा हो जाता है।',
    ],
    items: [
      { source: '1=1', hint: ['Space, ⠨⠅, space. The spaces are real cells and they matter.', 'खाली जगह, ⠨⠅, खाली जगह। ये खाली जगहें असली सेल हैं और मायने रखती हैं।'] },
      { source: 'x=2', hint: ['x, space, equals, space, then the number with its indicator.', 'x, खाली जगह, बराबर, खाली जगह, फिर सूचक के साथ संख्या।'] },
      { source: '2+3=5', hint: ['Seven cells in all — count the spaces around the equals.', 'कुल सात सेल — बराबर के आसपास की खाली जगहें भी गिनिए।'] },
    ],
  },
  {
    id: 'fractions',
    title: ['Fractions open and close', 'भिन्न खुलती और बंद होती है'],
    teaches: ['A fraction is bracketed, not stacked.', 'भिन्न ऊपर-नीचे नहीं, कोष्ठक की तरह लिखी जाती है।'],
    rule: [
      'Open with ⠹ (dots 1-4-5-6), separate with ⠌ (dots 3-4), close with ⠼ (dots 3-4-5-6). Print ' +
        'stacks a fraction in two dimensions; braille has one line, so it brackets it instead.',
      '⠹ (डॉट 1-4-5-6) से खोलिए, ⠌ (डॉट 3-4) से अलग कीजिए, ⠼ (डॉट 3-4-5-6) से बंद कीजिए। छपाई में भिन्न ' +
        'दो दिशाओं में लगती है; ब्रेल में सिर्फ़ एक पंक्ति है, इसलिए वह कोष्ठक की तरह लिखी जाती है।',
    ],
    items: [
      { source: '\\frac{a}{b}', hint: ['Five cells: open, a, line, b, close.', 'पाँच सेल: खोलना, a, रेखा, b, बंद करना।'] },
      { source: '\\frac{1}{2}', hint: ['The digits inside are dropped, as always.', 'अंदर के अंक हमेशा की तरह नीचे खिसके रहते हैं।'] },
      { source: '\\frac{22}{7}', hint: ['Open, 2, 2, line, 7, close.', 'खोलना, 2, 2, रेखा, 7, बंद करना।'] },
    ],
  },
  {
    id: 'roots',
    title: ['Roots open and close too', 'मूल भी खुलता और बंद होता है'],
    teaches: ['The radical sign has an end as well as a beginning.', 'मूल-चिह्न का आरंभ ही नहीं, अंत भी होता है।'],
    rule: [
      'Open with ⠜ (dots 3-4-5) and close with ⠻ (dots 1-2-4-5-6). In print the bar over the top ' +
        'shows where a root ends; in braille the closing cell does that job.',
      '⠜ (डॉट 3-4-5) से खोलिए और ⠻ (डॉट 1-2-4-5-6) से बंद कीजिए। छपाई में ऊपर की रेखा बताती है कि मूल कहाँ ' +
        'ख़त्म हुआ; ब्रेल में यह काम बंद करने वाली सेल करती है।',
    ],
    items: [
      { source: '\\sqrt{x}', hint: ['Three cells: open, x, close.', 'तीन सेल: खोलना, x, बंद करना।'] },
      { source: '\\sqrt{9}', hint: ['Open, then the dropped 9, then close.', 'खोलना, फिर नीचे खिसका 9, फिर बंद करना।'] },
      { source: '\\sqrt{x+1}', hint: ['Everything up to the closing cell is under the root.', 'बंद करने वाली सेल तक सब कुछ मूल के अंदर है।'] },
    ],
  },
  {
    id: 'powers',
    title: ['Powers, and coming back down', 'घात, और वापस नीचे आना'],
    teaches: [
      'Levels are announced, and so is the return to the baseline.',
      'ऊपर जाना भी बताया जाता है और आधार-रेखा पर लौटना भी।',
    ],
    rule: [
      'Superscript is ⠘ (dots 4-5). What follows is raised until ⠐ (dot 5) brings you back to the ' +
        'baseline. Forgetting the baseline indicator is how "x² + 1" becomes "x to the power of 2+1".',
      'घात-सूचक ⠘ (डॉट 4-5) है। उसके बाद का सब ऊपर उठा रहता है जब तक ⠐ (डॉट 5) आपको आधार-रेखा पर वापस ' +
        'नहीं लाता। यही सूचक भूलने से "x² + 1" पढ़ा जाने लगता है "x की घात 2+1"।',
    ],
    items: [
      { source: 'x^2', hint: ['x, superscript, dropped 2. Nothing follows, so no baseline cell is needed.', 'x, घात-सूचक, नीचे खिसका 2। आगे कुछ नहीं है, इसलिए आधार-रेखा सेल की ज़रूरत नहीं।'] },
      { source: 'x^2+1', hint: ['After the exponent comes ⠐ — that is what ends the power.', 'घात के बाद ⠐ आता है — यही घात को ख़त्म करता है।'] },
      { source: 'a^2+b^2', hint: ['Each power is closed by its own baseline indicator.', 'हर घात अपने अलग आधार-रेखा सूचक से बंद होती है।'] },
    ],
  },
  {
    id: 'brackets',
    title: ['Brackets', 'कोष्ठक'],
    teaches: ['Round brackets have their own cells.', 'गोल कोष्ठकों की अपनी सेल होती हैं।'],
    rule: [
      'Open is ⠷ (dots 1-2-3-5-6), close is ⠾ (dots 2-3-4-5-6).',
      'खोलना ⠷ (डॉट 1-2-3-5-6) है, बंद करना ⠾ (डॉट 2-3-4-5-6) है।',
    ],
    items: [
      { source: '(a+b)', hint: ['Five cells: open, a, plus, b, close.', 'पाँच सेल: खोलना, a, जोड़, b, बंद करना।'] },
      { source: '2(x+1)', hint: ['The number leads, then the bracket opens.', 'पहले संख्या आती है, फिर कोष्ठक खुलता है।'] },
    ],
  },
  {
    id: 'together',
    title: ['Putting it together', 'सब एक साथ'],
    teaches: [
      'Whole expressions, with everything you have learned at once.',
      'पूरे व्यंजक, जिनमें सीखी हुई हर बात एक साथ आती है।',
    ],
    rule: [
      'Nothing new — this is the same six rules working together, which is what real maths looks like.',
      'कुछ नया नहीं — यही छह नियम साथ मिलकर काम करते हैं, और असली गणित ऐसा ही दिखता है।',
    ],
    items: [
      { source: 'x^2+3x+2=0', hint: ['Powers, plus, the equals with its spaces, and a dropped 0.', 'घात, जोड़, खाली जगहों के साथ बराबर, और नीचे खिसका 0।'] },
      { source: '\\frac{1}{2}+\\frac{1}{3}', hint: ['Two complete fractions, each opened and closed.', 'दो पूरी भिन्नें, हर एक खुली और बंद की हुई।'] },
      { source: '\\sqrt{a^2+b^2}', hint: ['A root containing two powers — watch the baseline indicators.', 'एक मूल जिसमें दो घातें हैं — आधार-रेखा सूचकों पर ध्यान दीजिए।'] },
      { source: '\\frac{-b}{2a}', hint: ['The minus belongs to the numerator, inside the fraction.', 'घटा का चिह्न अंश का हिस्सा है, भिन्न के अंदर।'] },
    ],
  },
];

export function lessonById(id: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.id === id);
}

/** Total items across all lessons — used for the progress summary. */
export function totalItems(): number {
  return LESSONS.reduce((sum, lesson) => sum + lesson.items.length, 0);
}
