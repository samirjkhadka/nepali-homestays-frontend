import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Star, ChevronDown, ChevronUp, AlertCircle, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/lib/currency';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getCalendarDays(year: number, month: number): { date: Date; dateStr: string; isCurrentMonth: boolean }[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const daysInMonth = last.getDate();
  const result: { date: Date; dateStr: string; isCurrentMonth: boolean }[] = [];
  const pad = (d: Date) => toLocalDateStr(d);
  for (let i = 0; i < startPad; i++) {
    const d = new Date(year, month, 1 - (startPad - i));
    result.push({ date: d, dateStr: pad(d), isCurrentMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    result.push({ date: d, dateStr: pad(d), isCurrentMonth: true });
  }
  const remaining = 42 - result.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    result.push({ date: d, dateStr: pad(d), isCurrentMonth: false });
  }
  return result;
}

export interface BookingCardProps {
  pricePerNight: string;
  /** Formatted price for display (e.g. "NPR 2,500") */
  priceFormatted?: string;
  rating?: number | null;
  totalReviews: number;
  maxGuests: number;
  checkIn: string;
  checkOut: string;
  onCheckInChange: (value: string) => void;
  onCheckOutChange: (value: string) => void;
  guests: number;
  onGuestsChange: (n: number) => void;
  blockedDates: string[];
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  /** Optional message text (e.g. "You won't be charged yet") */
  submitLabel?: string;
  /** Service charge or discount from API. For service_charge, applies_to controls who pays (guest = added to total, host = deducted from host payout). */
  bookingFee?: { type: 'service_charge' | 'discount'; kind: 'percent' | 'fixed'; value: number; applies_to?: 'guest' | 'host' } | null;
  /** Trust badge lines (from site settings). If omitted, shows default three. */
  trustBadges?: string[];
  /** When 'partial', no discount applies; guest pays at least min % now, rest at checkout. */
  paymentType?: 'full' | 'partial';
  partialPercent?: number;
  partialPaymentMinPercent?: number;
  onPaymentTypeChange?: (type: 'full' | 'partial') => void;
  onPartialPercentChange?: (percent: number) => void;
  /** Optional extra services (paid add-ons) from listing */
  extraServices?: { id: number; name: string; price_npr: number; unit: string; description?: string | null }[];
  selectedExtraServices?: { extra_service_id: number; quantity: number }[];
  onExtraServicesChange?: (selection: { extra_service_id: number; quantity: number }[]) => void;
}

export function BookingCard({
  pricePerNight,
  priceFormatted,
  rating,
  totalReviews,
  maxGuests,
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  guests,
  onGuestsChange,
  blockedDates,
  onSubmit,
  submitting,
  submitLabel = "You won't be charged yet",
  bookingFee,
  trustBadges,
  paymentType = 'full',
  partialPercent = 25,
  partialPaymentMinPercent = 25,
  onPaymentTypeChange,
  onPartialPercentChange,
  extraServices,
  selectedExtraServices = [],
  onExtraServicesChange,
}: BookingCardProps) {
  const badges = trustBadges?.length ? trustBadges : ['Free cancellation for 48 hours', 'Verified homestay host', 'Secure payment process'];
  const { format: formatPrice } = useCurrency();
  const displayPrice = priceFormatted ?? formatPrice(pricePerNight);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const today = useMemo(() => new Date(), []);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    if (checkIn) {
      const d = new Date(checkIn + 'T12:00:00');
      return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const calendarDays = useMemo(
    () => getCalendarDays(calendarMonth.getFullYear(), calendarMonth.getMonth()),
    [calendarMonth]
  );
  const todayStr = toLocalDateStr(today);

  const priceNum = parseFloat(String(pricePerNight));
  const checkInDate = checkIn ? new Date(checkIn) : null;
  const checkOutDate = checkOut ? new Date(checkOut) : null;
  const nights =
    checkInDate && checkOutDate && checkOutDate > checkInDate
      ? Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (24 * 60 * 60 * 1000))
      : 0;

  const blockedSet = new Set(blockedDates);
  const hasUnavailableInRange = (() => {
    if (nights <= 0 || !checkInDate || !checkOutDate) return false;
    const d = new Date(checkInDate.getTime());
    while (d < checkOutDate) {
      if (blockedSet.has(toLocalDateStr(d))) return true;
      d.setDate(d.getDate() + 1);
    }
    return false;
  })();

  // Total room cost = rate per person × number of people × number of nights
  const subtotalRoom = nights * priceNum * guests;
  const extraTotal = (() => {
    if (!extraServices?.length || !selectedExtraServices?.length) return 0;
    let sum = 0;
    for (const sel of selectedExtraServices) {
      const s = extraServices.find((e) => e.id === sel.extra_service_id);
      if (!s) continue;
      const p = Number(s.price_npr);
      if (s.unit === 'per_person') sum += p * sel.quantity * guests;
      else sum += p * sel.quantity;
    }
    return Math.round(sum * 100) / 100;
  })();
  const subtotal = subtotalRoom + extraTotal;
  const isPartial = paymentType === 'partial';
  let feeAmount = 0;
  let feeLabel = '';
  if (!isPartial && bookingFee && bookingFee.value > 0) {
    const raw =
      bookingFee.kind === 'percent' ? (subtotal * bookingFee.value) / 100 : bookingFee.value;
    const rawRounded = Math.round(raw);
    if (bookingFee.type === 'discount') {
      feeAmount = -rawRounded;
      feeLabel = `Discount${bookingFee.kind === 'percent' ? ` (${bookingFee.value}%)` : ''}`;
    } else if (bookingFee.applies_to === 'host') {
      feeAmount = 0;
      feeLabel = '';
    } else {
      feeAmount = rawRounded;
      feeLabel = `Service fee${bookingFee.kind === 'percent' ? ` (${bookingFee.value}%)` : ''}`;
    }
  } else if (isPartial && bookingFee && bookingFee.value > 0 && bookingFee.type === 'service_charge' && bookingFee.applies_to !== 'host') {
    const raw = bookingFee.kind === 'percent' ? (subtotal * bookingFee.value) / 100 : bookingFee.value;
    feeAmount = Math.round(raw);
    feeLabel = `Service fee${bookingFee.kind === 'percent' ? ` (${bookingFee.value}%)` : ''}`;
  }
  const total = Math.max(0, Math.round(subtotal + feeAmount));
  const payNowAmount = isPartial ? Math.round((total * Math.min(99, Math.max(partialPaymentMinPercent, partialPercent))) / 100) : total;
  const payNowPercent = total > 0 ? Math.round((payNowAmount / total) * 100) : partialPercent;

  const isDisabled = hasUnavailableInRange || !checkIn || !checkOut || nights <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-24 bg-card rounded-2xl border border-border shadow-lg p-6"
    >
      {/* Price and Rating */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-2xl font-bold text-foreground">{displayPrice}</span>
          <span className="text-muted-foreground"> /night</span>
        </div>
        {(rating != null || totalReviews > 0) && (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-accent text-accent" />
            <span className="font-medium">{rating != null ? rating.toFixed(1) : '—'}</span>
            <span className="text-muted-foreground">({totalReviews})</span>
          </div>
        )}
      </div>

      {/* Date and Guest Selection */}
      <form onSubmit={onSubmit} className="space-y-0">
        <div className="border border-border rounded-xl overflow-hidden mb-4">
          <div className="grid grid-cols-2 divide-x divide-border">
            <div className="p-3 hover:bg-muted/50 transition-colors">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block">
                Check-in
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => onCheckInChange(e.target.value)}
                className="text-sm mt-1 flex items-center gap-2 w-full bg-transparent border-0 p-0 text-foreground focus:outline-none focus:ring-0"
                min={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="p-3 hover:bg-muted/50 transition-colors">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block">
                Check-out
              </label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => onCheckOutChange(e.target.value)}
                className="text-sm mt-1 w-full bg-transparent border-0 p-0 text-foreground focus:outline-none focus:ring-0"
                min={checkIn || new Date().toISOString().slice(0, 10)}
              />
            </div>
          </div>

          {/* Calendar grid: blocked dates are disabled and visually marked */}
          <div className="border-t border-border p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {calendarMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              </span>
              <div className="flex items-center gap-0">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center">
              {WEEKDAYS.map((wd) => (
                <div key={wd} className="text-[10px] font-medium text-muted-foreground py-1">
                  {wd}
                </div>
              ))}
              {calendarDays.map(({ date, dateStr, isCurrentMonth }) => {
                const isPast = dateStr < todayStr;
                const isBlocked = blockedSet.has(dateStr);
                const disabled = isPast || isBlocked;
                const isCheckIn = dateStr === checkIn;
                const isCheckOut = dateStr === checkOut;
                const inRange =
                  checkIn &&
                  checkOut &&
                  dateStr > checkIn &&
                  dateStr < checkOut;
                return (
                  <button
                    key={dateStr}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      if (disabled) return;
                      if (!checkIn || dateStr <= checkIn) {
                        onCheckInChange(dateStr);
                        onCheckOutChange('');
                      } else {
                        const from = new Date(checkIn);
                        const to = new Date(dateStr);
                        for (let d = new Date(from); d < to; d.setDate(d.getDate() + 1)) {
                          if (blockedSet.has(toLocalDateStr(d))) return;
                        }
                        onCheckOutChange(dateStr);
                      }
                    }}
                    className={`
                      min-w-[28px] h-7 text-xs rounded-md transition-colors
                      ${!isCurrentMonth ? 'text-muted-foreground/60' : ''}
                      ${disabled ? 'cursor-not-allowed' : 'hover:bg-muted cursor-pointer'}
                      ${isBlocked ? 'bg-muted/80 text-muted-foreground line-through' : ''}
                      ${isPast && !isBlocked ? 'opacity-50' : ''}
                      ${!disabled && (isCheckIn || isCheckOut) ? 'bg-primary text-primary-foreground font-semibold' : ''}
                      ${!disabled && inRange ? 'bg-primary/20 text-primary-foreground' : ''}
                    `}
                    title={isBlocked ? 'Unavailable' : disabled ? 'Past' : undefined}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
            {blockedDates.length > 0 && (
              <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded bg-muted/80 border border-border" />
                Unavailable dates
              </p>
            )}
          </div>

          <div className="border-t border-border">
            <button
              type="button"
              onClick={() => setShowGuestPicker(!showGuestPicker)}
              className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block">
                  Guests
                </span>
                <span className="text-sm text-foreground">
                  {guests} guest{guests > 1 ? 's' : ''}
                </span>
              </div>
              {showGuestPicker ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {showGuestPicker && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="border-t border-border p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-foreground">Guests</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onGuestsChange(Math.max(1, guests - 1))}
                      className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
                      disabled={guests <= 1}
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium">{guests}</span>
                    <button
                      type="button"
                      onClick={() => onGuestsChange(Math.min(maxGuests, guests + 1))}
                      className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
                      disabled={guests >= maxGuests}
                    >
                      +
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Maximum {maxGuests} guests</p>
              </motion.div>
            )}
          </div>
        </div>

        {extraServices && extraServices.length > 0 && onExtraServicesChange && (
          <div className="mb-4 p-3 rounded-xl border border-border bg-muted/30 space-y-2">
            <p className="text-sm font-medium text-foreground">Add extra services</p>
            {extraServices.map((s) => {
              const sel = selectedExtraServices.find((e) => e.extra_service_id === s.id);
              const qty = sel?.quantity ?? 0;
              const priceNum = Number(s.price_npr);
              const unitLabel = s.unit === 'per_person' ? 'per person' : s.unit === 'per_group' ? 'per group' : 'fixed';
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 py-2 min-h-[44px]"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm text-foreground truncate">{s.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatPrice(String(priceNum))} {unitLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="text-xs text-muted-foreground whitespace-nowrap">No. of days</label>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={qty}
                      onChange={(e) => {
                        const n = Math.min(99, Math.max(0, parseInt(e.target.value, 10) || 0));
                        if (n === 0) {
                          onExtraServicesChange(selectedExtraServices.filter((e) => e.extra_service_id !== s.id));
                        } else {
                          const rest = selectedExtraServices.filter((e) => e.extra_service_id !== s.id);
                          onExtraServicesChange([...rest, { extra_service_id: s.id, quantity: n }]);
                        }
                      }}
                      className="w-14 rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                      placeholder="0"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {onPaymentTypeChange && nights > 0 && !hasUnavailableInRange && (
          <div className="mb-4 p-3 rounded-xl border border-border bg-muted/30 space-y-3">
            <p className="text-sm font-medium text-foreground">Payment at reservation</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onPaymentTypeChange('full')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${paymentType === 'full' ? 'bg-primary text-primary-foreground' : 'bg-background border border-border text-muted-foreground hover:bg-muted/50'}`}
              >
                Pay in full now
              </button>
              <button
                type="button"
                onClick={() => onPaymentTypeChange('partial')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${paymentType === 'partial' ? 'bg-primary text-primary-foreground' : 'bg-background border border-border text-muted-foreground hover:bg-muted/50'}`}
              >
                Pay partial now
              </button>
            </div>
            {isPartial && (
              <>
                <p className="text-xs text-muted-foreground">No discount when paying partial. Rest at checkout.</p>
                {onPartialPercentChange && (
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Pay now: {payNowPercent}% (min {partialPaymentMinPercent}%)
                    </label>
                    <input
                      type="range"
                      min={partialPaymentMinPercent}
                      max={99}
                      value={Math.max(partialPaymentMinPercent, Math.min(99, partialPercent))}
                      onChange={(e) => onPartialPercentChange(Number(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none bg-muted accent-primary"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {hasUnavailableInRange && (
          <div className="flex items-center gap-2 text-destructive text-sm mb-4 p-3 bg-destructive/10 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Some dates in your selection are unavailable</span>
          </div>
        )}

        <Button
          type="submit"
          disabled={isDisabled || submitting}
          className="w-full mt-4 py-6 text-lg font-semibold bg-primary hover:bg-primary/90 rounded-xl disabled:opacity-50"
        >
          {submitting ? 'Redirecting…' : isPartial ? `Pay ${formatPrice(String(payNowAmount.toFixed(2)))} now (${payNowPercent}%)` : 'Reserve Now'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-3">
        {isPartial ? 'Rest to be paid at checkout. Host will mark as paid.' : submitLabel}
      </p>

      {nights > 0 && !hasUnavailableInRange && (
        <div className="mt-6 pt-6 border-t border-border space-y-3">
          <div className="flex justify-between text-foreground">
            <span className="underline">
              {displayPrice} × {guests} guest{guests > 1 ? 's' : ''} × {nights} night{nights > 1 ? 's' : ''}
            </span>
            <span>{formatPrice(String(subtotalRoom))}</span>
          </div>
          {extraTotal > 0 && (
            <div className="flex justify-between text-foreground">
              <span className="underline">Extra services</span>
              <span>{formatPrice(String(extraTotal))}</span>
            </div>
          )}
          {feeAmount !== 0 && (
            <div className="flex justify-between text-foreground">
              <span className="underline">{feeLabel}</span>
              <span>{feeAmount > 0 ? formatPrice(String(feeAmount)) : `-${formatPrice(String(Math.abs(feeAmount)))}`}</span>
            </div>
          )}
          {isPartial && (
            <div className="flex justify-between text-muted-foreground text-sm">
              <span>No discount (partial payment)</span>
              <span>—</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-foreground pt-3 border-t border-border">
            <span>Total</span>
            <span>{formatPrice(String(total))}</span>
          </div>
          {isPartial && total > payNowAmount && (
            <div className="flex justify-between text-sm text-foreground">
              <span>Pay now ({payNowPercent}%)</span>
              <span>{formatPrice(String(Math.round(payNowAmount)))}</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-border space-y-3">
        {badges.map((line, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="w-4 h-4 text-primary flex-shrink-0" />
            <span>{line}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
