'use client'

import React, { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallbackLabel?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class GameErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-stone-900/80 border border-red-800/50 rounded-lg m-4">
          <span className="text-4xl mb-3">🐴</span>
          <h2 className="text-red-400 font-pixel text-lg mb-2">
            {this.props.fallbackLabel || 'Something went wrong'}
          </h2>
          <p className="text-stone-400 text-sm mb-4 text-center max-w-md">
            The trail hit a rough patch. You can try again or start fresh.
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-amber-100 rounded font-pixel text-sm transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded font-pixel text-sm transition-colors"
            >
              Reload Page
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="mt-4 p-3 bg-black/50 rounded text-red-300 text-xs max-w-full overflow-auto max-h-32">
              {this.state.error.message}
            </pre>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
