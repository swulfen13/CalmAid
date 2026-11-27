import { useEffect, useState } from 'react';
import { keepAwake } from './native';
import type { Age, Category, StartInput } from './types';
import { CATEGORY_LABEL } from './engine';
import { EmergencyBanner } from './components/EmergencyBanner';
import { Home } from './components/Home';
import { Flow } from './components/Flow';
import { Handover } from './components/Handover';
import { GuideReader } from './components/Library';
import { SettingsScreen } from './components/Settings';
import { ChapterReader, ExerciseScreen, HandbookHome, LearnHome, LessonReader, TrainerScreen } from './components/Learn';
import { usePath } from './learn/progress';
import { ALL_NODES } from './learn/path';
import { AiInfo } from './components/AiInfo';
import { TestLab } from './components/TestLab';
import { ForJudges } from './components/ForJudges';
import { TabBar, type Tab } from './components/TabBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useSession } from './hooks/useSession';
import { useSpeech } from './hooks/useSpeech';
import { useLocation } from './hooks/useLocation';
import { SettingsProvider, useSettings } from './settings';

type View =
  | { name: 'home' }
  | { name: 'flow' }
  | { name: 'handover' }
  | { name: 'learn' }
  | { name: 'lesson'; id: string }
  | { name: 'exercise'; nodeId: string | null }
  | { name: 'handbook' }
  | { name: 'chapter'; id: string; back: View }
  | { name: 'trainer' }
  | { name: 'guide'; id: string }
  | { name: 'settings' }
  | { name: 'ai'; back: View }
  | { name: 'tests'; back: View }
  | { name: 'judges'; back: View };

const TAB_OF: Record<View['name'], Tab | null> = {
  home: 'help',
  flow: null, // no tab bar during an emergency: nothing to tap by accident
  handover: null,
  learn: 'learn',
  lesson: null,
  exercise: null,
  handbook: 'learn',
  chapter: null,
  trainer: null,
  guide: null,
  settings: 'settings',
  ai: null,
  tests: null,
  judges: null,
};

export default function App() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <Shell />
      </SettingsProvider>
    </ErrorBoundary>
  );
}

function Shell() {
  const { language } = useSettings();
  const [view, setView] = useState<View>({ name: 'home' });
  // The running guide stays mounted while the report or other screens are open,
  // so going back continues exactly where you were (and CPR keeps its beat).
  const [activeFlow, setActiveFlow] = useState<{ input: StartInput; run: number } | null>(null);
  const [photo, setPhoto] = useState<string | undefined>(); // memory only: too large / private for storage
  const { session, begin, log, addCpr, end, clear } = useSession();
  const { state: path, complete } = usePath();
  const speech = useSpeech(language.code);
  const loc = useLocation();

  // Keep the screen on for the whole emergency (incl. the report screen) — never mid-CPR darkness.
  useEffect(() => {
    keepAwake(!!activeFlow);
  }, [activeFlow]);

  const go = (v: View) => {
    speech.stop();
    setView(v);
    window.scrollTo({ top: 0 });
  };

  const startEmergency = (category: Category, description: string, age: Age, p?: string, via?: StartInput['via']) => {
    begin(category, description, !!p, age);
    setPhoto(p);
    setActiveFlow({ input: { category, description, photo: p, age, via }, run: Date.now() });
    go({ name: 'flow' });
  };

  const resume = () => {
    if (!session) return;
    if (!activeFlow) {
      // After a reload: restart the guide for the same situation, keep the log.
      setActiveFlow({ input: { category: session.category, description: session.description, age: session.age ?? 'adult' }, run: Date.now() });
    }
    go({ name: 'flow' });
  };

  const openInfo = (screen: 'ai' | 'tests' | 'judges') => go({ name: screen, back: view });
  const tab = TAB_OF[view.name];

  return (
    <div className={`app ${tab ? 'has-tabs' : ''}`}>
      <EmergencyBanner />

      {view.name === 'home' && (
        <Home
          onStart={startEmergency}
          onOpenInfo={openInfo}
          resumeLabel={
            session && !session.endedAt
              ? `${CATEGORY_LABEL[session.category]}, started at ${new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}`
              : undefined
          }
          onResume={resume}
        />
      )}

      {activeFlow && (
        <div hidden={view.name !== 'flow'}>
          <Flow
            key={activeFlow.run}
            input={activeFlow.input}
            log={log}
            addCpr={addCpr}
            speech={speech}
            loc={loc}
            active={view.name === 'flow'}
            onHandover={() => go({ name: 'handover' })}
            onHome={() => go({ name: 'home' })}
            onReadMore={(id) => go({ name: 'chapter', id, back: { name: 'flow' } })}
          />
        </div>
      )}

      {view.name === 'handover' && session && (
        <Handover
          session={session}
          photo={photo}
          loc={loc}
          onBack={resume}
          onNew={() => {
            end();
            clear();
            setPhoto(undefined);
            setActiveFlow(null);
            go({ name: 'home' });
          }}
        />
      )}
      {view.name === 'handover' && !session && (
        <main className="screen">
          <p className="hint">No active emergency.</p>
          <button className="btn btn-primary" onClick={() => go({ name: 'home' })}>
            Back to start
          </button>
        </main>
      )}

      {view.name === 'learn' && (
        <LearnHome
          path={path}
          onNode={(id) => {
            const n = ALL_NODES.find((x) => x.id === id);
            if (n?.kind === 'lesson') go({ name: 'lesson', id: n.lessonId });
            else go({ name: 'exercise', nodeId: id });
          }}
          onRefresher={() => go({ name: 'exercise', nodeId: null })}
          onTrainer={() => go({ name: 'trainer' })}
          onGuide={(id) => go({ name: 'guide', id })}
          onHandbook={() => go({ name: 'handbook' })}
        />
      )}
      {view.name === 'lesson' && (
        <LessonReader
          id={view.id}
          speech={speech}
          onBack={() => go({ name: 'learn' })}
          onSave={(id, score) => complete(`lesson:${id}`, Math.round((score / 3) * 100))}
          onTrainer={() => go({ name: 'trainer' })}
          onChapter={(id) => go({ name: 'chapter', id, back: { name: 'learn' } })}
        />
      )}
      {view.name === 'exercise' && (
        <ExerciseScreen nodeId={view.nodeId} onBack={() => go({ name: 'learn' })} onComplete={(nodeId, info, kind) => complete(nodeId, info.score, { kind, mythPerfect: info.mythPerfect })} />
      )}
      {view.name === 'handbook' && <HandbookHome onBack={() => go({ name: 'learn' })} onChapter={(id) => go({ name: 'chapter', id, back: { name: 'handbook' } })} />}
      {view.name === 'chapter' && <ChapterReader id={view.id} speech={speech} onBack={() => go(view.back)} onEmergency={() => go({ name: 'home' })} />}
      {view.name === 'trainer' && <TrainerScreen onBack={() => go({ name: 'learn' })} />}
      {view.name === 'guide' && <GuideReader id={view.id} speech={speech} onBack={() => go({ name: 'learn' })} onEmergency={() => go({ name: 'home' })} />}

      {view.name === 'settings' && <SettingsScreen onOpen={openInfo} />}
      {view.name === 'ai' && <AiInfo onBack={() => go(view.back)} onTests={() => go({ name: 'tests', back: view.back })} />}
      {view.name === 'tests' && <TestLab onBack={() => go(view.back)} />}
      {view.name === 'judges' && (
        <ForJudges onBack={() => go(view.back)} onTests={() => go({ name: 'tests', back: view })} onAi={() => go({ name: 'ai', back: view })} />
      )}

      {tab && <TabBar tab={tab} onChange={(t) => go({ name: t === 'help' ? 'home' : t })} />}
    </div>
  );
}
