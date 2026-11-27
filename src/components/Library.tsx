import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';
import { GUIDE_ICON } from './Learn';
import { GUIDES, type GuideCard } from '../guides/library';
import { Timer } from './Timer';
import { Illustration } from './Illustration';
import { useSettings } from '../settings';
import type { Speech } from '../hooks/useSpeech';


export function GuideReader({ id, speech, onBack, onEmergency }: { id: string; speech: Speech; onBack: () => void; onEmergency: () => void }) {
  const { localize, number, demo } = useSettings();
  const guide = GUIDES.find((g) => g.id === id) as GuideCard;
  // -1 = intro screen
  const [i, setI] = useState(-1);
  const step = i >= 0 ? guide.steps[i] : null;
  const last = i === guide.steps.length - 1;

  useEffect(() => {
    if (step) speech.speak(localize(`${step.text} ${step.detail ?? ''}`), false, undefined, 'en-US');
    else speech.speak(`${guide.title}. ${guide.summary}`, false, undefined, 'en-US');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  const stopRef = useRef(speech.stop);
  stopRef.current = speech.stop;
  useEffect(() => () => stopRef.current(), []);

  return (
    <main className="screen flow">
      <div className="flow-top">
        <button className="link" onClick={onBack}>
          ‹ Learn
        </button>
        <span className="flow-meta">{step ? `Step ${i + 1} of ${guide.steps.length}` : guide.group}</span>
        <span />
      </div>

      <div className="progress" aria-hidden="true">
        {guide.steps.map((_, n) => (
          <span key={n} className={n <= i ? 'on' : ''} />
        ))}
      </div>

      <section className="card step-card" key={i}>
        {!step ? (
          <>
            <div className="guide-hero" aria-hidden="true">
              <Icon name={GUIDE_ICON[guide.id] ?? 'medical'} size={48} />
            </div>
            <h1 className="step-text">{guide.title}</h1>
            <p className="step-detail">{guide.summary}</p>
            {guide.callIf && (
              <div className="redflag">
                <strong>Get help if:</strong> {localize(guide.callIf)}
              </div>
            )}
            <button className="btn btn-primary btn-huge" onClick={() => setI(0)}>
              Start
            </button>
          </>
        ) : (
          <>
            <Illustration name={step.illustration} number={number} />
            <h1 className="step-text">{localize(step.text)}</h1>
            {step.detail && <p className="step-detail">{localize(step.detail)}</p>}
            {step.timerSec && <Timer seconds={demo ? 10 : step.timerSec} />}
            <div className="row">
              <button className="btn btn-secondary" onClick={() => setI(i - 1)}>
                Back
              </button>
              {last ? (
                <button className="btn btn-primary" onClick={onBack}>
                  Finished ✓
                </button>
              ) : (
                <button className="btn btn-primary" onClick={() => setI(i + 1)}>
                  Next
                </button>
              )}
            </div>
          </>
        )}
        {speech.supported && (
          <button
            className="link repeat"
            onClick={() => speech.speak(step ? localize(`${step.text} ${step.detail ?? ''}`) : `${guide.title}. ${guide.summary}`, true, undefined, 'en-US')}
          >
            ↻ Read aloud
          </button>
        )}
      </section>

      <div className="flow-escape">
        <button className="btn btn-danger-outline" onClick={onEmergency}>
          It's an emergency
        </button>
      </div>
    </main>
  );
}
