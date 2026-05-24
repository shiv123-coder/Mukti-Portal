import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorInfo: string;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorInfo: ""
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorInfo: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-6">
          <AlertCircle className="mb-4 h-16 w-16 text-destructive" />
          <h1 className="mb-2 text-2xl font-bold text-foreground">Something went wrong</h1>
          <p className="mb-6 text-center text-muted-foreground">
            We've encountered an unexpected error. Please refresh the page or try again later.
          </p>
          <p className="mb-6 text-xs text-muted-foreground max-w-md overflow-auto">
            {this.state.errorInfo}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
