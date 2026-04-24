import { DayPicker } from 'react-day-picker';
import type { Matcher } from 'react-day-picker';
import { toYMD, parseYMD, startOfToday } from '@/lib/date';
import 'react-day-picker/style.css';

export interface SingleDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  /** Disable these dates. YYYY-MM-DD[] */
  blockedDates?: string[];
  /** Optional CSS class for the root. */
  className?: string;
  /** Minimum selectable date (default: today). */
  minDate?: Date;
}

/** Single-date Airbnb-style calendar. */
export function SingleDatePicker({
  value,
  onChange,
  blockedDates = [],
  className,
  minDate,
}: SingleDatePickerProps) {
  const today = startOfToday();
  const min = minDate ?? today;
  const blockedSet = new Set(blockedDates);

  const disabled: Matcher = (date: Date) => {
    const ymd = toYMD(date);
    if (ymd < toYMD(min)) return true;
    if (blockedSet.has(ymd)) return true;
    return false;
  };

  const selected = value ? parseYMD(value) : undefined;

  const onSelect = (date: Date | undefined) => {
    onChange(date ? toYMD(date) : '');
  };

  const defaultMonth = value ? parseYMD(value) : today;

  return (
    <div className={`rdp-airbnb rdp-root ${className ?? ''}`}>
      <DayPicker
        mode="single"
        defaultMonth={defaultMonth}
        startMonth={min}
        disabled={disabled}
        selected={selected}
        onSelect={onSelect}
        showOutsideDays
      />
    </div>
  );
}
