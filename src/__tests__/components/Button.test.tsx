import { render, fireEvent } from '@testing-library/react';
import { Button } from '../../components/atoms/Button';

describe('Button', () => {
  it('renders correctly', () => {
    const { getByText } = render(<Button>Click me</Button>);
    expect(getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    const { getByText } = render(
      <Button onClick={handleClick}>Click me</Button>
    );
    
    fireEvent.click(getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant classes correctly', () => {
    const { getByText, rerender } = render(
      <Button variant="primary">Button</Button>
    );
    
    expect(getByText('Button')).toHaveClass('bg-primary');

    rerender(<Button variant="secondary">Button</Button>);
    expect(getByText('Button')).toHaveClass('bg-secondary');

    rerender(<Button variant="ghost">Button</Button>);
    expect(getByText('Button')).toHaveClass('text-foreground');
  });

  it('applies size classes correctly', () => {
    const { getByText, rerender } = render(
      <Button size="sm">Button</Button>
    );
    
    expect(getByText('Button')).toHaveClass('px-2.5', 'py-1.5', 'text-sm');

    rerender(<Button size="md">Button</Button>);
    expect(getByText('Button')).toHaveClass('px-4', 'py-2', 'text-base');

    rerender(<Button size="lg">Button</Button>);
    expect(getByText('Button')).toHaveClass('px-6', 'py-3', 'text-lg');
  });

  it('handles disabled state', () => {
    const handleClick = vi.fn();
    const { getByText } = render(
      <Button disabled onClick={handleClick}>
        Click me
      </Button>
    );
    
    const button = getByText('Click me');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50', 'disabled:pointer-events-none');
    
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });
});