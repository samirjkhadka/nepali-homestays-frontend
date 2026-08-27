import { useCallback, useEffect, useState } from 'react';
import { Link2, Copy, Check, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface CalendarFeed {
  id: number;
  url: string;
  label: string | null;
  last_synced_at: string | null;
  last_status: string | null;
  last_error: string | null;
  last_event_count: number | null;
}

interface CalendarSyncPanelProps {
  /** Empty until the host picks a listing. */
  listingId: string;
}

function formatSynced(feed: CalendarFeed): string {
  if (!feed.last_synced_at) return 'Waiting for the first check';
  const when = new Date(feed.last_synced_at).toLocaleString();
  if (feed.last_status === 'ok') {
    const n = feed.last_event_count ?? 0;
    return `${n} ${n === 1 ? 'date' : 'dates'} imported · ${when}`;
  }
  return feed.last_error ? `${feed.last_error} · ${when}` : `Last check failed · ${when}`;
}

/**
 * Connects a listing's calendar to the other sites a host lists on.
 *
 * Two directions, and hosts routinely confuse them, so each half says plainly
 * which way the dates travel rather than relying on the words import and export.
 */
export function CalendarSyncPanel({ listingId }: CalendarSyncPanelProps) {
  const { toast } = useToast();
  const [exportUrl, setExportUrl] = useState('');
  const [feeds, setFeeds] = useState<CalendarFeed[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadFeeds = useCallback(() => {
    if (!listingId) return;
    setLoading(true);
    api
      .get<{ feeds: CalendarFeed[] }>(`/api/host/listings/${listingId}/calendar/feeds`)
      .then((res) => setFeeds(res.data?.feeds ?? []))
      .catch(() => setFeeds([]))
      .finally(() => setLoading(false));
  }, [listingId]);

  useEffect(() => {
    if (!listingId) {
      setExportUrl('');
      setFeeds([]);
      return;
    }
    // Requesting the link is what mints the token, so this runs only once a
    // listing is actually selected rather than for every listing on load.
    api
      .get<{ url: string }>(`/api/host/listings/${listingId}/calendar/export`)
      .then((res) => setExportUrl(res.data?.url ?? ''))
      .catch(() => setExportUrl(''));
    loadFeeds();
  }, [listingId, loadFeeds]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exportUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Could not copy. Select the link and copy it manually.', variant: 'destructive' });
    }
  };

  const addFeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!listingId || !newUrl.trim()) return;
    setAdding(true);
    api
      .post(`/api/host/listings/${listingId}/calendar/feeds`, { url: newUrl.trim(), label: newLabel.trim() || null })
      .then(() => {
        toast({ title: 'Calendar connected. Dates appear after the next check.' });
        setNewUrl('');
        setNewLabel('');
        loadFeeds();
      })
      .catch((err) =>
        toast({ title: err.response?.data?.message || 'Could not connect that calendar.', variant: 'destructive' })
      )
      .finally(() => setAdding(false));
  };

  const removeFeed = (id: number) => {
    api
      .delete(`/api/host/listings/${listingId}/calendar/feeds/${id}`)
      .then(() => {
        toast({ title: 'Calendar disconnected. Its dates are now free again.' });
        loadFeeds();
      })
      .catch(() => toast({ title: 'Could not disconnect that calendar.', variant: 'destructive' }));
  };

  if (!listingId) return null;

  return (
    <Card className="mt-6 border-primary-200">
      <CardHeader className="border-b border-primary-100 bg-primary-50/50">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-accent-500" />
          <h3 className="font-semibold text-primary-800">Calendar sync</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Keep this homestay in step with the other sites you list on, so the same nights are never sold twice.
        </p>
      </CardHeader>

      <CardContent className="space-y-8 p-6">
        <section className="space-y-2">
          <Label className="text-primary-800">Share your dates with other sites</Label>
          <p className="text-sm text-muted-foreground">
            Copy this link and paste it into Airbnb, Booking.com or Vrbo. They will see the nights booked here and stop
            selling them. It shows dates only — no guest names, no prices.
          </p>
          <div className="flex gap-2">
            <Input readOnly value={exportUrl} onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
            <Button type="button" variant="outline" onClick={copy} disabled={!exportUrl} className="shrink-0">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="ml-2">{copied ? 'Copied' : 'Copy'}</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Treat this link as private. Anyone who has it can see when this homestay is busy.
          </p>
        </section>

        <section className="space-y-3">
          <div>
            <Label className="text-primary-800">Bring dates in from other sites</Label>
            <p className="text-sm text-muted-foreground">
              Paste the calendar link each site gives you. We check every 15 minutes and make those nights unavailable
              here.
            </p>
          </div>

          <form onSubmit={addFeed} className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://www.airbnb.com/calendar/ical/..."
              className="flex-1"
              aria-label="Calendar link"
            />
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Airbnb"
              className="sm:w-40"
              aria-label="Name for this calendar"
            />
            <Button type="submit" disabled={adding || !newUrl.trim()} className="shrink-0">
              {adding ? 'Connecting…' : 'Connect'}
            </Button>
          </form>

          {loading && <p className="text-sm text-muted-foreground">Loading connected calendars…</p>}

          {!loading && feeds.length === 0 && (
            <p className="text-sm text-muted-foreground">No calendars connected yet.</p>
          )}

          <ul className="divide-y divide-primary-100 rounded-md border border-primary-100">
            {feeds.map((feed) => (
              <li key={feed.id} className="flex items-start justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="font-medium text-primary-800">{feed.label || 'Connected calendar'}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">{feed.url}</p>
                  <p
                    className={`mt-1 flex items-center gap-1 text-xs ${
                      feed.last_status === 'error' ? 'text-destructive' : 'text-muted-foreground'
                    }`}
                  >
                    {feed.last_status === 'error' ? (
                      <AlertCircle className="h-3 w-3 shrink-0" />
                    ) : (
                      <RefreshCw className="h-3 w-3 shrink-0" />
                    )}
                    {formatSynced(feed)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFeed(feed.id)}
                  aria-label={`Disconnect ${feed.label || 'this calendar'}`}
                  className="shrink-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      </CardContent>
    </Card>
  );
}
