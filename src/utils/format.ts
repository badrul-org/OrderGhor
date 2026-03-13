import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { bn } from 'date-fns/locale';

export function formatCurrency(amount: number): string {
  return `৳${amount.toLocaleString('en-IN')}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd MMM yyyy', { locale: bn });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd MMM yyyy, hh:mm a', { locale: bn });
}

export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isToday(d)) return 'আজ';
  if (isYesterday(d)) return 'গতকাল';
  return formatDistanceToNow(d, { addSuffix: true, locale: bn });
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd/MM/yy');
}

export function formatPhone(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'শুভ সকাল';
  if (hour < 17) return 'শুভ দুপুর';
  if (hour < 20) return 'শুভ সন্ধ্যা';
  return 'শুভ রাত্রি';
}

export function getTodayDateBangla(): string {
  return format(new Date(), 'dd MMMM yyyy', { locale: bn });
}
