import { DayPicker } from 'react-day-picker';
import type { Matcher } from 'react-day-picker';
import { toYMD, parseYMD, startOfToday } from '@/lib/date';
import 'react-day-picker/style.css';

export interface DateRangePickerProps {
  /** Check-in date YYYY-MM-DD */
  checkIn: string;
  /** Check-out date YYYY-MM-DD */
  checkOut: string;
  onCheckInChange: (value: string) => void;
  onCheckOutChange: (value: string) => void;
  /** Disable these dates (e.g. already booked). YYYY-MM-DD[] */
  blockedDates?: string[];
  /** Optional CSS class for the root. */
  className?: string;
}

/** Airbnb-style range calendar: two months, past and blocked disabled, range highlight. */
export function DateRangePicker({
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  blockedDates = [],
  className,
}: DateRangePickerProps) {
  const today = startOfToday();
  const blockedSet = new Set(blockedDates);

  const disabled: Matcher = (date: Date) => {
    const ymd = toYMD(date);
    if (ymd < toYMD(today)) return true;
    if (blockedSet.has(ymd)) return true;
    return false;
  };

  const selected = {
    from: checkIn ? parseYMD(checkIn) : undefined,
    to: checkOut ? parseYMD(checkOut) : undefined,
  };

  const onSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) {
      onCheckInChange('');
      onCheckOutChange('');
      return;
    }
    onCheckInChange(range.from ? toYMD(range.from) : '');
    onCheckOutChange(range.to ? toYMD(range.to) : '');
  };

  const defaultMonth = checkIn ? parseYMD(checkIn) : today;

  return (
    <div className={`rdp-airbnb rdp-root ${className ?? ''}`}>
      <DayPicker
        mode="range"
        numberOfMonths={2}
        defaultMonth={defaultMonth}
        startMonth={today}
        disabled={disabled}
        selected={selected}
        onSelect={onSelect}
        showOutsideDays
      />
    </div>
  );
}
