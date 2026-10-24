import { Component, type ErrorInfo, type ReactNode } from 'react';
import { strings } from '../lib/strings';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  failed: boolean;
}

/** Shows a message instead of a blank screen when loading the data fails. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  override render() {
    if (this.state.failed) {
      return (
        <p role="alert" className="p-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] text-center">
          {strings.errors.load}
        </p>
      );
    }
    return this.props.children;
  }
}
