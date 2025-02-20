import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const devLog = (message: string, data?: unknown) => {
  if (process.env.NODE_ENV === 'development') {
    if (data) {
      console.log(`[DEV] ${message}:`, data);
    } else {
      console.log(`[DEV] ${message}`);
    }
  }
};
