import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner, LoadingOverlay } from '../../components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default size', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('h-8 w-8');
    expect(spinner).toHaveAttribute('aria-live', 'polite');
    expect(spinner).toHaveAttribute('aria-busy', 'true');
  });

  it('renders with custom size', () => {
    render(<LoadingSpinner size="lg" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('h-12 w-12');
  });

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-class" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('custom-class');
  });

  it('has the correct accessibility attributes', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-live', 'polite');
    expect(spinner).toHaveAttribute('aria-busy', 'true');
  });

  it('matches snapshot', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('LoadingOverlay', () => {
  it('renders with default message', () => {
    render(<LoadingOverlay />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    const overlay = screen.getByRole('status');
    expect(overlay).toHaveClass('fixed inset-0');
    expect(overlay).toHaveClass('bg-black bg-opacity-50');
    expect(overlay).toHaveAttribute('aria-live', 'polite');
    expect(overlay).toHaveAttribute('aria-busy', 'true');
  });

  it('renders with custom message', () => {
    render(<LoadingOverlay message="Please wait..." />);
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<LoadingOverlay className="custom-overlay" />);
    const overlay = screen.getByRole('status');
    expect(overlay).toHaveClass('custom-overlay');
  });

  it('has the correct accessibility attributes', () => {
    render(<LoadingOverlay />);
    const overlay = screen.getByRole('status');
    expect(overlay).toHaveAttribute('aria-live', 'polite');
    expect(overlay).toHaveAttribute('aria-busy', 'true');
  });

  it('matches snapshot', () => {
    const { container } = render(<LoadingOverlay />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('does not render when show is false', () => {
    const { container } = render(<LoadingOverlay show={false} />);
    expect(container.firstChild).toBeNull();
  });
});
