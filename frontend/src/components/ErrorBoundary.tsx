import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info)
  }

  reset = () => this.setState({ hasError: false, error: null })

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '1rem' }}>
          <div style={{ background: '#fff3f2', border: '1px solid #f5c2c7', borderRadius: 8, padding: 12 }}>
            <strong>Une erreur est survenue dans ce composant.</strong>
            <div style={{ marginTop: 8 }}>{String(this.state.error)}</div>
            <div style={{ marginTop: 12 }}>
              <button onClick={this.reset} style={{ padding: '0.5rem 0.75rem' }}>Réessayer</button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children as React.ReactElement
  }
}

export default ErrorBoundary
