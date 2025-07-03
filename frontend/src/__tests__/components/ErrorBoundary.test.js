import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../../components/ErrorBoundary';

// A component that throws an error
const ErrorComponent = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// A component that throws an error with a custom message
const ErrorWithCustomMessage = () => {
  throw new Error('Custom error message');
};

// A component that throws a non-Error object
const ErrorWithNonError = () => {
  throw 'This is not an Error object';
};

describe('ErrorBoundary', () => {
  let originalConsoleError;
  
  beforeAll(() => {
    // Suppress console.error during tests
    originalConsoleError = console.error;
    console.error = jest.fn();
  });

  afterAll(() => {
    // Restore console.error
    console.error = originalConsoleError;
  });

  afterEach(() => {
    // Clear all mocks after each test
    jest.clearAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ErrorComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('No error')).toBeInTheDocument();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('displays default error message when there is an error', () => {
    render(
      <ErrorBoundary>
        <ErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
    
    // Check that the error details are not shown by default
    expect(screen.queryByText('Test error')).not.toBeInTheDocument();
    
    // Check if Error details summary is present when in development mode
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    render(
      <ErrorBoundary>
        <ErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Error details')).toBeInTheDocument();
    
    process.env.NODE_ENV = originalEnv;
  });

  it('calls componentDidCatch and updates state', () => {
    const error = new Error('Test error');
    const errorInfo = { componentStack: 'test stack' };
    
    const { container } = render(
      <ErrorBoundary>
        <ErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    
    // Simulate error in child component
    const errorBoundary = container.firstChild;
    const instance = errorBoundary._reactInternals.return.stateNode;
    instance.componentDidCatch(error, errorInfo);
    
    expect(instance.state.hasError).toBe(true);
    expect(instance.state.error).toBe(error);
    expect(instance.state.errorInfo).toBe(errorInfo);
  });
});
