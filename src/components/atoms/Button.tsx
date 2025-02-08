import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'neon';
  size?: 'sm' | 'md' | 'lg';
  neonColor?: 'blue' | 'pink' | 'green' | 'purple';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  neonColor = 'blue',
  ...props
}) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background',
        {
          // Primary variant
          'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary':
            variant === 'primary',
          
          // Secondary variant
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-secondary':
            variant === 'secondary',
          
          // Ghost variant
          'text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-accent':
            variant === 'ghost',
          
          // Neon variant
          [cn(
            'relative overflow-hidden border-2 transition-all duration-300',
            'dark:bg-background/80 dark:backdrop-blur-sm',
            'bg-white/80 backdrop-blur-sm',
            {
              'border-neon-blue hover:text-neon-blue hover:shadow-neon dark:text-neon-blue dark:hover:text-neon-blue text-blue-600':
                neonColor === 'blue',
              'border-neon-pink hover:text-neon-pink hover:shadow-neon-pink dark:text-neon-pink dark:hover:text-neon-pink text-pink-600':
                neonColor === 'pink',
              'border-neon-green hover:text-neon-green hover:shadow-neon-green dark:text-neon-green dark:hover:text-neon-green text-green-600':
                neonColor === 'green',
              'border-neon-purple hover:text-neon-purple hover:shadow-neon-purple dark:text-neon-purple dark:hover:text-neon-purple text-purple-600':
                neonColor === 'purple',
            }
          )]: variant === 'neon',

          // Sizes
          'px-2.5 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-base': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
        },
        'disabled:opacity-50 disabled:pointer-events-none',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};