/**
 * Language — the one owner of which words the interface uses.
 *
 * Braillix is for Indian schools for the blind. A teacher there is far more likely to be at home in
 * Hindi than in English, and an interface that only speaks English quietly narrows who is allowed
 * to run the lesson. So the whole interface switches, in one control, and the choice is remembered.
 *
 * Two rules keep this honest:
 *
 *  1. **The braille never changes.** Nemeth is Nemeth in every language; the words around it are
 *     what move. A language switch that silently changed the braille code would be the most
 *     dangerous feature in the product.
 *  2. **No half-translated screen.** `i18n.test.ts` fails the build if any key is missing a
 *     language, or if a key is defined and never used. A screen that falls back to English mid
 *     sentence looks broken, and it is.
 *
 * This module deliberately holds its own tiny store rather than living in `src/store.ts`: the store
 * needs to *read* the language to build announcements, so the dependency has to point this way.
 */

import { useCallback, useSyncExternalStore } from 'react';

export type Lang = 'en' | 'hi';

export const LANGS: readonly { id: Lang; label: string; english: string }[] = [
  { id: 'en', label: 'English', english: 'English' },
  { id: 'hi', label: 'हिन्दी', english: 'Hindi' },
];

const STORAGE_KEY = 'braillix.lang';

/* ------------------------------------------------------------------ the strings */

/**
 * Every word the interface says, in both languages.
 *
 * Kept as one flat map on purpose: a nested tree hides gaps, and a gap here is a half-English
 * screen in front of a teacher who does not read English.
 */
const STRINGS: Readonly<Record<string, readonly [en: string, hi: string]>> = {
  /* ---- shell ---- */
  'app.tagline': ['refreshable braille for mathematics', 'गणित के लिए रिफ्रेशेबल ब्रेल'],
  'app.skip': ['Skip to the display', 'सीधे डिस्प्ले पर जाएँ'],
  'app.sections': ['Sections', 'भाग'],
  'app.language': ['Language', 'भाषा'],

  'nav.board': ['Board', 'बोर्ड'],
  'nav.board.hint': ['Write maths and put it on the display', 'गणित लिखें और डिस्प्ले पर भेजें'],
  'nav.practice': ['Practice', 'अभ्यास'],
  'nav.practice.hint': ['Learn Nemeth by reading and writing braille', 'ब्रेल पढ़कर और लिखकर नेमेथ सीखें'],
  'nav.device': ['Device', 'डिवाइस'],
  'nav.device.hint': ['Connect a display and check the wiring', 'डिस्प्ले जोड़ें और वायरिंग जाँचें'],

  /* ---- board ---- */
  'board.title': ['Write maths. Read it with your hands.', 'गणित लिखिए। हाथों से पढ़िए।'],
  'board.lede': [
    'Type it the way you would on paper. Braillix turns it into Nemeth — the braille code for mathematics — and drives the dots, on one cell or on forty.',
    'जैसे कागज़ पर लिखते हैं वैसे ही लिखिए। ब्रेलिक्स इसे नेमेथ में बदलता है — गणित की ब्रेल लिपि — और डॉट्स चलाता है, चाहे एक सेल हो या चालीस।',
  ],
  'board.source.type': ['Type it', 'लिखिए'],
  'board.source.photo': ['Photograph it', 'फ़ोटो लीजिए'],
  'board.field': ['The expression', 'गणितीय व्यंजक'],
  'board.help': [
    'Write it as you would say it: 1/2, sqrt(9), x^2, 2 <= x, 45 degrees. LaTeX works too.',
    'जैसे बोलते हैं वैसे लिखिए: 1/2, sqrt(9), x^2, 2 <= x, 45 degrees. LaTeX भी चलता है।',
  ],
  'board.print': ['How it reads in print', 'छपाई में ऐसा दिखता है'],
  'board.print.empty': ['Type something and it appears here', 'कुछ लिखिए, वह यहाँ दिखेगा'],
  'board.examples': ['Examples', 'उदाहरण'],
  'board.clear': ['Clear', 'मिटाएँ'],
  'board.parseFailed': ['That expression could not be read.', 'यह व्यंजक पढ़ा नहीं जा सका।'],

  'board.source': ['How to write it', 'कैसे लिखें'],

  /* ---- examples ---- */
  'ex.quadratic': ['Quadratic', 'द्विघात'],
  'ex.fraction': ['Fraction', 'भिन्न'],
  'ex.root': ['Square root', 'वर्गमूल'],
  'ex.formula': ['Quadratic formula', 'द्विघात सूत्र'],
  'ex.identity': ['Identity', 'सर्वसमिका'],
  'ex.addFractions': ['Adding fractions', 'भिन्नों का जोड़'],
  'ex.degrees': ['An angle', 'एक कोण'],
  'ex.money': ['Money', 'रुपये-पैसे'],
  'ex.hindiQuestion': ['A question in Hindi', 'हिन्दी में एक प्रश्न'],
  'ex.wordProblem': ['A word problem', 'शब्द-प्रश्न'],

  /* ---- questions: words and maths on one line ---- */
  'mixed.flip': ['Click to switch between words and maths', 'शब्द और गणित के बीच बदलने के लिए दबाइए'],
  'mixed.switchNote': [
    'This line changes braille code half way through, so the maths opens with ⠸⠩ and closes with ⠸⠱ — that is how the reader knows the rules just changed.',
    'इस पंक्ति में बीच में ब्रेल लिपि बदलती है, इसलिए गणित ⠸⠩ से खुलता है और ⠸⠱ पर बंद होता है — पढ़ने वाले को इसी से पता चलता है कि नियम बदल गए।',
  ],
  'code.nemeth': ['Nemeth · maths', 'नेमेथ · गणित'],
  'code.bharati': ['Bharati · Hindi', 'भारती · हिन्दी'],
  'code.literary': ['Grade 1 · words', 'ग्रेड 1 · शब्द'],
  'board.question': ['The question, part by part', 'प्रश्न, हिस्सा-दर-हिस्सा'],

  /* ---- the first sixty seconds ---- */
  'first.title': ['New here? Sixty seconds.', 'पहली बार? साठ सेकंड।'],
  'first.lede': [
    'Press any of these and watch the display. Nothing is being set up — this is the product working.',
    'इनमें से कोई भी दबाइए और डिस्प्ले देखिए। कुछ सेट नहीं हो रहा — यह उत्पाद चल रहा है।',
  ],
  'first.skip': ['I know it already', 'मुझे पता है'],
  'first.step1': ['Put a sum on the display', 'डिस्प्ले पर एक सवाल भेजिए'],
  'first.step1detail': [
    'Two thirds plus one sixth, written the way you would write it.',
    'दो तिहाई जोड़ एक छठा — जैसे आप लिखते हैं वैसे ही।',
  ],
  'first.step2': ['Make a long formula fit one cell', 'लंबा सूत्र एक सेल में समाइए'],
  'first.step2detail': [
    'The quadratic formula folds from nineteen cells to five, and you step into the parts.',
    'द्विघात सूत्र उन्नीस सेल से पाँच में सिमट जाता है, और आप हिस्सों में जा सकते हैं।',
  ],
  'first.step3': ['Write a question in Hindi', 'हिन्दी में सवाल लिखिए'],
  'first.step3detail': [
    'Words in Bharati Braille, the number in Nemeth, on one line of cells.',
    'शब्द भारती ब्रेल में, संख्या नेमेथ में — सेल की एक ही पंक्ति पर।',
  ],
  'first.foot': ['Everything else is explained in', 'बाक़ी सब समझाया गया है'],
  'first.help': ['Help', 'सहायता में'],

  /* ---- keypad ---- */
  'keypad.arithmetic': ['Arithmetic', 'अंकगणित'],
  'keypad.shapes': ['Powers and roots', 'घात और मूल'],
  'keypad.comparison': ['Comparison', 'तुलना'],
  'keypad.symbols': ['Symbols', 'चिह्न'],
  'keypad.functions': ['Functions', 'फलन'],
  'keypad.senior': ['Senior classes', 'बड़ी कक्षाएँ'],
  'keypad.more': ['More symbols', 'और चिह्न'],
  'keypad.fewer': ['Fewer symbols', 'कम चिह्न'],
  'keypad.plus': ['plus', 'जोड़'],
  'keypad.minus': ['minus', 'घटा'],
  'keypad.times': ['times', 'गुणा'],
  'keypad.dividedBy': ['divided by', 'भाग'],
  'keypad.equals': ['equals', 'बराबर'],
  'keypad.fraction': ['fraction, a over b', 'भिन्न, a बटा b'],
  'keypad.squared': ['squared', 'वर्ग'],
  'keypad.power': ['to the power of', 'की घात'],
  'keypad.index': ['subscript', 'अधोलिखित अंक'],
  'keypad.root': ['square root', 'वर्गमूल'],
  'keypad.cubeRoot': ['cube root', 'घनमूल'],
  'keypad.brackets': ['brackets', 'कोष्ठक'],
  'keypad.lessThan': ['less than', 'से छोटा'],
  'keypad.greaterThan': ['greater than', 'से बड़ा'],
  'keypad.atMost': ['less than or equal to', 'से छोटा या बराबर'],
  'keypad.atLeast': ['greater than or equal to', 'से बड़ा या बराबर'],
  'keypad.notEqual': ['not equal to', 'बराबर नहीं'],
  'keypad.about': ['approximately equal to', 'लगभग बराबर'],
  'keypad.pi': ['pi', 'पाई'],
  'keypad.theta': ['theta', 'थीटा'],
  'keypad.degrees': ['degrees', 'डिग्री'],
  'keypad.percent': ['per cent', 'प्रतिशत'],
  'keypad.rupees': ['rupees', 'रुपये'],
  'keypad.infinity': ['infinity', 'अनंत'],
  'keypad.absolute': ['absolute value', 'निरपेक्ष मान'],
  'keypad.sum': ['sum', 'योग'],
  'keypad.integral': ['integral', 'समाकल'],
  'keypad.limit': ['limit', 'सीमा'],
  'keypad.set': ['set', 'समुच्चय'],
  'keypad.squareBrackets': ['square brackets', 'वर्ग कोष्ठक'],
  'keypad.angle': ['angle', 'कोण'],

  /* ---- device ---- */
  'device.sections': ['Device sections', 'डिवाइस के भाग'],
  'device.connect': ['Connect and calibrate', 'जोड़ें और कैलिब्रेट करें'],
  'device.atlas': ['Cell atlas', 'सेल एटलस'],

  /* ---- the printed worksheet ---- */
  'print.name': ['Name', 'नाम'],
  'print.date': ['Date', 'दिनांक'],
  'print.foot': [
    'Prepared with Braillix. The braille under each question is Nemeth for the mathematics and Bharati for the words.',
    'ब्रेलिक्स से बनाया गया। हर सवाल के नीचे की ब्रेल में गणित नेमेथ में है और शब्द भारती में।',
  ],
  'class.print': ['Print this worksheet', 'यह वर्कशीट छापिए'],
  'class.brf': ['Save for an embosser (BRF)', 'एम्बॉसर के लिए सहेजिए (BRF)'],

  /* ---- help and the self-check ---- */
  'nav.help': ['Help', 'सहायता'],
  'nav.help.hint': ['How it works, and what is working right now', 'यह कैसे काम करता है, और अभी क्या चल रहा है'],
  'help.title': ['Help', 'सहायता'],
  'help.lede': [
    'What Braillix does, how to use it in a lesson, and a button that goes and checks whether everything on this laptop is actually working.',
    'ब्रेलिक्स क्या करता है, कक्षा में इसे कैसे चलाएँ, और एक बटन जो जाकर जाँचता है कि इस लैपटॉप पर सब सचमुच काम कर रहा है या नहीं।',
  ],
  'help.check': ['Is everything working?', 'क्या सब काम कर रहा है?'],
  'help.checkLede': [
    'This does the work rather than reading a setting: it translates a known expression and compares the answer, fetches the braille tables from this machine, and writes to storage. It takes about a second.',
    'यह सेटिंग पढ़कर नहीं बताता, बल्कि सचमुच करके देखता है: एक जाना-पहचाना व्यंजक अनूदित करके उत्तर मिलाता है, इसी मशीन से ब्रेल तालिकाएँ लाता है, और सहेजकर देखता है। लगभग एक सेकंड लगता है।',
  ],
  'help.run': ['Run the check', 'जाँच चलाइए'],
  'help.running': ['Checking…', 'जाँच हो रही है…'],
  'help.copy': ['Copy the report', 'रिपोर्ट कॉपी कीजिए'],
  'help.copied': ['Copied', 'कॉपी हो गई'],
  'help.allWell': ['Everything needed for a lesson is working.', 'कक्षा के लिए ज़रूरी सब कुछ चल रहा है।'],
  'help.someWarn': [
    'The lesson will work. Some extras are not installed — each one says what it needs.',
    'कक्षा चल जाएगी। कुछ अतिरिक्त चीज़ें स्थापित नहीं हैं — हर एक बता रही है उसे क्या चाहिए।',
  ],
  'help.someFail': [
    'Something is wrong that would affect what a child reads. Do not use this build in a lesson until it passes.',
    'कुछ ऐसा ग़लत है जो बच्चे के पढ़ने पर असर डालेगा। जब तक यह ठीक न हो, कक्षा में इसका उपयोग न करें।',
  ],
  'check.engine': ['The maths engine', 'गणित इंजन'],
  'check.nemeth': ['Nemeth translation', 'नेमेथ अनुवाद'],
  'check.bharati': ['Hindi braille', 'हिन्दी ब्रेल'],
  'check.offline': ['Works without the internet', 'बिना इंटरनेट काम करना'],
  'check.storage': ['Saving your work', 'आपका काम सहेजना'],
  'check.recognition': ['Reading handwriting', 'लिखावट पढ़ना'],
  'check.speech': ['Speech', 'वाणी'],
  'check.usb': ['Connecting by cable', 'तार से जोड़ना'],
  'check.pass': ['working', 'चल रहा है'],

  /* What each check found, and what to do about it. Prose a teacher reads, so it is translated —
     unlike the status strip's one-line diagnostics, which quote commands and API names (D7.8). */
  'check.engineOk': ['One half is {braille}, exactly as the Nemeth table says.', 'आधा {braille} है, ठीक वैसे ही जैसे नेमेथ तालिका कहती है।'],
  'check.engineDead': [
    'The maths engine did not start, so the cells would show ordinary braille, not Nemeth.',
    'गणित इंजन चालू नहीं हुआ, इसलिए सेल में नेमेथ नहीं बल्कि आम ब्रेल दिखेगी।',
  ],
  'check.engineDeadFix': [
    'Reload the page. If it persists, run `npm install` again — public/sre/mathmaps may be missing.',
    'पन्ना दोबारा लोड कीजिए। फिर भी न हो तो `npm install` दोबारा चलाइए — public/sre/mathmaps ग़ायब हो सकता है।',
  ],
  'check.engineWrong': ['One half translated to {got}, and it should be {want}.', 'आधा {got} में बदला, जबकि होना चाहिए {want}।'],
  'check.dontUse': [
    'Do not use this build in a lesson. Reinstall Braillix and run the check again.',
    'इस बिल्ड को कक्षा में मत चलाइए। ब्रेलिक्स दोबारा स्थापित कीजिए और जाँच फिर चलाइए।',
  ],
  'check.nemethOk': ['A quadratic is {count} cells, and every one matches.', 'एक द्विघात {count} सेल का है, और हर सेल मेल खाती है।'],
  'check.nemethWrong': ['A quadratic translated to {got}, and it should be {want}.', 'द्विघात {got} में बदला, जबकि होना चाहिए {want}।'],
  'check.bharatiOk': ['गणित is {braille}, as the Bharati table says.', 'गणित {braille} है, जैसा भारती तालिका कहती है।'],
  'check.bharatiWrong': [
    'गणित translated to {got}, and it should be {want}. Hindi words would be wrong on the display.',
    'गणित {got} में बदला, जबकि होना चाहिए {want}। डिस्प्ले पर हिन्दी शब्द ग़लत आएँगे।',
  ],
  'check.offlineOk': [
    'The Nemeth tables are on this machine ({size} KB). No network is needed.',
    'नेमेथ तालिकाएँ इसी मशीन पर हैं ({size} KB)। किसी नेटवर्क की ज़रूरत नहीं।',
  ],
  'check.offlineBad': ['The local Nemeth tables could not be read ({reason}).', 'स्थानीय नेमेथ तालिकाएँ पढ़ी नहीं जा सकीं ({reason})।'],
  'check.offlineFix': [
    'Run `npm install` again. Without them Braillix needs the internet, which a classroom may not have.',
    '`npm install` दोबारा चलाइए। इनके बिना ब्रेलिक्स को इंटरनेट चाहिए, जो कक्षा में शायद न हो।',
  ],
  'check.storageOk': [
    'Worksheets and student records will be kept on this laptop.',
    'वर्कशीट और विद्यार्थियों के रिकॉर्ड इसी लैपटॉप पर रहेंगे।',
  ],
  'check.storageBad': ['This browser will not let Braillix save anything.', 'यह ब्राउज़र ब्रेलिक्स को कुछ भी सहेजने नहीं देता।'],
  'check.storageFix': [
    'Leave private browsing, or allow site data. Everything else works; nothing will be remembered.',
    'निजी ब्राउज़िंग बंद कीजिए, या साइट डेटा की अनुमति दीजिए। बाक़ी सब चलेगा; बस कुछ याद नहीं रहेगा।',
  ],
  'check.recognitionOk': [
    'Handwriting can be read on this device, with no network.',
    'लिखावट इसी डिवाइस पर पढ़ी जा सकती है, बिना नेटवर्क के।',
  ],
  'check.recognitionMissing': ['The handwriting model is not installed on this machine.', 'लिखावट पढ़ने वाला मॉडल इस मशीन पर स्थापित नहीं है।'],
  'check.recognitionFix': [
    'Run `npm run fetch:model` once (76 MB). Everything else works without it — type the maths instead.',
    'एक बार `npm run fetch:model` चलाइए (76 MB)। इसके बिना भी बाक़ी सब चलता है — गणित टाइप कर लीजिए।',
  ],
  'check.speechOk': ['{language} speech: {voice}.', '{language} वाणी: {voice}।'],
  'check.speechMissing': ['This machine has no {language} voice installed.', 'इस मशीन पर {language} की कोई आवाज़ स्थापित नहीं है।'],
  'check.speechFix': [
    'The braille and the written transcript are unaffected. Install the language pack in Windows settings to hear it.',
    'ब्रेल और लिखा हुआ पाठ इससे अछूते हैं। सुनने के लिए विंडोज़ सेटिंग्स में भाषा पैक स्थापित कीजिए।',
  ],
  'check.usbOk': ['A pod can be connected over USB from this browser.', 'इस ब्राउज़र से USB के ज़रिए पॉड जोड़ा जा सकता है।'],
  'check.usbMissing': ['This browser cannot open a USB port.', 'यह ब्राउज़र USB पोर्ट नहीं खोल सकता।'],
  'check.usbFix': [
    'Use Chrome or Edge on a laptop to connect a pod by cable, or connect over Wi-Fi instead.',
    'तार से पॉड जोड़ने के लिए लैपटॉप पर Chrome या Edge चलाइए, या Wi-Fi से जोड़िए।',
  ],
  'check.systemLanguage': ['English', 'हिन्दी'],
  'check.someVoice': ['a system voice', 'सिस्टम की आवाज़'],
  'check.warn': ['not installed', 'स्थापित नहीं'],
  'check.fail': ['wrong', 'ग़लत'],

  'help.howTo': ['How to use it in a lesson', 'कक्षा में कैसे चलाएँ'],
  'help.step1': ['Write the question on the Board. Check it in print — that is what the child will read.', 'बोर्ड पर सवाल लिखिए। छपाई में जाँच लीजिए — वही बच्चा पढ़ेगा।'],
  'help.step2': ['Keep it in a worksheet, so tomorrow you press one button instead of typing again.', 'उसे वर्कशीट में रख लीजिए, ताकि कल दोबारा लिखने के बजाय एक बटन दबाना पड़े।'],
  'help.step3': ['Press Teach. The arrow keys move through the questions; each one goes onto the display.', '“पढ़ाइए” दबाइए। तीर बटन सवालों में चलते हैं; हर सवाल डिस्प्ले पर चला जाता है।'],
  'help.step4': ['With one cell, use Explore structure — a long expression folds into a few cells you can step into.', 'एक ही सेल हो तो “रचना देखिए” चलाइए — लंबा व्यंजक कुछ सेल में सिमट जाता है, जिनमें अंदर जाया जा सकता है।'],
  'help.step5': ['Choose who is at the display on the Class screen, and their practice is kept against their name.', 'कक्षा स्क्रीन पर चुनिए कि डिस्प्ले पर कौन है, फिर उनका अभ्यास उन्हीं के नाम से रखा जाएगा।'],

  'help.keys': ['Keys worth knowing', 'काम के बटन'],
  'help.keysReader': ['move through the expression', 'व्यंजक में चलिए'],
  'help.keysSay': ['say the part you are on', 'जिस हिस्से पर हैं वह बोलिए'],
  'help.keysWrite': ['write braille, six keys like a Perkins', 'ब्रेल लिखिए, पर्किन्स जैसे छह बटन'],
  'help.keysTeach': ['next and previous question while teaching', 'पढ़ाते समय अगला और पिछला सवाल'],

  'help.about': ['About Braillix', 'ब्रेलिक्स के बारे में'],
  'help.aboutText': [
    'Braillix turns mathematics into braille and drives a refreshable display, on however many cells it has — one or forty. It has no account, no server and no API key, and everything it does works with the network unplugged. Nemeth is used for the mathematics; the words around it are written in Bharati Braille, which is the same for all nine Indian scripts — Devanagari, Bengali, Gurmukhi, Gujarati, Oriya, Tamil, Telugu, Kannada and Malayalam. Both tables are cited in the repository.',
    'ब्रेलिक्स गणित को ब्रेल में बदलता है और रिफ्रेशेबल डिस्प्ले चलाता है — चाहे उसमें एक सेल हो या चालीस। इसमें न कोई खाता है, न सर्वर, न कोई API कुंजी, और यह सब कुछ नेटवर्क के बिना करता है। गणित के लिए नेमेथ; आसपास के शब्द भारती ब्रेल में, जो नौ भारतीय लिपियों के लिए एक ही है — देवनागरी, बांग्ला, गुरमुखी, गुजराती, ओड़िया, तमिल, तेलुगु, कन्नड़ और मलयालम। दोनों तालिकाओं के स्रोत रिपॉज़िटरी में दर्ज हैं।',
  ],

  /* ---- marking an answer ---- */
  'fb.nothing': ['Nothing written yet.', 'अभी कुछ नहीं लिखा।'],
  'fb.correct': ['Correct.', 'सही।'],
  'fb.correctAll': ['Correct — all {count} cells.', 'सही — पूरी {count} सेल।'],
  'fb.notFinished': ['Not finished yet.', 'अभी पूरा नहीं हुआ।'],
  'fb.tooLong': ['One cell too many.', 'एक सेल ज़्यादा है।'],
  'fb.almost': ['Almost — one cell is wrong.', 'लगभग — एक सेल ग़लत है।'],
  'fb.manyWrong': ['{count} cells are wrong.', '{count} सेल ग़लत हैं।'],
  'fb.lengthNext': [
    'The answer is {expected} cells long; you wrote {given}. The next one is {cell}.',
    'उत्तर {expected} सेल का है; आपने {given} लिखीं। अगली सेल है {cell}।',
  ],
  'fb.lengthOnly': [
    'The answer is {expected} cells long; you wrote {given}.',
    'उत्तर {expected} सेल का है; आपने {given} लिखीं।',
  ],
  'fb.extraDots': [
    'Cell {index}: you raised dot {dots}, which should not be there.',
    'सेल {index}: आपने डॉट {dots} उठाया, जो नहीं होना चाहिए।',
  ],
  'fb.missingDots': ['Cell {index}: dot {dots} is missing.', 'सेल {index}: डॉट {dots} छूट गया।'],
  'fb.youWrote': ['You wrote {given}; it should be {expected}.', 'आपने {given} लिखा; होना चाहिए {expected}।'],
  'fb.moreDiffer': ['{count} more cells after that also differ.', 'उसके बाद {count} और सेल भी अलग हैं।'],
  'fb.moreDifferOne': ['1 more cell after that also differs.', 'उसके बाद 1 और सेल भी अलग है।'],

  /* ---- the class ---- */
  'nav.class': ['Class', 'कक्षा'],
  'nav.class.hint': ['Worksheets, students and what they have done', 'वर्कशीट, विद्यार्थी और उनका किया हुआ काम'],
  'class.title': ['Your class', 'आपकी कक्षा'],
  'class.lede': [
    'Worksheets you prepare, the children who read them, and what they have done. All of it stays on this laptop, and moves to another one as a file.',
    'आपकी बनाई वर्कशीट, उन्हें पढ़ने वाले बच्चे, और उनका किया हुआ काम। सब कुछ इसी लैपटॉप पर रहता है, और दूसरे लैपटॉप पर फ़ाइल के रूप में जाता है।',
  ],
  'class.tabs': ['What to look at', 'क्या देखना है'],
  'class.worksheets': ['Worksheets', 'वर्कशीट'],
  'class.students': ['Students', 'विद्यार्थी'],
  'class.records': ['Records', 'रिकॉर्ड'],

  'class.newWorksheet': ['New worksheet', 'नई वर्कशीट'],
  'class.worksheetName': ['Worksheet name', 'वर्कशीट का नाम'],
  'class.untitled': ['Tuesday, fractions', 'मंगलवार, भिन्न'],
  'class.noWorksheets': [
    'No worksheets yet. A worksheet is just a list of things you want on the display, in the order you want them — make one and add today’s sums to it.',
    'अभी कोई वर्कशीट नहीं है। वर्कशीट बस उन चीज़ों की सूची है जिन्हें आप डिस्प्ले पर चाहते हैं, आपके क्रम में — एक बनाइए और आज के सवाल उसमें जोड़िए।',
  ],
  'class.items': ['{count} items', '{count} सवाल'],
  'class.itemsOne': ['1 item', '1 सवाल'],
  'class.addItem': ['Add a question', 'सवाल जोड़िए'],
  'class.addItemHint': [
    'Type it as you would on the Board — 1/2, sqrt(9), or a whole question with words in it.',
    'जैसे बोर्ड पर लिखते हैं वैसे लिखिए — 1/2, sqrt(9), या शब्दों वाला पूरा सवाल।',
  ],
  'class.add': ['Add', 'जोड़िए'],
  'class.noItems': [
    'Nothing in this worksheet yet. Add the first question below, or add one from the Board while you are writing it.',
    'इस वर्कशीट में अभी कुछ नहीं है। नीचे पहला सवाल जोड़िए, या बोर्ड पर लिखते समय वहीं से जोड़ दीजिए।',
  ],
  'class.moveUp': ['Move up', 'ऊपर ले जाइए'],
  'class.moveDown': ['Move down', 'नीचे ले जाइए'],
  'class.removeItem': ['Remove', 'हटाइए'],
  'class.putOnBoard': ['Put on the board', 'बोर्ड पर लगाइए'],
  'class.teach': ['Teach this worksheet', 'यह वर्कशीट पढ़ाइए'],
  'class.deleteWorksheet': ['Delete this worksheet', 'यह वर्कशीट हटाइए'],
  'class.confirmDelete': ['Delete “{name}” and everything in it?', '“{name}” और उसमें सब कुछ हटा दें?'],

  'class.studentName': ['Name', 'नाम'],
  'class.studentGroup': ['Class or group', 'कक्षा या समूह'],
  'class.addStudent': ['Add student', 'विद्यार्थी जोड़िए'],
  'class.noStudents': [
    'No students yet. Add the children who use this display, and their practice will be kept against their name instead of in one pile.',
    'अभी कोई विद्यार्थी नहीं है। जो बच्चे यह डिस्प्ले इस्तेमाल करते हैं उन्हें जोड़िए, फिर उनका अभ्यास उन्हीं के नाम से रखा जाएगा।',
  ],
  'class.atTheDisplay': ['At the display now', 'अभी डिस्प्ले पर'],
  'class.nobody': ['Nobody — practice is not being recorded', 'कोई नहीं — अभ्यास दर्ज नहीं हो रहा'],
  'class.remove': ['Remove', 'हटाइए'],
  'class.confirmRemoveStudent': ['Remove {name} and everything recorded for them?', '{name} और उनका दर्ज सब कुछ हटा दें?'],

  'class.colStudent': ['Student', 'विद्यार्थी'],
  'class.colGroup': ['Group', 'समूह'],
  'class.colAttempts': ['Attempts', 'प्रयास'],
  'class.colCorrect': ['Correct', 'सही'],
  'class.colLast': ['Last worked', 'आख़िरी बार'],
  'class.never': ['not yet', 'अभी नहीं'],
  'class.noRecords': [
    'Nothing recorded yet. Choose who is at the display on the Students tab, then let them practise — every answer is kept here, on this machine only.',
    'अभी कुछ दर्ज नहीं है। “विद्यार्थी” में चुनिए कि डिस्प्ले पर कौन है, फिर उन्हें अभ्यास करने दीजिए — हर उत्तर यहीं, सिर्फ़ इसी मशीन पर रखा जाएगा।',
  ],
  'class.exportCsv': ['Save the records as a spreadsheet', 'रिकॉर्ड को स्प्रेडशीट में सहेजिए'],
  'class.exportAll': ['Save everything to a file', 'सब कुछ फ़ाइल में सहेजिए'],
  'class.import': ['Open a file from another laptop', 'दूसरे लैपटॉप की फ़ाइल खोलिए'],
  'class.imported': [
    'Added {worksheets} worksheets, {items} questions, {students} students and {records} records.',
    '{worksheets} वर्कशीट, {items} सवाल, {students} विद्यार्थी और {records} रिकॉर्ड जोड़े गए।',
  ],
  'class.importFailed': [
    'That file is not a Braillix file, or it is damaged. Nothing was changed.',
    'यह ब्रेलिक्स की फ़ाइल नहीं है, या ख़राब है। कुछ भी नहीं बदला गया।',
  ],
  'class.eraseAll': ['Erase everything on this laptop', 'इस लैपटॉप से सब कुछ मिटाइए'],
  'class.confirmErase': [
    'Erase every worksheet, student and record on this laptop? Save a file first if you want to keep them.',
    'इस लैपटॉप की हर वर्कशीट, विद्यार्थी और रिकॉर्ड मिटा दें? रखना हो तो पहले फ़ाइल सहेज लीजिए।',
  ],
  'class.privacy': [
    'Braillix has no account and no server. Nothing here has ever left this laptop, and nothing here can.',
    'ब्रेलिक्स में न कोई खाता है न सर्वर। यहाँ का कुछ भी कभी इस लैपटॉप से बाहर नहीं गया, और जा भी नहीं सकता।',
  ],

  /* ---- teaching ---- */
  'teach.title': ['Teaching {name}', '{name} पढ़ाया जा रहा है'],
  'teach.position': ['{index} of {total}', '{total} में से {index}'],
  'teach.close': ['Close', 'बंद कीजिए'],
  'teach.previous': ['Previous question', 'पिछला सवाल'],
  'teach.next': ['Next question', 'अगला सवाल'],
  'teach.say': ['Say it', 'बोलिए'],
  'teach.keys': ['arrow keys to move · escape to close', 'तीर बटनों से चलें · एस्केप से बंद करें'],
  'teach.onDisplay': ['This is on the display now', 'यह अभी डिस्प्ले पर है'],
  'teach.empty': ['This worksheet has nothing in it yet.', 'इस वर्कशीट में अभी कुछ नहीं है।'],

  /* ---- adding from the board ---- */
  'board.addTo': ['Add to worksheet', 'वर्कशीट में जोड़िए'],
  'board.added': ['Added to {name}', '{name} में जोड़ा गया'],

  /* ---- practice ---- */
  'prac.title': ['Practice', 'अभ्यास'],
  'prac.lede': [
    'Read the dots, or write them yourself. Answers are marked on the braille, so any correct way of writing the maths counts.',
    'डॉट्स पढ़िए, या खुद लिखिए। जाँच ब्रेल पर होती है, इसलिए गणित लिखने का हर सही तरीका गिना जाता है।',
  ],
  'prac.hintRead': [
    'Read these dots — with your fingers on a connected display, or here on screen.',
    'इन डॉट्स को पढ़िए — जुड़े हुए डिस्प्ले पर उँगलियों से, या यहाँ स्क्रीन पर।',
  ],
  'prac.hintWrite': ['What you write appears here, cell by cell.', 'आप जो लिखते हैं वह यहाँ सेल-दर-सेल दिखता है।'],
  'prac.lessons': ['Lessons', 'पाठ'],
  'prac.yourWorksheets': ['Your worksheets', 'आपकी वर्कशीट'],
  'prac.recordingFor': ['Recording for {name}', '{name} के लिए दर्ज हो रहा है'],
  'prac.recordingNobody': [
    'Nobody is chosen, so nothing is being recorded. Choose a student on the Class screen.',
    'कोई चुना नहीं गया, इसलिए कुछ दर्ज नहीं हो रहा। कक्षा स्क्रीन पर विद्यार्थी चुनिए।',
  ],
  'prac.erase': ['Erase my progress', 'मेरी प्रगति मिटाएँ'],
  'prac.privacy': [
    'Progress is stored on this computer only. Nothing is uploaded, and there is no account.',
    'प्रगति सिर्फ़ इसी कंप्यूटर पर रहती है। कुछ भी अपलोड नहीं होता, और कोई खाता नहीं है।',
  ],
  'prac.drillType': ['Drill type', 'अभ्यास का प्रकार'],
  'prac.drillRead': ['Read the dots', 'डॉट्स पढ़िए'],
  'prac.drillWrite': ['Write the braille', 'ब्रेल लिखिए'],
  'prac.question': ['Question {index} of {total}', '{total} में से प्रश्न {index}'],
  'prac.score': ['{correct} of {total} answered correctly', '{total} में से {correct} सही'],
  'prac.promptRead': ['{count} cells are on the display. What does it say?', 'डिस्प्ले पर {count} सेल हैं। यह क्या कहता है?'],
  'prac.promptReadPaged': [
    '{count} cells are on the display ({width} at a time). What does it say?',
    'डिस्प्ले पर {count} सेल हैं (एक बार में {width})। यह क्या कहता है?',
  ],
  'prac.yourAnswer': ['Your answer', 'आपका उत्तर'],
  'prac.answerHint': ['for example 1/2 or x^2+1', 'जैसे 1/2 या x^2+1'],
  'prac.promptWrite': ['Write this in braille', 'इसे ब्रेल में लिखिए'],
  'prac.dot': ['dot {dot}', 'डॉट {dot}'],
  'prac.chordHint': ['press the dots together, then let go', 'डॉट्स एक साथ दबाइए, फिर छोड़ दीजिए'],
  'prac.nothingWritten': ['nothing written yet', 'अभी कुछ नहीं लिखा'],
  'prac.space': ['Space', 'खाली जगह'],
  'prac.deleteLast': ['Delete last', 'आख़िरी मिटाएँ'],
  'prac.startAgain': ['Start again', 'फिर से शुरू'],
  'prac.check': ['Check my answer', 'मेरा उत्तर जाँचिए'],
  'prac.reveal': ['Show me', 'दिखाइए'],
  'prac.theAnswer': ['The answer', 'उत्तर'],
  'prac.speechOff': [
    'Speech is switched off — turn it on from the Board to hear each question.',
    'वाणी बंद है — हर प्रश्न सुनने के लिए बोर्ड से इसे चालू कीजिए।',
  ],
  'prac.sayReading': ['Reading drill: {count} cells on the display. Type what they say.', 'पढ़ने का अभ्यास: डिस्प्ले पर {count} सेल। लिखिए कि वे क्या कहते हैं।'],
  'prac.sayNothing': ['Nothing written yet.', 'अभी कुछ नहीं लिखा।'],
  'prac.sayWritten': ['{count} cells written.', '{count} सेल लिखी गईं।'],

  /* ---- reading handwriting ---- */
  'rec.notInstalled': ['Recognition is not installed.', 'पहचान स्थापित नहीं है।'],
  'rec.notInstalledFix': [
    'Everything else in Braillix works exactly as it does with it — type the expression instead and nothing is lost but the photograph.',
    'ब्रेलिक्स का बाक़ी सब वैसे ही चलता है — व्यंजक टाइप कर दीजिए, सिर्फ़ फ़ोटो का रास्ता बंद है।',
  ],
  'rec.image': ['The image', 'चित्र'],
  'rec.how': ['How to provide the maths', 'गणित कैसे दें'],
  'rec.photoOrFile': ['Photo or file', 'फ़ोटो या फ़ाइल'],
  'rec.writeIt': ['Write it', 'हाथ से लिखिए'],
  'rec.choosePhoto': ['Choose a photo', 'फ़ोटो चुनिए'],
  'rec.chooseLabel': ['Choose a photo of an equation', 'समीकरण की फ़ोटो चुनिए'],
  'rec.cameraNote': [
    'On a phone this opens the camera. On a laptop, pick a picture — there are some ready-made ones below.',
    'फ़ोन पर यह कैमरा खोलता है। लैपटॉप पर कोई चित्र चुनिए — नीचे कुछ तैयार चित्र रखे हैं।',
  ],
  'rec.whatItRead': ['What it read', 'इसने क्या पढ़ा'],
  'rec.chooseSomething': ['Choose or draw something and it will appear here.', 'कुछ चुनिए या बनाइए, वह यहाँ दिखेगा।'],
  'rec.whatItSees': ['What the recogniser sees', 'पहचानकर्ता को क्या दिखता है'],
  'rec.inverted': ['inverted (light writing on a dark background)', 'उलटा किया गया (गहरे पर हल्का लेखन)'],
  'rec.cropped': ['cropped to the writing', 'लेखन तक काटा गया'],
  'rec.reading': ['Reading…', 'पढ़ा जा रहा है…'],
  'rec.readThis': ['Read this image', 'यह चित्र पढ़िए'],
  'rec.typeInstead': [
    'You can always type the expression by hand — the “Type it” tab is right there.',
    'आप व्यंजक हमेशा हाथ से लिख सकते हैं — “लिखिए” वाला हिस्सा सामने ही है।',
  ],
  'rec.good': ['Looks right', 'ठीक लगता है'],
  'rec.uncertain': ['Check this one', 'इसे जाँच लीजिए'],
  'rec.bad': ['Probably misread', 'शायद ग़लत पढ़ा'],
  'rec.onDevice': ['{ms} ms · on this device', '{ms} ms · इसी डिवाइस पर'],
  'rec.correctIt': ['Recognised maths — correct it if it is wrong', 'पहचाना गया गणित — ग़लत हो तो सुधार दीजिए'],
  'rec.checkPrint': ['Check it in print before you send it', 'भेजने से पहले छपाई में जाँच लीजिए'],
  'rec.send': ['Put this on the board', 'इसे बोर्ड पर लगाइए'],
  'rec.lastWord': [
    'Nothing reaches the display until you press that. The model’s answer is a suggestion, not a verdict.',
    'जब तक आप यह नहीं दबाते, डिस्प्ले पर कुछ नहीं जाता। मॉडल का उत्तर एक सुझाव है, फ़ैसला नहीं।',
  ],
  'rec.samples': ['Sample images', 'नमूना चित्र'],
  'rec.secondTry': ['Reading it a second time…', 'दूसरी बार पढ़ा जा रहा है…'],
  'rec.agree': [
    'Read twice, two different ways, and both readings agree.',
    'दो अलग तरीक़ों से दो बार पढ़ा गया, और दोनों बार एक ही निकला।',
  ],
  'rec.disagree': [
    'The second reading came out differently. Pick whichever matches the writing.',
    'दूसरी बार अलग निकला। जो लिखावट से मिलता हो वही चुनिए।',
  ],
  'rec.readingOne': ['First reading', 'पहली बार'],
  'rec.readingTwo': ['With more contrast', 'ज़्यादा कंट्रास्ट के साथ'],
  'rec.draw': ['Draw an equation here', 'यहाँ समीकरण बनाइए'],

  /* ---- device: connection and calibration ---- */
  'hw.title': ['Hardware', 'हार्डवेयर'],
  'hw.lede': [
    'Braillix is complete without any of this. Connect a pod and the same frames go out over the wire instead of onto the screen — nothing else changes.',
    'इसके बिना भी ब्रेलिक्स पूरा है। पॉड जोड़िए और वही फ़्रेम स्क्रीन के बजाय तार पर चले जाते हैं — और कुछ नहीं बदलता।',
  ],
  'hw.connection': ['Connection', 'कनेक्शन'],
  'hw.now': ['Now', 'अभी'],
  'hw.cells': ['Cells', 'सेल'],
  'hw.simulated': ['(simulated)', '(नक़ली)'],
  'hw.reported': ['(reported by the hardware)', '(हार्डवेयर ने बताया)'],
  'hw.firmware': ['Firmware', 'फ़र्मवेयर'],
  'hw.pods': ['Pods', 'पॉड'],
  'hw.useSim': ['Use the simulator', 'सिम्युलेटर चलाइए'],
  'hw.connectUsb': ['Connect over USB', 'USB से जोड़िए'],
  'hw.usbHint': ['Recommended for demos — no network needed', 'प्रदर्शन के लिए सबसे अच्छा — नेटवर्क की ज़रूरत नहीं'],
  'hw.wifiPods': ['Wi-Fi pods (comma separated)', 'Wi-Fi पॉड (अल्पविराम से अलग)'],
  'hw.connect': ['Connect', 'जोड़िए'],
  'hw.podMode': ['Several displays', 'कई डिस्प्ले'],
  'hw.chain': ['Joined into one long line', 'एक लंबी पंक्ति में जुड़े'],
  'hw.chainHint': [
    'Pod 1 shows the first cells, pod 2 the next — one wide display built from several small ones.',
    'पॉड 1 पहली सेल दिखाता है, पॉड 2 अगली — कई छोटे पॉड मिलकर एक चौड़ा डिस्प्ले।',
  ],
  'hw.mirror': ['All showing the same', 'सब एक ही दिखा रहे हैं'],
  'hw.mirrorHint': [
    'Every child gets the same expression under their own fingers. The display is as wide as the smallest pod, so nobody loses the end of the line.',
    'हर बच्चे की उँगलियों के नीचे वही व्यंजक। डिस्प्ले सबसे छोटे पॉड जितना चौड़ा रहता है, ताकि किसी की पंक्ति अधूरी न रहे।',
  ],
  'hw.noPod': [
    'No pod on the bench? Run npm run pod and connect to 127.0.0.1:8080 — it speaks the real protocol.',
    'पॉड मौजूद नहीं? npm run pod चलाइए और 127.0.0.1:8080 से जुड़िए — यह असली प्रोटोकॉल बोलता है।',
  ],
  'hw.simCells': ['Simulated cells', 'नक़ली सेल'],
  'hw.advanced': ['Setting up the hardware', 'हार्डवेयर सेट करना'],
  'hw.advancedHint': [
    'Cam wiring, the test dot, and what travels down the wire. Whoever assembled the display needs this once; a teacher never does.',
    'कैम की वायरिंग, जाँच वाला डॉट, और तार पर क्या जाता है। जिसने डिस्प्ले जोड़ा उसे यह एक बार चाहिए; शिक्षक को कभी नहीं।',
  ],
  'hw.show': ['Show', 'दिखाइए'],
  'hw.hide': ['Hide', 'छिपाइए'],
  'hw.calibration': ['Calibration', 'कैलिब्रेशन'],
  'hw.calLede': [
    'The handoff flags one thing as unconfirmed: whether dot 1 really drives cam track 0. Raise one dot below and look at the cell. If a different dot pops up, correct the mapping here — it is a setting, not a code change.',
    'हैंडऑफ़ में एक बात अपुष्ट है: क्या डॉट 1 सचमुच कैम ट्रैक 0 चलाता है। नीचे कोई एक डॉट उठाइए और सेल देखिए। अगर कोई और डॉट उठे तो यहीं मैपिंग ठीक कर लीजिए — यह सेटिंग है, कोड बदलना नहीं।',
  ],
  'hw.raiseDot': ['Raise a single dot', 'एक डॉट उठाइए'],
  'hw.cam': ['cam {position}', 'कैम {position}'],
  'hw.clear': ['Clear', 'हटाइए'],
  'hw.whichTrack': ['Which cam track each dot drives', 'कौन-सा डॉट कौन-सा कैम ट्रैक चलाता है'],
  'hw.dot': ['Dot', 'डॉट'],
  'hw.camBit': ['Cam track bit', 'कैम ट्रैक बिट'],
  'hw.dotN': ['dot {dot}', 'डॉट {dot}'],
  'hw.bitN': ['bit {bit}', 'बिट {bit}'],
  'hw.reversed': [
    'Cell 1 is on the right (dock assembled the other way round)',
    'सेल 1 दाईं ओर है (डॉक उल्टा जुड़ा है)',
  ],
  'hw.home': ['Home every cell', 'हर सेल को घर भेजिए'],
  'hw.copyConfig': ['Copy config for the hardware team', 'हार्डवेयर टीम के लिए कॉन्फ़िग कॉपी कीजिए'],
  'hw.copied': ['Copied', 'कॉपी हो गया'],
  'hw.sanity': [
    'Sanity check: with this mapping, dots 1-2-5 is cam position {position}. The handoff’s worked example says 19 — if these disagree, the mapping above is not the one the cam was cut for.',
    'जाँच: इस मैपिंग से डॉट 1-2-5 की कैम स्थिति {position} बनती है। हैंडऑफ़ के उदाहरण में 19 है — अगर ये अलग हैं तो ऊपर की मैपिंग वह नहीं है जिसके लिए कैम कटी थी।',
  ],
  'hw.wire': ['What goes over the wire', 'तार पर क्या जाता है'],
  'hw.wireLede': [
    'The pod never sees braille, a language, or a maths code — only cam numbers 0–63. That is what lets the translation change without anyone reflashing a board.',
    'पॉड कभी ब्रेल, भाषा या गणित की लिपि नहीं देखता — सिर्फ़ 0–63 के कैम नंबर। इसीलिए अनुवाद बदलने पर किसी बोर्ड को दोबारा फ़्लैश नहीं करना पड़ता।',
  ],
  'hw.protoNote': [
    'Full specification in docs/PROTOCOL.md. The same verbs work over USB serial as newline-delimited JSON at 115200 baud, so one firmware serves both links.',
    'पूरा विवरण docs/PROTOCOL.md में है। यही आदेश USB सीरियल पर 115200 बॉड पर न्यूलाइन-अलग JSON के रूप में चलते हैं, इसलिए एक ही फ़र्मवेयर दोनों रास्तों के लिए काफ़ी है।',
  ],

  /* ---- device: the cell atlas ---- */
  'atlas.title': ['Cell atlas', 'सेल एटलस'],
  'atlas.lede': [
    'Every pattern a single braille cell can make — sixty-four of them, one per cam position. This is the sheet to hold against the physical cam: if a printed cell shows the wrong dots, the cam number here and the track order on the disc disagree.',
    'एक ब्रेल सेल जितने भी रूप बना सकती है — चौंसठ, हर कैम स्थिति के लिए एक। यही वह पन्ना है जिसे असली कैम के सामने रखकर मिलाना है: अगर छपी सेल में ग़लत डॉट दिखें तो यहाँ का कैम नंबर और डिस्क पर ट्रैक का क्रम मेल नहीं खाते।',
  ],
  'atlas.profile': ['Wiring profile: dot→bit {order} · {order2} order', 'वायरिंग प्रोफ़ाइल: डॉट→बिट {order} · {order2} क्रम'],
  'atlas.reversed': ['reversed', 'उल्टा'],
  'atlas.normal': ['normal', 'सामान्य'],
  'atlas.cam': ['cam {position}', 'कैम {position}'],
  'atlas.blank': ['blank', 'खाली'],

  /* ---- the display ---- */
  'display.title': ['The display', 'डिस्प्ले'],
  'display.cells': ['Cells', 'सेल'],
  'display.oneCell': [
    'One cell — the hardware that exists today. A whole equation still has to fit through it.',
    'एक सेल — आज जो हार्डवेयर मौजूद है। पूरा समीकरण इसी एक सेल से पढ़ना है।',
  ],
  'display.manyCells': [
    '{count} cells — stack more and the same expression simply spreads out.',
    '{count} सेल — जितने बढ़ाएँ, वही व्यंजक उतना ही फैल जाता है।',
  ],
  'display.previous': ['Previous', 'पिछला'],
  'display.next': ['Next', 'अगला'],
  'display.braille': ['The braille', 'ब्रेल'],
  'display.stepIn': ['step in', 'अंदर जाएँ'],

  /* ---- the reading window ---- */
  'window.nothing': ['nothing to read', 'पढ़ने को कुछ नहीं'],
  'window.one': ['one cell', 'एक सेल'],
  'window.all': ['all {total} cells', 'सभी {total} सेल'],
  'window.single': ['cell {index} of {total}', '{total} में से सेल {index}'],
  'window.range': ['cells {from}–{to} of {total}', '{total} में से सेल {from}–{to}'],

  /* ---- status strip ---- */
  'status.title': ['System status', 'सिस्टम की स्थिति'],
  'status.display': ['Display', 'डिस्प्ले'],
  'status.motion': ['Motion', 'गति'],
  'status.idle': ['idle', 'खाली'],
  'status.ready': ['ready', 'तैयार'],
  'status.checking': ['checking', 'जाँच जारी'],
  'status.degraded': ['degraded', 'सीमित'],
  'status.off': ['off', 'बंद'],
  'cap.sre': ['Maths engine', 'गणित इंजन'],
  'cap.speech': ['Speech', 'वाणी'],
  'cap.recognition': ['Recognition', 'पहचान'],
  'cap.usb': ['USB display', 'USB डिस्प्ले'],
  'cap.pod': ['Display', 'डिस्प्ले'],
  'cap.offline': ['Offline copy', 'ऑफ़लाइन प्रति'],

  /* ---- the reader ---- */
  'reader.title': ['How to read it', 'कैसे पढ़ें'],
  'reader.mode': ['Reading mode', 'पढ़ने का तरीका'],
  'reader.whole': ['Whole expression', 'पूरा व्यंजक'],
  'reader.explore': ['Explore structure', 'रचना देखिए'],
  'reader.wholeBlurb': [
    'Every cell of the expression in order — what a conventional braille display does. On one cell that is {count} separate readings, with nothing to tell you where you are. Try Explore structure.',
    'व्यंजक की हर सेल क्रम से — जैसा आम ब्रेल डिस्प्ले करता है। एक ही सेल पर यह {count} अलग-अलग पाठ हैं, और यह बताने वाला कुछ नहीं कि आप कहाँ हैं। “रचना देखिए” आज़माइए।',
  ],
  'reader.youAreOn': ['You are on {label}.', 'आप {label} पर हैं।'],
  'reader.nothing': ['nothing', 'कुछ नहीं'],
  'reader.showingFull': ['Showing it in full.', 'पूरा दिखाया जा रहा है।'],
  'reader.shownBecause': ['Shown in full — {reason}.', 'पूरा दिखाया गया — {reason}।'],
  'reader.folded': ['Its parts are folded into ⠿ — step into one to read it.', 'इसके हिस्से ⠿ में समेटे गए हैं — किसी एक में जाकर पढ़िए।'],
  'reader.move': ['Move through the expression', 'व्यंजक में घूमिए'],
  'reader.out': ['Out', 'बाहर'],
  'reader.prev': ['Prev', 'पिछला'],
  'reader.say': ['Say', 'बोलिए'],
  'reader.next': ['Next', 'अगला'],
  'reader.in': ['In', 'अंदर'],
  'reader.foldUp': ['Fold the parts back up', 'हिस्सों को फिर समेटिए'],
  'reader.showFull': ['Show this part in full', 'यह हिस्सा पूरा दिखाइए'],
  'reader.keysMove': ['move', 'चलें'],
  'reader.keysExpand': ['expand', 'खोलें'],
  'reader.spoken': ['Spoken', 'बोला गया'],
  'reader.pod': [
    'The same three moves are the pod’s three buttons: Prev, Select (in; hold to go out), Next.',
    'यही तीन गतियाँ पॉड के तीन बटन हैं: Prev, Select (अंदर; दबाए रखें तो बाहर), Next।',
  ],
  'reader.speakAsIRead': ['Speak as I read', 'पढ़ते समय बोलिए'],
  'reader.rate': ['Rate', 'गति'],
  'reader.noStructureQuestion': [
    'This is a question with words in it, so there is no single expression to walk through. Reading the whole line still works, and the maths inside it is still Nemeth.',
    'इस पंक्ति में शब्द भी हैं, इसलिए घूमने के लिए कोई एक व्यंजक नहीं है। पूरी पंक्ति पढ़ना अब भी चलता है, और उसके अंदर का गणित अब भी नेमेथ है।',
  ],
  'reader.noStructure': [
    'Structure analysis isn’t available for this expression, so exploring is switched off. Reading the whole expression still works.',
    'इस व्यंजक की रचना का विश्लेषण उपलब्ध नहीं है, इसलिए “रचना देखिए” बंद है। पूरा व्यंजक पढ़ना अब भी चलता है।',
  ],

  /* ---- the evidence table ---- */
  'evidence.count': ['{count} cells · Nemeth', '{count} सेल · नेमेथ'],
  'evidence.countOne': ['1 cell · Nemeth', '1 सेल · नेमेथ'],
  'evidence.empty': [
    'Nothing translated yet. Write an expression — or pick an example — and every cell, dot and cam number will be listed here.',
    'अभी कुछ अनूदित नहीं हुआ। कोई व्यंजक लिखिए — या उदाहरण चुनिए — और हर सेल, डॉट और कैम नंबर यहाँ दिखेगा।',
  ],
  'evidence.caption': [
    'Every braille cell in this expression, with its raised dots, what it means in Nemeth, and the cam position sent to the hardware.',
    'इस व्यंजक की हर ब्रेल सेल — उसके उठे हुए डॉट, नेमेथ में उसका अर्थ, और हार्डवेयर को भेजी गई कैम स्थिति।',
  ],
  'evidence.col.index': ['#', '#'],
  'evidence.col.cell': ['Cell', 'सेल'],
  'evidence.col.dots': ['Dots', 'डॉट'],
  'evidence.col.meaning': ['What it means', 'इसका अर्थ'],
  'evidence.col.cam': ['Cam', 'कैम'],
  'evidence.jump': ['Scroll the display to cell {index}', 'डिस्प्ले को सेल {index} पर ले जाएँ'],
  'evidence.foot': [
    'Cam positions follow the current wiring profile. If the physical cam is wired differently, change it once on the Device screen — the braille above never changes.',
    'कैम स्थितियाँ मौजूदा वायरिंग प्रोफ़ाइल के अनुसार हैं। अगर असली कैम अलग तरह से जुड़ी है तो डिवाइस स्क्रीन पर एक बार बदल दीजिए — ऊपर की ब्रेल कभी नहीं बदलती।',
  ],

  /* ---- spoken announcements (ARIA live regions) ---- */
  'say.display': ['Display: {count} cells, {label}.', 'डिस्प्ले: {count} सेल, {label}।'],
  'say.displayOne': ['Display: one cell, {label}.', 'डिस्प्ले: एक सेल, {label}।'],
  'say.cellsNow': ['Display is now {count} cells.', 'अब डिस्प्ले में {count} सेल हैं।'],
  'say.cellsNowOne': ['Display is now one cell.', 'अब डिस्प्ले में एक सेल है।'],
  'say.homed': ['Every cell homed to blank.', 'हर सेल खाली स्थिति पर लौट आई।'],
  'say.testDot': ['Raising dot {dot} on every cell.', 'हर सेल में डॉट {dot} उठाया जा रहा है।'],
  'say.testCleared': ['Test pattern cleared.', 'जाँच पैटर्न हटा दिया गया।'],
  'say.cells': ['{count} braille cells.', '{count} ब्रेल सेल।'],
  'say.whole': ['Reading the whole expression — {count} cells.', 'पूरा व्यंजक पढ़ा जा रहा है — {count} सेल।'],
  'say.node': ['{label}. {count} cells.', '{label}। {count} सेल।'],
};

export type StringKey = keyof typeof STRINGS;

/** Every key, for the completeness test and for tooling. */
export function allKeys(): StringKey[] {
  return Object.keys(STRINGS) as StringKey[];
}

/* ------------------------------------------------------------------ the store */

function initialLang(): Lang {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'hi') return saved;
  }
  if (typeof navigator !== 'undefined' && navigator.language?.startsWith('hi')) return 'hi';
  return 'en';
}

let current: Lang = initialLang();
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function lang(): Lang {
  return current;
}

export function setLang(next: Lang): void {
  if (next === current) return;
  current = next;
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, next);
  if (typeof document !== 'undefined') document.documentElement.lang = next;
  for (const listener of listeners) listener();
}

/* ------------------------------------------------------------------ translating */

/**
 * Look a string up. Interpolates `{name}` placeholders.
 *
 * A missing key returns the key itself rather than an empty string — a visible `board.title` on
 * screen is a bug report; an empty heading is a mystery.
 */
export function translate(key: StringKey, vars?: Record<string, string | number>, forLang: Lang = current): string {
  const entry = STRINGS[key];
  if (!entry) return key;
  let text = forLang === 'hi' ? entry[1] : entry[0];
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value));
    }
  }
  return text;
}

/**
 * A pair of strings authored together, in both languages.
 *
 * Used for *content* rather than interface chrome — lesson text, worksheet titles a teacher typed,
 * anything where the two languages belong side by side in the file that owns the meaning rather
 * than in the central table.
 */
export type Bilingual = readonly [en: string, hi: string];

function pick(text: Bilingual, forLang: Lang = current): string {
  return forLang === 'hi' ? text[1] : text[0];
}

/** `pick`, but reactive — the component re-renders when the language changes. Memoised, as above. */
export function usePick(): (text: Bilingual) => string {
  const active = useSyncExternalStore(subscribe, lang, () => 'en' as Lang);
  return useCallback((text: Bilingual) => pick(text, active), [active]);
}

/**
 * The hook every component uses. Re-renders when the language changes.
 *
 * The returned function is memoised on the language, which is not a micro-optimisation: an
 * unmemoised translator is a new function on every render, and any effect that lists it as a
 * dependency then re-runs forever. That cost an hour once; it will not cost another.
 */
export function useT(): (key: StringKey, vars?: Record<string, string | number>) => string {
  const active = useSyncExternalStore(subscribe, lang, () => 'en' as Lang);
  return useCallback((key, vars) => translate(key, vars, active), [active]);
}

/** The current language, reactively. For the switch itself and for anything locale-dependent. */
export function useLang(): Lang {
  return useSyncExternalStore(subscribe, lang, () => 'en' as Lang);
}
