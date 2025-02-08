import { render, fireEvent, waitFor } from '@testing-library/react';
import { EndpointCard } from '../../components/molecules/EndpointCard';
import { MockServer } from '../../services/mockServer';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('EndpointCard', () => {
  const mockEndpoint = {
    id: '1',
    path: '/api/test',
    method: 'GET',
    description: 'Test endpoint',
    headers: [{ key: 'Content-Type', value: 'application/json' }],
    response: {
      status: 200,
      body: '{"message": "OK"}',
      contentType: 'application/json'
    },
    createdAt: Date.now()
  };

  const mockProps = {
    endpoint: mockEndpoint,
    onEdit: vi.fn(),
    onDelete: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(<EndpointCard {...mockProps} />);
    
    expect(getByText('GET')).toBeInTheDocument();
    expect(getByText('/api/test')).toBeInTheDocument();
    expect(getByText('Test endpoint')).toBeInTheDocument();
    expect(getByText('Response Status: 200')).toBeInTheDocument();
  });

  it('handles test action', async () => {
    const { getByRole } = render(<EndpointCard {...mockProps} />);
    
    const testButton = getByRole('button', { name: /test endpoint/i });
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Test successful'));
    });
  });

  it('handles publish/unpublish action', () => {
    const { getByRole, rerender } = render(<EndpointCard {...mockProps} />);
    
    // Initial publish
    const publishButton = getByRole('button', { name: /globe/i });
    fireEvent.click(publishButton);
    expect(toast.success).toHaveBeenCalledWith('Endpoint published');

    // Rerender to show unpublish button
    rerender(<EndpointCard {...mockProps} />);
    
    // Unpublish
    const unpublishButton = getByRole('button', { name: /x circle/i });
    fireEvent.click(unpublishButton);
    expect(toast.success).toHaveBeenCalledWith('Endpoint unpublished');
  });

  it('handles edit action', () => {
    const { getByRole } = render(<EndpointCard {...mockProps} />);
    
    const editButton = getByRole('button', { name: /pencil/i });
    fireEvent.click(editButton);
    expect(mockProps.onEdit).toHaveBeenCalledWith(mockEndpoint);
  });

  it('handles delete action with confirmation', () => {
    const { getByRole } = render(<EndpointCard {...mockProps} />);
    
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm');
    confirmSpy.mockImplementation(() => true);

    const deleteButton = getByRole('button', { name: /trash/i });
    fireEvent.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockProps.onDelete).toHaveBeenCalledWith(mockEndpoint.id);

    confirmSpy.mockRestore();
  });

  it('handles copy URL action', async () => {
    const mockServer = MockServer.getInstance();
    const mockUrl = 'http://localhost:3000/api/test';
    vi.spyOn(mockServer, 'getPublicUrl').mockReturnValue(mockUrl);

    const { getByRole, getByText } = render(<EndpointCard {...mockProps} />);
    
    // Mock clipboard API
    const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText');
    clipboardSpy.mockImplementation(() => Promise.resolve());

    // Publish endpoint to show copy button
    const publishButton = getByRole('button', { name: /globe/i });
    fireEvent.click(publishButton);

    const copyButton = getByText('Copy URL');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(clipboardSpy).toHaveBeenCalledWith(mockUrl);
      expect(toast.success).toHaveBeenCalledWith('URL copied to clipboard');
    });

    clipboardSpy.mockRestore();
  });
});