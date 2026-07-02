import { Component } from "react";
import {
  HiOutlineExclamationTriangle,
  HiOutlineArrowPath,
} from "react-icons/hi2";
import Button from "./Button";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-6">
          <div className="max-w-md w-full bg-white rounded-3xl border border-border-light shadow-glass-lg p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
              <HiOutlineExclamationTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-manrope font-bold text-primary-darkest mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-text-muted font-jakarta mb-6">
              An unexpected error occurred. Please try refreshing the page or
              return to the home page.
            </p>
            {this.state.error && (
              <details className="text-left bg-surface-cream rounded-xl p-4 mb-6">
                <summary className="text-xs font-jakarta font-semibold text-primary-darkest cursor-pointer">
                  Error Details
                </summary>
                <pre className="mt-2 text-[10px] text-text-muted font-mono overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <Button
              variant="primary"
              onClick={this.handleReset}
              icon={<HiOutlineArrowPath />}
              iconPosition="left"
              className="w-full justify-center"
            >
              Return to Home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
