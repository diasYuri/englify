'use client';

import { ErrorMessageProps } from './types';

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;
  
  return (
    <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg text-sm w-full max-w-md">
      Error: {message}
    </div>
  );
} 