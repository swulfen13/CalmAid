import { useState } from 'react';
import { Icon } from './Icons';
import { formatFix, type useLocation } from '../hooks/useLocation';

type Loc = ReturnType<typeof useLocation>;

/** Big, readable position to tell the dispatcher. Works without internet. */
export function LocationCard({ loc, compact = false }: { loc: Loc; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  if (!loc.supported) return null;

  if (loc.status === 'idle') {
    return (
      <button className="btn btn-secondary loc-start" onClick={loc.start}>
        <Icon name="pin" /> Show my location for the call
      </button>
    );
  }

  const text = loc.fix ? formatFix(loc.fix) : '';
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className={`loc ${compact ? 'compact' : ''}`}>
      <div className="loc-head">
        <span>
          <Icon name="pin" size={18} /> Your location
        </span>
        {loc.fix && <small>± {loc.fix.accuracy} m</small>}
      </div>
      {loc.status === 'locating' && !loc.fix && <p className="loc-value muted">Finding your position…</p>}
      {loc.status === 'denied' && <p className="loc-value muted">Location blocked. Tell the dispatcher the street, a building or a landmark.</p>}
      {loc.status === 'error' && !loc.fix && <p className="loc-value muted">No GPS signal. Describe landmarks near you.</p>}
      {loc.fix && (
        <>
          <p className="loc-value">{text}</p>
          {!compact && (
            <div className="loc-actions">
              <button className="link" onClick={copy}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
              <a className="link" href={`https://www.google.com/maps?q=${loc.fix.lat},${loc.fix.lon}`} target="_blank" rel="noreferrer">
                Open in maps
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
