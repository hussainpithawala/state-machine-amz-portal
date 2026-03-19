import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { StartBulkExecutionModal } from './start-bulk-execution-modal';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('lucide-react', () => ({
  Loader2: () => <span data-testid="loader" />,
  Play: () => <span data-testid="play" />,
  Package: () => <span data-testid="package" />,
  GitBranch: () => <span data-testid="git-branch" />,
  Upload: () => <span data-testid="upload" />,
  FileJson: () => <span data-testid="file-json" />,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} data-testid={props.id || props.name} />
  ),
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} data-testid={props.id || props.name} />
  ),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: { children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) => {
    if (open && onOpenChange) {
      return <div data-testid="dialog" onClick={() => onOpenChange(false)}>{children}</div>;
    }
    return open ? <div data-testid="dialog">{children}</div> : null;
  },
  DialogContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-content">{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p data-testid="dialog-description">{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-footer">{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-trigger">{children}</div>,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: { children: React.ReactNode; value?: string; onValueChange?: (value: string) => void }) => (
    <div data-testid="select" data-value={value} onClick={() => {}}>{children}</div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => <div data-testid="select-item" data-value={value} onClick={() => {}}>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: () => <span data-testid="select-value">Select</span>,
}));

vi.mock('@/components/ui/transformer-select', () => ({
  TransformerSelect: () => <div data-testid="transformer-select" />,
}));

describe('StartBulkExecutionModal', () => {
  const defaultProps = {
    stateMachineId: 'test-state-machine-id',
    stateMachineName: 'Test State Machine',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the trigger button', () => {
    render(<StartBulkExecutionModal {...defaultProps} />);
    expect(screen.getByText('Start Bulk Execution')).toBeInTheDocument();
  });

  it('renders the trigger button as disabled when disabled prop is true', () => {
    render(<StartBulkExecutionModal {...defaultProps} disabled={true} />);
    const button = screen.getByText('Start Bulk Execution');
    expect(button).toBeDisabled();
  });

  it('opens modal when trigger button is clicked', async () => {
    render(<StartBulkExecutionModal {...defaultProps} />);
    
    const triggerButton = screen.getByText('Start Bulk Execution');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });
  });

  it('shows validation error for empty name prefix', async () => {
    render(<StartBulkExecutionModal {...defaultProps} />);
    
    const triggerButton = screen.getByText('Start Bulk Execution');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    const namePrefixInput = screen.getByTestId('namePrefix');
    fireEvent.change(namePrefixInput, { target: { name: 'namePrefix', value: '' } });

    const submitButton = screen.getByRole('button', { name: /Start Bulk Execution/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name prefix is required')).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid JSON input', async () => {
    render(<StartBulkExecutionModal {...defaultProps} />);
    
    const triggerButton = screen.getByText('Start Bulk Execution');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    const inputsTextarea = screen.getByTestId('inputs');
    fireEvent.change(inputsTextarea, { target: { name: 'inputs', value: 'invalid json' } });

    const submitButton = screen.getByRole('button', { name: /Start Bulk Execution/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid JSON in inputs array')).toBeInTheDocument();
    });
  });

  it('shows validation error for non-array JSON input', async () => {
    render(<StartBulkExecutionModal {...defaultProps} />);
    
    const triggerButton = screen.getByText('Start Bulk Execution');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    const inputsTextarea = screen.getByTestId('inputs');
    fireEvent.change(inputsTextarea, { target: { name: 'inputs', value: '{"key": "value"}' } });

    const submitButton = screen.getByRole('button', { name: /Start Bulk Execution/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Inputs must be a JSON array')).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid concurrency value', async () => {
    render(<StartBulkExecutionModal {...defaultProps} />);
    
    const triggerButton = screen.getByText('Start Bulk Execution');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    const concurrencyInput = screen.getByTestId('concurrency');
    fireEvent.change(concurrencyInput, { target: { name: 'concurrency', value: '0' } });

    const submitButton = screen.getByRole('button', { name: /Start Bulk Execution/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Concurrency must be between 1 and 100')).toBeInTheDocument();
    });
  });

  it('shows validation error for concurrency > 100', async () => {
    render(<StartBulkExecutionModal {...defaultProps} />);
    
    const triggerButton = screen.getByText('Start Bulk Execution');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    const concurrencyInput = screen.getByTestId('concurrency');
    fireEvent.change(concurrencyInput, { target: { name: 'concurrency', value: '101' } });

    const submitButton = screen.getByRole('button', { name: /Start Bulk Execution/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Concurrency must be between 1 and 100')).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid pause threshold', async () => {
    render(<StartBulkExecutionModal {...defaultProps} />);
    
    const triggerButton = screen.getByText('Start Bulk Execution');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    const pauseThresholdInput = screen.getByTestId('pauseThreshold');
    fireEvent.change(pauseThresholdInput, { target: { name: 'pauseThreshold', value: '1.5' } });

    const submitButton = screen.getByRole('button', { name: /Start Bulk Execution/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Pause threshold must be between 0 and 1')).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid timeout seconds', async () => {
    render(<StartBulkExecutionModal {...defaultProps} />);
    
    const triggerButton = screen.getByText('Start Bulk Execution');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    const timeoutInput = screen.getByTestId('timeoutSeconds');
    fireEvent.change(timeoutInput, { target: { name: 'timeoutSeconds', value: '0' } });

    const submitButton = screen.getByRole('button', { name: /Start Bulk Execution/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Timeout seconds must be at least 1')).toBeInTheDocument();
    });
  });

  it('calls onSuccess callback after successful submission', async () => {
    const onSuccess = vi.fn();
    
    render(<StartBulkExecutionModal {...defaultProps} onSuccess={onSuccess} />);
    
    const triggerButton = screen.getByText('Start Bulk Execution');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    const inputsTextarea = screen.getByTestId('inputs');
    fireEvent.change(inputsTextarea, { target: { name: 'inputs', value: '[{"test": "data"}]' } });

    const submitButton = screen.getByRole('button', { name: /Start Bulk Execution/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('toggles between JSON input and file upload methods', async () => {
    render(<StartBulkExecutionModal {...defaultProps} />);
    
    const triggerButton = screen.getByText('Start Bulk Execution');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    expect(screen.getByText('Inputs Array (JSON) *')).toBeInTheDocument();

    const fileUploadButton = screen.getByText('File Upload');
    fireEvent.click(fileUploadButton);

    await waitFor(() => {
      expect(screen.getByText('Upload JSON File *')).toBeInTheDocument();
    });

    const jsonInputButton = screen.getByText('JSON Input');
    fireEvent.click(jsonInputButton);

    await waitFor(() => {
      expect(screen.getByText('Inputs Array (JSON) *')).toBeInTheDocument();
    });
  });

  it('shows micro batch configuration when enabled', async () => {
    render(<StartBulkExecutionModal {...defaultProps} />);
    
    const triggerButton = screen.getByText('Start Bulk Execution');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    expect(screen.getByTestId('microBatchSize')).toBeInTheDocument();
    expect(screen.getByTestId('orchestratorId')).toBeInTheDocument();
  });

  it('renders all form sections', async () => {
    render(<StartBulkExecutionModal {...defaultProps} />);
    
    const triggerButton = screen.getByText('Start Bulk Execution');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    expect(screen.getByText('Bulk Inputs')).toBeInTheDocument();
    expect(screen.getByText('Bulk Configuration')).toBeInTheDocument();
    expect(screen.getByText('Micro Batch Configuration')).toBeInTheDocument();
    expect(screen.getByText('Advanced Configuration')).toBeInTheDocument();
  });

  it('renders with default state machine name in form', async () => {
    render(<StartBulkExecutionModal {...defaultProps} />);
    
    const triggerButton = screen.getByText('Start Bulk Execution');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    const namePrefixInput = screen.getByTestId('namePrefix') as HTMLInputElement;
    expect(namePrefixInput.value).toContain('bulk-Test-State-Machine');
  });
});
