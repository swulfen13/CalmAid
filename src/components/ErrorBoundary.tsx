import { Component, type ReactNode } from 'react';

/**
 * Last line of defence: if anything in the UI crashes, the user still sees
 * the emergency number and the two most important instructions — never a blank screen.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[CalmAid] UI error', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="app">
        <div className="banner" role="alert">
          <span className="banner-text">
            <strong>Emergency?</strong> Call 112 / 911 immediately
          </span>
          <a className="banner-call" href="tel:112">
            📞 112
          </a>
        </div>
        <main className="screen">
          <section className="card step-card">
            <p className="step-kicker">Something went wrong. Here's what matters</p>
            <h1 className="step-text">Not responding and not breathing normally?</h1>
            <p className="step-detail">Call 112 / 911. Push hard and fast in the middle of the chest, 100–120 times a minute, until help arrives.</p>
            <h1 className="step-text">Heavy bleeding?</h1>
            <p className="step-detail">Press hard on the wound with a cloth and don't let go.</p>
            <button
              className="btn btn-primary btn-huge"
              onClick={() => {
                this.setState({ failed: false });
                window.location.reload();
              }}
            >
              Reload CalmAid
            </button>
          </section>
        </main>
      </div>
    );
  }
}
