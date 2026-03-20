import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Suppress console errors during tests (optional - helps reduce noise)
vi.spyOn(console, 'error').mockImplementation(() => {});

afterEach(() => {
  cleanup();
});
