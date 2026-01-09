import React, { Component, ReactNode } from "react";
import { logger } from "../services/logger";
import { ErrorDisplay } from "./ui/ErrorDisplay";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showDetails: boolean;
}

/**
 * Composant Error Boundary pour capturer les erreurs React.
 *
 * @description
 * Intercepte les erreurs non gérées dans l'arbre de composants et affiche
 * une UI de fallback élégante au lieu de faire crasher toute l'application.
 *
 * **Comportement :**
 * - Capture toutes les erreurs React dans ses enfants
 * - Log l'erreur dans la console (avec stack trace en dev)
 * - Affiche une page d'erreur user-friendly
 * - Permet de rafraîchir ou revenir à l'accueil
 *
 * **Usage :**
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log l'erreur avec détails
    logger.error("🔥 React Error Boundary a capturé une erreur:", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
    window.location.href = "/";
  };

  toggleDetails = () => {
    this.setState({ showDetails: !this.state.showDetails });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <ErrorDisplay
          error={this.state.error}
          context="Erreur dans le cycle de rendu React"
          showDetails={this.state.showDetails}
          onToggleDetails={this.toggleDetails}
          onRefresh={this.handleReload}
          onGoHome={this.handleGoHome}
          isModal={false}
        />
      );
    }

    return this.props.children;
  }
}
