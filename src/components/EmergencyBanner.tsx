import { useSettings } from '../settings';
import { Icon } from './Icons';

export function EmergencyBanner() {
  const { number, numberLabel } = useSettings();
  return (
    <div className="banner" role="alert">
      <span className="banner-text">
        <strong>Emergency?</strong> Call {numberLabel} immediately
      </span>
      <a className="banner-call" href={`tel:${number}`} aria-label={`Call ${number}`}>
        <Icon name="phone" size={18} /> {number}
      </a>
    </div>
  );
}
