/**
 * "That one is good — keep it."
 *
 * A teacher writing tomorrow's questions does it on the Board, one at a time, checking each in
 * print before moving on. Making them then go to another screen and retype what they just checked
 * would be the exact moment they stopped using the worksheets at all. So the shortest path from
 * "this is right" to "it is in Tuesday's list" is one button, here, next to the thing they checked.
 */

import { useState } from 'react';
import { useClass } from '../class/store';
import { useT } from './i18n';
import './AddToWorksheet.css';

const NEW = '__new__';

export function AddToWorksheet({ source }: { source: string }) {
  const t = useT();
  const worksheets = useClass((s) => s.worksheets);
  const currentId = useClass((s) => s.currentWorksheetId);
  const addWorksheet = useClass((s) => s.addWorksheet);
  const addItem = useClass((s) => s.addItem);
  const setCurrent = useClass((s) => s.setCurrentWorksheet);

  const [target, setTarget] = useState<string>(currentId ?? NEW);
  const [added, setAdded] = useState<string | null>(null);

  if (!source.trim()) return null;

  function add() {
    const now = Date.now();
    const chosen = worksheets.find((sheet) => sheet.id === target);
    const id = chosen ? chosen.id : addWorksheet(t('class.untitled'), now);
    addItem(id, source.trim(), now);
    setCurrent(id);
    setTarget(id);
    setAdded(worksheets.find((sheet) => sheet.id === id)?.title ?? t('class.untitled'));
  }

  return (
    <div className="addto">
      <label className="addto__field">
        <span className="field__label">{t('board.addTo')}</span>
        <select
          className="select"
          value={target}
          name="worksheet-target"
          data-testid="worksheet-target"
          onChange={(event) => {
            setTarget(event.target.value);
            setAdded(null);
          }}
        >
          {worksheets.map((sheet) => (
            <option key={sheet.id} value={sheet.id}>
              {sheet.title}
            </option>
          ))}
          <option value={NEW}>+ {t('class.newWorksheet')}</option>
        </select>
      </label>
      <button type="button" className="btn" data-testid="add-to-worksheet" onClick={add}>
        {t('class.add')}
      </button>
      {added && (
        <span className="addto__done" role="status" data-testid="added-message">
          {t('board.added', { name: added })}
        </span>
      )}
    </div>
  );
}
