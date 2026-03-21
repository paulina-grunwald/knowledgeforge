/**
 * React error boundary to catch and display errors in child components.
 * Provides a fallback UI and retry mechanism.
 */

import { ReactNode, Component, ErrorInfo } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback(this.state.error!, this.resetError);
    }

    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-lg border border-red-200 bg-red-50">
        <AlertCircle className="w-8 h-8 text-red-600 mb-3" />
        <h3 className="text-lg font-semibold text-red-900 mb-2">Something went wrong</h3>
        <p className="text-sm text-red-700 mb-4 text-center max-w-sm">
          {this.state.error?.message || "An unexpected error occurred"}
        </p>
        <Button onClick={this.resetError} variant="outline" size="sm">
          Try again
        </Button>
      </div>
    );
  }
}
