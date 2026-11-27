import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { LogKind, Session } from '../types';
import { CATEGORY_LABEL } from '../engine';
import { formatFix, type Fix, type useLocation } from '../hooks/useLocation';
import { hasMedicalId, useSettings } from '../settings';
import { LocationCard } from './LocationCard';
import { MedicalRows, medicalText } from './MedicalCard';

const KIND_LABEL: Record<LogKind, string> = {
  situation: 'Situation',
  observation: 'Observed',
  action: 'Done',
  call: 'Call',
  cpr: 'CPR',
  note: 'Note',
};

// Always 24-hour: "07:52" without AM/PM would be ambiguous for the ambulance crew.
const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
const hm = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

function header(s: Session, fix: Fix | null, medical: string) {
  const lines = [
    'CalmAid handover report',
    `Started: ${new Date(s.startedAt).toLocaleString()}`,
    `Situation: ${CATEGORY_LABEL[s.category]}${s.age && s.age !== 'adult' ? ` (${s.age})` : ''}: "${s.description}"`,
  ];
  if (fix) lines.push(`Location: ${formatFix(fix)} (±${fix.accuracy} m)`);
  if (s.cprSeconds > 0) lines.push(`CPR total: ${Math.floor(s.cprSeconds / 60)} min ${s.cprSeconds % 60} s (~${s.compressions} compressions)`);
  if (medical) lines.push('', 'Medical ID (patient):', medical);
  return lines;
}

function toText(s: Session, fix: Fix | null, medical: string) {
  const lines = header(s, fix, medical);
  lines.push('', 'Timeline:');
  s.entries.forEach((e) => lines.push(`${time(e.t)}  [${KIND_LABEL[e.kind]}] ${e.text}`));
  lines.push('', 'Recorded by a lay helper using CalmAid. Not a medical record.');
  return lines.join('\n');
}

/** Compact version for the QR code: keeps the header and the most recent entries within QR capacity. */
function toQrText(s: Session, fix: Fix | null, medical: string) {
  const head = header(s, fix, medical).join('\n') + '\n\nTimeline:\n';
  const rows = s.entries.filter((e) => e.kind !== 'situation').map((e) => `${hm(e.t)} ${e.text}`);
  let body = rows.join('\n');
  while ((head + body).length > 1100 && rows.length > 1) {
    rows.shift();
    body = '…\n' + rows.join('\n');
  }
  return (head + body).slice(0, 1200);
}

interface Props {
  session: Session;
  photo?: string;
  loc: ReturnType<typeof useLocation>;
  onBack: () => void;
  onNew: () => void;
}

/** Big, calm summary that the helper can hand / show to the ambulance crew. */
export function Handover({ session, photo, loc, onBack, onNew }: Props) {
  const { settings } = useSettings();
  const [copied, setCopied] = useState(false);
  const [includeMed, setIncludeMed] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const medical = includeMed ? medicalText(settings.medical) : '';
  const fix = loc.fix;
  const minutes = Math.max(0, Math.round((Date.now() - new Date(session.startedAt).getTime()) / 60000));
  const observations = session.entries.filter((e) => e.kind === 'observation');
  const actions = session.entries.filter((e) => e.kind === 'action' || e.kind === 'cpr' || e.kind === 'call');
  const text = toText(session, fix, medical);

  useEffect(() => {
    if (!showQr) return;
    QRCode.toDataURL(toQrText(session, fix, medical), { errorCorrectionLevel: 'L', margin: 2, width: 560 })
      .then(setQr)
      .catch(() => setQr(null));
  }, [showQr, session, fix, medical]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy the report:', text);
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'CalmAid handover report', text });
      } catch {
        /* cancelled */
      }
    } else copy();
  };

  return (
    <main className="screen handover">
      <div className="flow-top no-print">
        <button className="link" onClick={onBack}>
          ‹ Back to guide
        </button>
      </div>

      <section className="card report">
        <p className="step-kicker">Show this to the paramedics</p>
        <h1 className="report-title">
          {CATEGORY_LABEL[session.category]}
          {session.age && session.age !== 'adult' && <span className="age-tag">{session.age}</span>}
        </h1>
        <div className="report-facts">
          <div>
            <small>Started</small>
            <strong>{hm(session.startedAt)}</strong>
          </div>
          <div>
            <small>Duration</small>
            <strong>{minutes} min</strong>
          </div>
          <div>
            <small>CPR</small>
            <strong>
              {session.cprSeconds > 0 ? `${Math.floor(session.cprSeconds / 60)}:${String(session.cprSeconds % 60).padStart(2, '0')}` : '—'}
            </strong>
          </div>
        </div>

        <button className="btn btn-primary no-print" onClick={() => setShowQr(!showQr)}>
          {showQr ? 'Hide QR code' : 'Show QR code for paramedics'}
        </button>
        {showQr && (
          <div className="qr">
            {qr ? <img src={qr} alt="QR code containing this report" /> : <p className="hint">Creating QR code…</p>}
            <p className="hint">Scan with any phone camera to get the report as text.</p>
          </div>
        )}

        <h2>What the helper said</h2>
        <p className="report-quote">"{session.description}"</p>

        {photo && <img className="report-photo" src={photo} alt="Photo of the situation taken by the helper" />}

        <LocationCard loc={loc} compact />

        {observations.length > 0 && (
          <>
            <h2>Observed</h2>
            <ul className="report-list">
              {observations.map((e, i) => (
                <li key={i}>
                  <time>{hm(e.t)}</time> {e.text}
                </li>
              ))}
            </ul>
          </>
        )}

        <h2>Done so far</h2>
        {actions.length ? (
          <ul className="report-list">
            {actions.map((e, i) => (
              <li key={i}>
                <time>{hm(e.t)}</time> {e.text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="hint">No steps completed yet.</p>
        )}

        {hasMedicalId(settings.medical) && (
          <>
            <label className="check no-print">
              <input type="checkbox" checked={includeMed} onChange={(e) => setIncludeMed(e.target.checked)} />
              <span>The patient is this phone's owner: include their medical ID</span>
            </label>
            {includeMed && (
              <>
                <h2>Medical ID</h2>
                <MedicalRows medical={settings.medical} />
              </>
            )}
          </>
        )}

        <details className="report-timeline">
          <summary>Full timeline ({session.entries.length} entries)</summary>
          <pre>{text}</pre>
        </details>
      </section>

      <div className="row no-print">
        <button className="btn btn-secondary" onClick={copy}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
        <button className="btn btn-secondary" onClick={share}>
          Share
        </button>
        <button className="btn btn-secondary" onClick={() => window.print()}>
          Print
        </button>
      </div>
      <button
        className="btn btn-ghost no-print"
        onClick={() => {
          if (window.confirm('End this emergency and clear the report from this device?')) onNew();
        }}
      >
        End & clear report
      </button>
      <p className="disclaimer">Stored only on this device. Nothing is uploaded.</p>
    </main>
  );
}
