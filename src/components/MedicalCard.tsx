import { useState } from 'react';
import { Icon } from './Icons';
import { hasMedicalId, type MedicalId } from '../settings';

const ROWS: [keyof MedicalId, string][] = [
  ['allergies', 'Allergies'],
  ['medications', 'Medications'],
  ['conditions', 'Conditions'],
  ['bloodType', 'Blood type'],
  ['birthYear', 'Born'],
];

/** For a bystander who finds the phone owner: tap to reveal their medical info. */
export function MedicalCard({ medical }: { medical: MedicalId }) {
  const [open, setOpen] = useState(false);
  if (!hasMedicalId(medical)) return null;
  return (
    <div className="medcard">
      <button className="medcard-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="medcard-icon" aria-hidden="true">
          <Icon name="medical" />
        </span>
        <span>
          <strong>Medical ID{medical.name ? ` of ${medical.name}` : ''}</strong>
          <small>Helping the owner of this phone? Tap to see their info.</small>
        </span>
        <span aria-hidden="true">{open ? '▾' : '›'}</span>
      </button>
      {open && <MedicalRows medical={medical} />}
    </div>
  );
}

export function MedicalRows({ medical }: { medical: MedicalId }) {
  return (
    <dl className="medrows">
      {ROWS.filter(([k]) => medical[k].trim()).map(([k, label]) => (
        <div key={k}>
          <dt>{label}</dt>
          <dd>{medical[k]}</dd>
        </div>
      ))}
      {(medical.contactName || medical.contactPhone) && (
        <div>
          <dt>Emergency contact</dt>
          <dd>
            {medical.contactName}{' '}
            {medical.contactPhone && (
              <a href={`tel:${medical.contactPhone.replace(/\s/g, '')}`} className="link">
                {medical.contactPhone}
              </a>
            )}
          </dd>
        </div>
      )}
    </dl>
  );
}

export function medicalText(m: MedicalId) {
  return ROWS.filter(([k]) => m[k].trim())
    .map(([k, l]) => `${l}: ${m[k]}`)
    .concat(m.contactName || m.contactPhone ? [`Emergency contact: ${m.contactName} ${m.contactPhone}`.trim()] : [])
    .join('\n');
}
