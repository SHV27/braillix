/**
 * One control, two languages, everywhere in the product.
 *
 * It lives in the masthead rather than buried in a settings screen because for the intended user it
 * is not a preference — it is the difference between an interface they can read and one they
 * cannot. Changing it also re-checks which voice this machine has, so the status strip tells the
 * truth immediately rather than at the next reload.
 */

import { useBraillix } from '../store';
import { LANGS, useLang, useT, setLang, type Lang } from './i18n';
import './LanguageSwitch.css';

export function LanguageSwitch() {
  const t = useT();
  const active = useLang();
  const refreshSpeech = useBraillix((s) => s.refreshSpeech);

  function choose(next: Lang) {
    setLang(next);
    refreshSpeech();
  }

  return (
    <div className="langswitch" role="group" aria-label={t('app.language')}>
      {LANGS.map((entry) => (
        <button
          key={entry.id}
          type="button"
          lang={entry.id}
          className={`langswitch__btn${active === entry.id ? ' is-current' : ''}`}
          aria-pressed={active === entry.id}
          // The English name is in the accessible name so a screen reader in either language
          // announces something its voice can actually pronounce.
          aria-label={entry.english}
          data-testid={`lang-${entry.id}`}
          onClick={() => choose(entry.id)}
        >
          {entry.label}
        </button>
      ))}
    </div>
  );
}
