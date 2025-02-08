import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.crypto for UUID generation
Object.defineProperty(window, 'crypto', {
  value: {
    randomUUID: () => '00000000-0000-0000-0000-000000000000'
  }
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
  length: 0,
  key: vi.fn()
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn()
  }
});