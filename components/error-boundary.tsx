"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  title?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      return (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-card-foreground"
        >
          <h2 className="text-lg font-semibold text-destructive">
            {this.props.title ?? "This section failed to render"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{this.state.error.message}</p>
          <Button
            type="button"
            className="mt-4"
            onClick={() => {
              this.setState({ hasError: false, error: null });
            }}
          >
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
