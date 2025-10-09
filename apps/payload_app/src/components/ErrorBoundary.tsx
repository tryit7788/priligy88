'use client'

import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div
            style={{
              padding: '20px',
              border: '1px solid #ff6b6b',
              borderRadius: '8px',
              backgroundColor: '#ffe0e0',
              color: '#d63031',
            }}
          >
            <h3>Something went wrong</h3>
            <p>An error occurred while rendering this component.</p>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              style={{
                padding: '8px 16px',
                backgroundColor: '#d63031',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        )
      )
    }

    return this.props.children
  }
}
