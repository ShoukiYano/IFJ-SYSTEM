import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
  }).format(amount);
}

export function calculateTax(subtotal: number, taxRate: number = 0.1) {
  return Math.floor(subtotal * taxRate);
}

export function generateInvoiceNumber(currentSequence: number): string {
  const date = new Date();
  const yearMonth = `${date.getFullYear()}${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}`;
  const seq = currentSequence.toString().padStart(4, "0");
  return `INV-${yearMonth}-${seq}`;
}
