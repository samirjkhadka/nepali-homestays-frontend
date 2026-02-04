import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { jsPDF } from 'jspdf';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { Users, FileCheck, Calendar, CreditCard, BarChart3, FileText, Youtube, X, Download, Home, MessageSquare, Bell, Activity, AlertCircle, Mail, MousePointer, Building2, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type Listing = { id: number; title: string; host_id: number; status: string; created_at: string; badge?: string | null };
type ApprovedListing = { id: number; title: string; location: string; badge: string | null };
type LiveListing = { id: number; title: string; location: string; badge: string | null; status: string };
type User = { id: number; name: string; email: string; phone: string | null; role: string };
type VideoEntry = { url: string; title?: string };
type AdminBooking = { id: number; listing_id: number; listing_title: string; guest_name: string; guest_email: string; check_in: string; check_out: string; guests: number; status: string; created_at: string; corporate_name?: string | null };
type AdminPayment = { id: number; booking_id: number; amount: number; status: string; created_at: string; listing_title: string; guest_name: string };
type Corporate = { id: number; name: string; status: string; contact_name: string | null; contact_email: string | null; contact_phone: string | null; billing_method: string | null; approval_required: boolean; max_nightly_rate: number | null; notes: string | null; created_at: string; updated_at: string };
type CmsSection = { id: number; section_key: string; title: string | null; content: string | null; display_place: string; sort_order: number; created_at: string; updated_at: string };

type ListingDisplaySettings = {
  badge_labels: Record<string, string>;
  section_labels: Record<string, string>;
  highlights: {
    free_cancellation_title: string;
    free_cancellation_description: string;
    great_communication_title: string;
    great_communication_description: string;
    superhost_title: string;
    superhost_description: string;
  };
  trust_badges: string[];
  empty_fallbacks: { no_description: string; default_host_name: string; no_directions: string };
};

type SparrowSmsSettings = { token: string; from: string };

type NotificationSettings = {
  otp: { email: boolean; sms: boolean };
  listing_submitted: { host_email: boolean; host_sms: boolean };
  listing_approved: { host_email: boolean; host_sms: boolean };
  listing_rejected: { host_email: boolean; host_sms: boolean };
  booking_created: { host_email: boolean; host_sms: boolean };
  booking_approved: { guest_email: boolean; guest_sms: boolean };
  booking_declined: { guest_email: boolean; guest_sms: boolean };
  payment_succeeded: { guest_email: boolean; guest_sms: boolean; host_email: boolean; host_sms: boolean };
};

type HomePlacementSettings = {
  hero_carousel_listing_ids: number[];
  featured_listing_ids: number[];
  hero_carousel_price: number;
  featured_placement_price: number;
};

const ADMIN_TABS = ['overview', 'listings', 'users', 'bookings', 'corporates', 'payments', 'reports', 'content', 'settings', 'logs'] as const;
type AdminTab = (typeof ADMIN_TABS)[number];

const LOGS_SUBTABS = ['email_sms', 'journey', 'api', 'errors', 'analytics', 'heatmap'] as const;
type LogsSubTab = (typeof LOGS_SUBTABS)[number];

function formatDateOnly(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function bookingStatusColor(s: string): string {
  if (s === 'paid' || s === 'completed') return 'bg-green-100 text-green-800';
  if (s === 'declined' || s === 'cancelled') return 'bg-red-100 text-red-800';
  return 'bg-yellow-100 text-yellow-800';
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const location = useLocation();
  const [tab, setTab] = useState<AdminTab>('overview');

  useEffect(() => {
    const stateTab = (location.state as { tab?: string } | null)?.tab;
    if (stateTab && ADMIN_TABS.includes(stateTab as AdminTab)) setTab(stateTab as AdminTab);
  }, [location.state]);
  const [pendingListings, setPendingListings] = useState<Listing[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<{ total_users?: number; total_listings?: number; total_bookings?: number; total_revenue?: number }>({});
  const [adminBookings, setAdminBookings] = useState<AdminBooking[]>([]);
  const [adminBookingsTotal, setAdminBookingsTotal] = useState(0);
  const [adminBookingsStatus, setAdminBookingsStatus] = useState<string>('');
  const [adminPayments, setAdminPayments] = useState<AdminPayment[]>([]);
  const [adminPaymentsTotal, setAdminPaymentsTotal] = useState(0);
  const [landingYoutubeUrl, setLandingYoutubeUrl] = useState('');
  const [landingYoutubeSaving, setLandingYoutubeSaving] = useState(false);
  const [youtubeVideoUrls, setYoutubeVideoUrls] = useState<VideoEntry[]>([]);
  const [youtubeVideoUrlsSaving, setYoutubeVideoUrlsSaving] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [_bookingFee, setBookingFee] = useState<{ type: 'service_charge' | 'discount'; kind: 'percent' | 'fixed'; value: number } | null>(null);
  const [bookingFeeSaving, setBookingFeeSaving] = useState(false);
  const [bookingFeeForm, setBookingFeeForm] = useState({ type: 'service_charge' as 'service_charge' | 'discount', kind: 'percent' as 'percent' | 'fixed', value: '', applies_to: 'guest' as 'guest' | 'host' });
  const [_listingDisplay, setListingDisplay] = useState<ListingDisplaySettings | null>(null);
  const [listingDisplaySaving, setListingDisplaySaving] = useState(false);
  const [listingDisplayForm, setListingDisplayForm] = useState<ListingDisplaySettings | null>(null);
  const [sectionLabelsJson, setSectionLabelsJson] = useState('');
  const [newTrustBadge, setNewTrustBadge] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null);
  const [liveListings, setLiveListings] = useState<LiveListing[]>([]);
  const [sparrowSms, setSparrowSms] = useState<SparrowSmsSettings>({ token: '', from: '' });
  const [sparrowSmsSaving, setSparrowSmsSaving] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [notificationSettingsSaving, setNotificationSettingsSaving] = useState(false);
  const [homePlacements, setHomePlacements] = useState<HomePlacementSettings | null>(null);
  const [homePlacementsSaving, setHomePlacementsSaving] = useState(false);
  const [settingsApprovedListings, setSettingsApprovedListings] = useState<ApprovedListing[]>([]);
  const [logsSubTab, setLogsSubTab] = useState<LogsSubTab>('email_sms');
  const [logDateFrom, setLogDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10);
  });
  const [logDateTo, setLogDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [emailSmsLogRows, setEmailSmsLogRows] = useState<{ id: number; channel: string; recipient: string; subject: string | null; body_preview: string | null; event_type: string | null; status: string; api_response: string | null; created_at: string }[]>([]);
  const [emailSmsLogTotal, setEmailSmsLogTotal] = useState(0);
  const [journeyLogRows, setJourneyLogRows] = useState<{ id: number; user_id: number | null; session_id: string; event_type: string; page_or_route: string | null; payload: string | null; created_at: string }[]>([]);
  const [journeyLogTotal, setJourneyLogTotal] = useState(0);
  const [apiLogRows, setApiLogRows] = useState<{ id: number; method: string; path: string; user_id: number | null; response_status: number; response_time_ms: number; created_at: string }[]>([]);
  const [apiLogTotal, setApiLogTotal] = useState(0);
  const [errorLogRows, setErrorLogRows] = useState<{ id: number; source: string; level: string; message: string; stack_or_detail: string | null; user_id: number | null; request_path: string | null; request_id: string | null; created_at: string }[]>([]);
  const [errorLogTotal, setErrorLogTotal] = useState(0);
  const [analyticsData, setAnalyticsData] = useState<{ email_sms_by_day: { day: string; channel: string; count: number }[]; journey_by_day: { day: string; event_type: string; count: number }[]; api_by_day: { day: string; status_bucket: string; count: number }[]; errors_by_day: { day: string; source: string; count: number }[] } | null>(null);
  const [heatmapPageViews, setHeatmapPageViews] = useState<{ path: string; views: number }[]>([]);
  const [heatmapClicks, setHeatmapClicks] = useState<{ id: number; session_id: string; page_or_route: string | null; payload: string | null; created_at: string }[]>([]);
  const [logPage, setLogPage] = useState(1);
  const [logChannel, setLogChannel] = useState<string>('');
  const [logEventType, setLogEventType] = useState<string>('');
  const [logPath, setLogPath] = useState('');
  const [logSource, setLogSource] = useState<string>('');
  const [selectedEmailSmsId, setSelectedEmailSmsId] = useState<number | null>(null);
  const [emailSmsDetail, setEmailSmsDetail] = useState<{ id: number; channel: string; recipient: string; subject: string | null; body_or_message: string | null; event_type: string | null; status: string; api_response: string | null; created_at: string } | null>(null);
  const [selectedJourneySessionId, setSelectedJourneySessionId] = useState<string | null>(null);
  const [journeySessionEvents, setJourneySessionEvents] = useState<{ id: number; user_id: number | null; session_id: string; event_type: string; page_or_route: string | null; payload: string | null; created_at: string }[]>([]);
  const [selectedApiLog, setSelectedApiLog] = useState<{ id: number; method: string; path: string; user_id: number | null; response_status: number; response_time_ms: number; created_at: string } | null>(null);
  const [selectedErrorLog, setSelectedErrorLog] = useState<{ id: number; source: string; level: string; message: string; stack_or_detail: string | null; user_id: number | null; request_path: string | null; request_id: string | null; created_at: string } | null>(null);
  const [selectedHeatmapPath, setSelectedHeatmapPath] = useState<string | null>(null);
  // Corporates tab
  const [corporates, setCorporates] = useState<Corporate[]>([]);
  const [corporatesTotal, setCorporatesTotal] = useState(0);
  const [corporatesSearch, setCorporatesSearch] = useState('');
  const [corporatesStatus, setCorporatesStatus] = useState<string>('');
  const [corporateFormOpen, setCorporateFormOpen] = useState(false);
  const [editingCorporate, setEditingCorporate] = useState<Corporate | null>(null);
  const [corporateForm, setCorporateForm] = useState<Partial<Corporate>>({ name: '', status: 'provisional', contact_name: '', contact_email: '', contact_phone: '', billing_method: '', approval_required: false, max_nightly_rate: null, notes: '' });
  const [corporateFormSaving, setCorporateFormSaving] = useState(false);
  const [createBookingOpen, setCreateBookingOpen] = useState(false);
  const [createBookingForm, setCreateBookingForm] = useState({ corporate_id: '' as string, listing_id: '', guest_id: '', check_in: '', check_out: '', guests: '1', message: '' });
  const [createBookingSaving, setCreateBookingSaving] = useState(false);
  const [corporatesApprovedListings, setCorporatesApprovedListings] = useState<ApprovedListing[]>([]);
  // CMS (content tab)
  const [cmsSections, setCmsSections] = useState<CmsSection[]>([]);
  const [cmsSectionsLoading, setCmsSectionsLoading] = useState(false);
  const [editingCmsSection, setEditingCmsSection] = useState<CmsSection | null>(null);
  const [cmsSectionForm, setCmsSectionForm] = useState<{ section_key: string; title: string; content: string; display_place: string; sort_order: number }>({ section_key: '', title: '', content: '', display_place: 'footer', sort_order: 0 });
  const [cmsSectionSaving, setCmsSectionSaving] = useState(false);
  const [newCmsSectionKey, setNewCmsSectionKey] = useState('');

  useEffect(() => {
    api.get<{
      pending_listings?: Listing[]; listings?: Listing[]; users?: User[];
      total_users?: number; total_listings?: number; total_bookings?: number; total_revenue?: number;
    }>('/api/admin/dashboard').then((res) => {
      setPendingListings(res.data.pending_listings || res.data.listings || []);
      setUsers(res.data.users || []);
      setStats({
        total_users: res.data.total_users,
        total_listings: res.data.total_listings,
        total_bookings: res.data.total_bookings,
        total_revenue: res.data.total_revenue,
      });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab !== 'bookings' && tab !== 'reports') return;
    const params = new URLSearchParams();
    if (tab === 'bookings' && adminBookingsStatus) params.set('status', adminBookingsStatus);
    api.get<{ bookings: AdminBooking[]; total: number }>(`/api/admin/bookings?${params}`).then((res) => {
      setAdminBookings(res.data.bookings || []);
      setAdminBookingsTotal(res.data.total ?? 0);
    }).catch(() => { setAdminBookings([]); setAdminBookingsTotal(0); });
  }, [tab, adminBookingsStatus]);

  useEffect(() => {
    if (tab !== 'payments') return;
    api.get<{ payments: AdminPayment[]; total: number }>('/api/admin/payments').then((res) => {
      setAdminPayments(res.data.payments || []);
      setAdminPaymentsTotal(res.data.total ?? 0);
    }).catch(() => { setAdminPayments([]); setAdminPaymentsTotal(0); });
  }, [tab]);

  useEffect(() => {
    if (tab !== 'listings') return;
    api.get<{ listings: Listing[] }>('/api/admin/listings').then((res) => {
      setPendingListings(res.data.listings || []);
    }).catch(() => setPendingListings([]));
    api.get<{ listings: LiveListing[] }>('/api/admin/listings/live').then((res) => {
      setLiveListings(res.data.listings || []);
    }).catch(() => setLiveListings([]));
  }, [tab]);

  useEffect(() => {
    if (tab !== 'corporates') return;
    const params = new URLSearchParams();
    if (corporatesSearch.trim()) params.set('search', corporatesSearch.trim());
    if (corporatesStatus) params.set('status', corporatesStatus);
    api.get<{ corporates: Corporate[]; total: number }>(`/api/admin/corporates?${params}`).then((res) => {
      setCorporates(res.data.corporates || []);
      setCorporatesTotal(res.data.total ?? 0);
    }).catch(() => { setCorporates([]); setCorporatesTotal(0); });
  }, [tab, corporatesSearch, corporatesStatus]);

  useEffect(() => {
    if (tab !== 'corporates') return;
    api.get<{ listings: ApprovedListing[] }>('/api/admin/listings/approved').then((res) => {
      setCorporatesApprovedListings(res.data.listings || []);
    }).catch(() => setCorporatesApprovedListings([]));
  }, [tab]);

  useEffect(() => {
    if (tab !== 'content') return;
    api.get<{ landing_youtube_url?: string | null; youtube_video_urls?: VideoEntry[] }>('/api/admin/settings').then((res) => {
      setLandingYoutubeUrl(res.data.landing_youtube_url || '');
      setYoutubeVideoUrls(Array.isArray(res.data.youtube_video_urls) ? res.data.youtube_video_urls : []);
    }).catch(() => { setLandingYoutubeUrl(''); setYoutubeVideoUrls([]); });
  }, [tab]);

  useEffect(() => {
    if (tab !== 'content') return;
    setCmsSectionsLoading(true);
    api.get<{ sections: CmsSection[] }>('/api/admin/cms/sections').then((res) => {
      setCmsSections(res.data.sections || []);
    }).catch(() => setCmsSections([])).finally(() => setCmsSectionsLoading(false));
  }, [tab]);

  useEffect(() => {
    if (tab !== 'settings') return;
    Promise.all([
      api.get<{
        booking_fee?: { type: 'service_charge' | 'discount'; kind: 'percent' | 'fixed'; value: number; applies_to?: 'guest' | 'host' } | null;
        listing_display?: ListingDisplaySettings;
        sparrow_sms?: SparrowSmsSettings;
        notification_settings?: NotificationSettings;
        home_placements?: HomePlacementSettings;
      }>('/api/admin/settings'),
      api.get<{ listings: ApprovedListing[] }>('/api/admin/listings/approved'),
    ]).then(([settingsRes, listingsRes]) => {
      const res = settingsRes.data;
      const bf = res.booking_fee ?? null;
      setBookingFee(bf);
      setBookingFeeForm(bf ? { type: bf.type, kind: bf.kind, value: String(bf.value), applies_to: bf.applies_to ?? 'guest' } : { type: 'service_charge', kind: 'percent', value: '', applies_to: 'guest' });
      const ld = res.listing_display ?? null;
      setListingDisplay(ld);
      const form = ld ? JSON.parse(JSON.stringify(ld)) : null;
      setListingDisplayForm(form);
      setSectionLabelsJson(form?.section_labels ? JSON.stringify(form.section_labels, null, 2) : '{}');
      setSparrowSms(res.sparrow_sms ?? { token: '', from: '' });
      setNotificationSettings(res.notification_settings ?? null);
      setHomePlacements(res.home_placements ?? { hero_carousel_listing_ids: [], featured_listing_ids: [], hero_carousel_price: 0, featured_placement_price: 0 });
      setSettingsApprovedListings(listingsRes.data?.listings ?? []);
    }).catch(() => {
      setBookingFee(null);
      setBookingFeeForm({ type: 'service_charge', kind: 'percent', value: '', applies_to: 'guest' });
      setListingDisplay(null);
      setListingDisplayForm(null);
      setSectionLabelsJson('{}');
      setSparrowSms({ token: '', from: '' });
      setNotificationSettings(null);
      setHomePlacements(null);
      setSettingsApprovedListings([]);
    });
  }, [tab]);

  useEffect(() => {
    if (tab !== 'logs') return;
    const from = logDateFrom ? `${logDateFrom}T00:00:00.000Z` : undefined;
    const to = logDateTo ? `${logDateTo}T23:59:59.999Z` : undefined;
    const page = logPage;
    const limit = 25;
    const buildQ = (extra: Record<string, string> = {}) => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (from) params.set('from_date', from);
      if (to) params.set('to_date', to);
      Object.entries(extra).forEach(([k, v]) => { if (v) params.set(k, v); });
      return `?${params.toString()}`;
    };
    if (logsSubTab === 'email_sms') {
      api.get<{ rows: typeof emailSmsLogRows; total: number }>(`/api/admin/logs/email-sms${buildQ(logChannel ? { channel: logChannel } : {})}`).then((res) => {
        setEmailSmsLogRows(res.data.rows || []);
        setEmailSmsLogTotal(res.data.total ?? 0);
      }).catch(() => { setEmailSmsLogRows([]); setEmailSmsLogTotal(0); });
    } else if (logsSubTab === 'journey') {
      api.get<{ rows: typeof journeyLogRows; total: number }>(`/api/admin/logs/journey${buildQ(logEventType ? { event_type: logEventType } : {})}`).then((res) => {
        setJourneyLogRows(res.data.rows || []);
        setJourneyLogTotal(res.data.total ?? 0);
      }).catch(() => { setJourneyLogRows([]); setJourneyLogTotal(0); });
    } else if (logsSubTab === 'api') {
      api.get<{ rows: typeof apiLogRows; total: number }>(`/api/admin/logs/api${buildQ(logPath ? { path: logPath } : {})}`).then((res) => {
        setApiLogRows(res.data.rows || []);
        setApiLogTotal(res.data.total ?? 0);
      }).catch(() => { setApiLogRows([]); setApiLogTotal(0); });
    } else if (logsSubTab === 'errors') {
      api.get<{ rows: typeof errorLogRows; total: number }>(`/api/admin/logs/errors${buildQ(logSource ? { source: logSource } : {})}`).then((res) => {
        setErrorLogRows(res.data.rows || []);
        setErrorLogTotal(res.data.total ?? 0);
      }).catch(() => { setErrorLogRows([]); setErrorLogTotal(0); });
    } else if (logsSubTab === 'analytics' && from && to) {
      api.get<typeof analyticsData>(`/api/admin/logs/analytics?from_date=${encodeURIComponent(from)}&to_date=${encodeURIComponent(to)}`).then((res) => {
        setAnalyticsData(res.data);
      }).catch(() => setAnalyticsData(null));
    } else if (logsSubTab === 'heatmap' && from && to) {
      api.get<{ rows: typeof heatmapPageViews }>(`/api/admin/logs/heatmap/page-views?from_date=${encodeURIComponent(from)}&to_date=${encodeURIComponent(to)}&limit=50`).then((res) => {
        setHeatmapPageViews(res.data.rows || []);
      }).catch(() => setHeatmapPageViews([]));
      api.get<{ rows: typeof heatmapClicks }>(`/api/admin/logs/heatmap/clicks?from_date=${encodeURIComponent(from)}&to_date=${encodeURIComponent(to)}&limit=200`).then((res) => {
        setHeatmapClicks(res.data.rows || []);
      }).catch(() => setHeatmapClicks([]));
    }
  }, [tab, logsSubTab, logDateFrom, logDateTo, logPage, logChannel, logEventType, logPath, logSource]);

  useEffect(() => {
    if (!selectedJourneySessionId || tab !== 'logs') return;
    const from = logDateFrom ? `${logDateFrom}T00:00:00.000Z` : undefined;
    const to = logDateTo ? `${logDateTo}T23:59:59.999Z` : undefined;
    const params = new URLSearchParams({ session_id: selectedJourneySessionId, page: '1', limit: '500' });
    if (from) params.set('from_date', from);
    if (to) params.set('to_date', to);
    api.get<{ rows: typeof journeySessionEvents }>(`/api/admin/logs/journey?${params}`).then((res) => {
      const rows = (res.data.rows || []).sort((a: { created_at: string }, b: { created_at: string }) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setJourneySessionEvents(rows);
    }).catch(() => setJourneySessionEvents([]));
  }, [selectedJourneySessionId, tab, logDateFrom, logDateTo]);

  useEffect(() => {
    if (!selectedEmailSmsId) { setEmailSmsDetail(null); return; }
    api.get<typeof emailSmsDetail>(`/api/admin/logs/email-sms/${selectedEmailSmsId}`).then((res) => {
      setEmailSmsDetail(res.data);
    }).catch(() => setEmailSmsDetail(null));
  }, [selectedEmailSmsId]);

  const handleSaveLandingYoutube = (e: React.FormEvent) => {
    e.preventDefault();
    setLandingYoutubeSaving(true);
    api.patch('/api/admin/settings', { landing_youtube_url: landingYoutubeUrl.trim() || null })
      .then((res) => {
        setLandingYoutubeUrl(res.data.landing_youtube_url || '');
        toast({ title: 'Settings saved.' });
      })
      .catch(() => toast({ title: 'Failed to save.', variant: 'destructive' }))
      .finally(() => setLandingYoutubeSaving(false));
  };

  const handleSaveYoutubeVideoUrls = (e: React.FormEvent) => {
    e.preventDefault();
    setYoutubeVideoUrlsSaving(true);
    api.patch('/api/admin/settings', { youtube_video_urls: youtubeVideoUrls })
      .then((res) => {
        setYoutubeVideoUrls(Array.isArray(res.data.youtube_video_urls) ? res.data.youtube_video_urls : []);
        toast({ title: 'Video gallery saved.' });
      })
      .catch(() => toast({ title: 'Failed to save.', variant: 'destructive' }))
      .finally(() => setYoutubeVideoUrlsSaving(false));
  };

  const handleAddYoutubeVideo = (e: React.FormEvent) => {
    e.preventDefault();
    const url = newVideoUrl.trim();
    if (!url) return;
    const title = newVideoTitle.trim() || undefined;
    setYoutubeVideoUrls((prev) => [...prev, { url, title }]);
    setNewVideoUrl('');
    setNewVideoTitle('');
  };

  const handleRemoveYoutubeVideo = (index: number) => {
    setYoutubeVideoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApprove = (id: number) => {
    api.patch(`/api/admin/listings/${id}/approve`).then(() => {
      toast({ title: 'Listing approved.' });
      setPendingListings((list) => list.filter((l) => l.id !== id));
    }).catch(() => toast({ title: 'Failed.', variant: 'destructive' }));
  };

  const handleReject = (id: number) => {
    api.patch(`/api/admin/listings/${id}/reject`).then(() => {
      toast({ title: 'Listing rejected.' });
      setPendingListings((list) => list.filter((l) => l.id !== id));
    }).catch(() => toast({ title: 'Failed.', variant: 'destructive' }));
  };

  const handleBadgeChange = (id: number, badge: string | null) => {
    const value = badge === '' ? null : badge;
    api.patch(`/api/admin/listings/${id}/badge`, { badge: value })
      .then((res) => {
        toast({ title: 'Badge updated.' });
        setPendingListings((list) => list.map((l) => l.id === id ? { ...l, badge: res.data.listing?.badge ?? value } : l));
        setLiveListings((list) => list.map((l) => l.id === id ? { ...l, badge: value } : l));
      })
      .catch(() => toast({ title: 'Failed to update badge.', variant: 'destructive' }));
  };

  const handleStatusChange = (id: number, status: 'approved' | 'disabled') => {
    api.patch(`/api/admin/listings/${id}/status`, { status })
      .then((res) => {
        toast({ title: status === 'approved' ? 'Listing enabled.' : 'Listing disabled.' });
        setLiveListings((list) => list.map((l) => l.id === id ? { ...l, status: res.data.listing?.status ?? status } : l));
      })
      .catch(() => toast({ title: 'Failed to update status.', variant: 'destructive' }));
  };

  const handleRoleChange = (userId: number, role: string) => {
    api.patch(`/api/admin/users/${userId}`, { role }).then(() => {
      toast({ title: 'User updated.' });
      setUsers((list) => list.map((u) => u.id === userId ? { ...u, role } : u));
    }).catch(() => toast({ title: 'Failed.', variant: 'destructive' }));
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary-800">Admin dashboard</h1>
      <p className="mt-1 text-muted-foreground">Moderate listings and manage users</p>
      <div className="mt-6 flex flex-wrap gap-2 border-b border-primary-200">
        {ADMIN_TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={`px-4 py-2 font-medium capitalize transition-colors ${tab === t ? 'border-b-2 border-accent-500 text-accent-600' : 'text-muted-foreground hover:text-primary-700'}`}
            onClick={() => setTab(t)}
          >
            {t === 'listings' ? 'Pending listings' : t === 'corporates' ? 'Corporates' : t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="cursor-pointer border-primary-200 transition-shadow hover:shadow-md" onClick={() => setTab('listings')}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-full bg-accent-100 p-3">
                  <FileCheck className="h-8 w-8 text-accent-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-800">{pendingListings.length}</p>
                  <p className="text-sm text-muted-foreground">Pending listings</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer border-primary-200 transition-shadow hover:shadow-md" onClick={() => setTab('users')}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-full bg-primary-100 p-3">
                  <Users className="h-8 w-8 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-800">{stats.total_users ?? users.length}</p>
                  <p className="text-sm text-muted-foreground">Users</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer border-primary-200 transition-shadow hover:shadow-md" onClick={() => setTab('bookings')}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-full bg-primary-100 p-3">
                  <Calendar className="h-8 w-8 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-800">{stats.total_bookings ?? '—'}</p>
                  <p className="text-sm text-muted-foreground">Bookings</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer border-primary-200 transition-shadow hover:shadow-md" onClick={() => setTab('payments')}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-full bg-accent-100 p-3">
                  <CreditCard className="h-8 w-8 text-accent-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-800">NPR {Number(stats.total_revenue ?? 0).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="border-primary-200">
            <CardHeader className="border-b border-primary-100 bg-primary-50/50">
              <h2 className="font-semibold text-primary-800">Quick actions</h2>
              <p className="text-sm text-muted-foreground">Moderate listings and manage users from the tabs above</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-3">
                <Button size="sm" className="bg-accent-500 hover:bg-accent-600" onClick={() => setTab('listings')}>Review pending listings</Button>
                <Button size="sm" variant="outline" onClick={() => setTab('users')}>Manage users</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'listings' && (
        <div className="mt-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-primary-800">Listings</h2>
          <Button asChild className="bg-accent-500 hover:bg-accent-600">
            <Link to="/admin/listings/new">Add listing</Link>
          </Button>
        </div>
        <Card className="border-primary-200">
          <CardHeader className="border-b border-primary-100 bg-primary-50/50">
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-accent-500" />
              <span className="font-semibold text-primary-800 text-lg">Pending listings</span>
            </div>
            <p className="text-sm text-muted-foreground">Approve or reject new homestay listings</p>
          </CardHeader>
          <CardContent className="p-6">
            {pendingListings.length === 0 ? (
              <p className="text-muted-foreground">No pending listings.</p>
            ) : (
              <div className="space-y-4">
                {pendingListings.map((l) => (
                  <div key={l.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-primary-200 p-4">
                    <div>
                      <p className="font-medium text-primary-800">{l.title}</p>
                      <p className="text-sm text-muted-foreground">ID: {l.id}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={l.badge ?? ''}
                        onChange={(e) => handleBadgeChange(l.id, e.target.value || null)}
                        className="rounded-md border border-primary-200 bg-background px-2 py-1.5 text-sm"
                      >
                        <option value="">No badge</option>
                        <option value="recommended">Recommended</option>
                        <option value="featured">Featured</option>
                        <option value="new">New</option>
                      </select>
                      <Button size="sm" className="bg-accent-500 hover:bg-accent-600" onClick={() => handleApprove(l.id)}>Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleReject(l.id)}>Reject</Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/admin/listings/${l.id}/edit`}>Edit</Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/listings/${l.id}`} state={{ from: 'admin' }}>View</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary-200">
          <CardHeader className="border-b border-primary-100 bg-primary-50/50">
            <h2 className="font-semibold text-primary-800">Approved & disabled listings</h2>
            <p className="text-sm text-muted-foreground">Enable or disable homestays. Disabled listings are hidden from search and the site. Set badge for approved listings.</p>
          </CardHeader>
          <CardContent className="p-6">
            {liveListings.length === 0 ? (
              <p className="text-muted-foreground">No approved or disabled listings.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-primary-200 bg-primary-50/50">
                      <th className="p-3 text-left text-sm font-medium text-primary-800">ID</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Title</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Location</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Status</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Badge</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveListings.map((l) => (
                      <tr key={l.id} className="border-b border-primary-100">
                        <td className="p-3 text-sm">{l.id}</td>
                        <td className="p-3 font-medium text-primary-800">{l.title}</td>
                        <td className="p-3 text-sm text-muted-foreground">{l.location}</td>
                        <td className="p-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${l.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground'}`}>
                            {l.status === 'approved' ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td className="p-3">
                          <select
                            value={l.badge ?? ''}
                            onChange={(e) => handleBadgeChange(l.id, e.target.value || null)}
                            className="rounded-md border border-primary-200 bg-background px-2 py-1.5 text-sm"
                            disabled={l.status !== 'approved'}
                          >
                            <option value="">None</option>
                            <option value="recommended">Recommended</option>
                            <option value="featured">Featured</option>
                            <option value="new">New</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {l.status === 'approved' ? (
                              <Button type="button" variant="outline" size="sm" onClick={() => handleStatusChange(l.id, 'disabled')}>
                                Disable
                              </Button>
                            ) : (
                              <Button type="button" size="sm" className="bg-accent-500 hover:bg-accent-600" onClick={() => handleStatusChange(l.id, 'approved')}>
                                Enable
                              </Button>
                            )}
                            <Link to={`/admin/listings/${l.id}/edit`} className="text-sm text-primary hover:underline">Edit</Link>
                            <Link to={`/listings/${l.id}`} className="text-sm text-primary hover:underline" state={{ from: 'admin' }}>View</Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      )}

      {tab === 'users' && (
        <Card className="mt-6 border-primary-200">
          <CardHeader className="border-b border-primary-100 bg-primary-50/50">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-600" />
              <h2 className="font-semibold text-primary-800">Users</h2>
            </div>
            <p className="text-sm text-muted-foreground">Change user roles</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-primary-200 bg-primary-50/50">
                    <th className="p-3 text-left text-sm font-medium text-primary-800">ID</th>
                    <th className="p-3 text-left text-sm font-medium text-primary-800">Name</th>
                    <th className="p-3 text-left text-sm font-medium text-primary-800">Email</th>
                    <th className="p-3 text-left text-sm font-medium text-primary-800">Role</th>
                    <th className="p-3 text-left text-sm font-medium text-primary-800">Change role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-primary-100">
                      <td className="p-3 text-sm">{u.id}</td>
                      <td className="p-3 font-medium text-primary-800">{u.name}</td>
                      <td className="p-3 text-sm text-muted-foreground">{u.email}</td>
                      <td className="p-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${u.role === 'admin' ? 'bg-accent-100 text-accent-800' : u.role === 'host' ? 'bg-primary-100 text-primary-800' : 'bg-secondary-200 text-secondary-800'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="rounded-md border border-primary-200 bg-background px-2 py-1.5 text-sm"
                        >
                          <option value="guest">guest</option>
                          <option value="host">host</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'bookings' && (
        <Card className="mt-6 border-primary-200">
          <CardHeader className="border-b border-primary-100 bg-primary-50/50">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-accent-500" />
                  <h2 className="font-semibold text-primary-800">Booking oversight</h2>
                </div>
                <p className="text-sm text-muted-foreground">View all bookings ({adminBookingsTotal} total)</p>
              </div>
              <select
                value={adminBookingsStatus}
                onChange={(e) => setAdminBookingsStatus(e.target.value)}
                className="rounded-md border border-primary-200 bg-background px-3 py-2 text-sm"
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="pending_payment">Pending payment</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
                <option value="completed">Completed</option>
                <option value="declined">Declined</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {adminBookings.length === 0 ? (
                <p className="p-8 text-center text-muted-foreground">No bookings found.</p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-primary-200 bg-primary-50/50">
                      <th className="p-3 text-left text-sm font-medium text-primary-800">ID</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Listing</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Guest</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Corporate</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Dates</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Status</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminBookings.map((b) => (
                      <tr key={b.id} className="border-b border-primary-100">
                        <td className="p-3 text-sm">{b.id}</td>
                        <td className="p-3 font-medium text-primary-800">{b.listing_title}</td>
                        <td className="p-3 text-sm">{b.guest_name}</td>
                        <td className="p-3 text-sm text-muted-foreground">{b.corporate_name || '—'}</td>
                        <td className="p-3 text-sm text-muted-foreground">{formatDateOnly(b.check_in)} – {formatDateOnly(b.check_out)}</td>
                        <td className="p-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${bookingStatusColor(b.status)}`}>{b.status}</span>
                        </td>
                        <td className="p-3">
                          <Button variant="outline" size="sm" onClick={() => setSelectedBooking(b)}>View booking details</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'corporates' && (
        <div className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-semibold text-primary-800">Corporate accounts & admin-assisted bookings</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => { setEditingCorporate(null); setCorporateForm({ name: '', status: 'provisional', contact_name: '', contact_email: '', contact_phone: '', billing_method: '', approval_required: false, max_nightly_rate: null, notes: '' }); setCorporateFormOpen(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Add corporate
              </Button>
              <Button size="sm" className="bg-accent-500 hover:bg-accent-600" onClick={() => { setCreateBookingForm({ corporate_id: '', listing_id: '', guest_id: '', check_in: '', check_out: '', guests: '1', message: '' }); setCreateBookingOpen(true); }}>
                Create corporate booking
              </Button>
            </div>
          </div>
          <Card className="border-primary-200">
            <CardHeader className="border-b border-primary-100 bg-primary-50/50">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-accent-500" />
                  <h2 className="font-semibold text-primary-800">Corporates</h2>
                </div>
                <input
                  type="text"
                  placeholder="Search by name or email"
                  value={corporatesSearch}
                  onChange={(e) => setCorporatesSearch(e.target.value)}
                  className="rounded-md border border-primary-200 bg-background px-3 py-1.5 text-sm max-w-[200px]"
                />
                <select
                  value={corporatesStatus}
                  onChange={(e) => setCorporatesStatus(e.target.value)}
                  className="rounded-md border border-primary-200 bg-background px-3 py-1.5 text-sm"
                >
                  <option value="">All statuses</option>
                  <option value="active">Active</option>
                  <option value="provisional">Provisional</option>
                  <option value="pending_verification">Pending verification</option>
                </select>
              </div>
              <p className="text-sm text-muted-foreground">{corporatesTotal} corporate(s)</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                {corporates.length === 0 ? (
                  <p className="p-8 text-center text-muted-foreground">No corporates found. Add one to start recording corporate bookings.</p>
                ) : (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-primary-200 bg-primary-50/50">
                        <th className="p-3 text-left text-sm font-medium text-primary-800">Name</th>
                        <th className="p-3 text-left text-sm font-medium text-primary-800">Status</th>
                        <th className="p-3 text-left text-sm font-medium text-primary-800">Contact</th>
                        <th className="p-3 text-left text-sm font-medium text-primary-800">Billing</th>
                        <th className="p-3 text-left text-sm font-medium text-primary-800">Max rate</th>
                        <th className="p-3 text-left text-sm font-medium text-primary-800">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {corporates.map((c) => (
                        <tr key={c.id} className="border-b border-primary-100">
                          <td className="p-3 font-medium text-primary-800">{c.name}</td>
                          <td className="p-3"><span className="rounded-full px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800">{c.status}</span></td>
                          <td className="p-3 text-sm text-muted-foreground">{c.contact_name || '—'} {c.contact_email ? `(${c.contact_email})` : ''}</td>
                          <td className="p-3 text-sm text-muted-foreground">{c.billing_method || '—'}</td>
                          <td className="p-3 text-sm">{c.max_nightly_rate != null ? `NPR ${Number(c.max_nightly_rate).toLocaleString()}` : '—'}</td>
                          <td className="p-3">
                            <Button variant="outline" size="sm" onClick={() => { setEditingCorporate(c); setCorporateForm({ name: c.name, status: c.status, contact_name: c.contact_name ?? '', contact_email: c.contact_email ?? '', contact_phone: c.contact_phone ?? '', billing_method: c.billing_method ?? '', approval_required: c.approval_required, max_nightly_rate: c.max_nightly_rate, notes: c.notes ?? '' }); setCorporateFormOpen(true); }}>Edit</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Create/Edit Corporate dialog */}
          <Dialog.Root open={corporateFormOpen} onOpenChange={(open) => { setCorporateFormOpen(open); if (!open) setEditingCorporate(null); }}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-primary-200 bg-background p-6 shadow-lg">
                <Dialog.Title className="text-lg font-semibold text-primary-800">{editingCorporate ? 'Edit corporate' : 'Add corporate'}</Dialog.Title>
                <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); setCorporateFormSaving(true); const payload = { name: corporateForm.name!, status: (corporateForm.status as string) || 'provisional', contact_name: corporateForm.contact_name || undefined, contact_email: corporateForm.contact_email || undefined, contact_phone: corporateForm.contact_phone || undefined, billing_method: corporateForm.billing_method || undefined, approval_required: !!corporateForm.approval_required, max_nightly_rate: corporateForm.max_nightly_rate != null ? Number(corporateForm.max_nightly_rate) : undefined, notes: corporateForm.notes || undefined }; if (editingCorporate) { api.patch(`/api/admin/corporates/${editingCorporate.id}`, payload).then((res) => { toast({ title: 'Corporate updated.' }); setCorporateFormOpen(false); const updated = res.data.corporate as Corporate; setCorporates((prev) => prev.map((x) => x.id === editingCorporate.id ? updated : x)); }).catch(() => toast({ title: 'Failed to update.', variant: 'destructive' })).finally(() => setCorporateFormSaving(false)); } else { api.post('/api/admin/corporates', payload).then((res) => { toast({ title: 'Corporate created.' }); setCorporates((prev) => [res.data.corporate, ...prev]); setCorporatesTotal((t) => t + 1); setCorporateFormOpen(false); }).catch(() => toast({ title: 'Failed to create.', variant: 'destructive' })).finally(() => setCorporateFormSaving(false)); } }}>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Name *</label>
                    <input type="text" value={corporateForm.name ?? ''} onChange={(e) => setCorporateForm((f) => ({ ...f, name: e.target.value }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Status</label>
                    <select value={corporateForm.status ?? 'provisional'} onChange={(e) => setCorporateForm((f) => ({ ...f, status: e.target.value }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm">
                      <option value="active">Active</option>
                      <option value="provisional">Provisional</option>
                      <option value="pending_verification">Pending verification</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Contact name</label>
                    <input type="text" value={corporateForm.contact_name ?? ''} onChange={(e) => setCorporateForm((f) => ({ ...f, contact_name: e.target.value }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Contact email</label>
                    <input type="email" value={corporateForm.contact_email ?? ''} onChange={(e) => setCorporateForm((f) => ({ ...f, contact_email: e.target.value }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Contact phone</label>
                    <input type="text" value={corporateForm.contact_phone ?? ''} onChange={(e) => setCorporateForm((f) => ({ ...f, contact_phone: e.target.value }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Billing method</label>
                    <input type="text" placeholder="e.g. postpaid_monthly" value={corporateForm.billing_method ?? ''} onChange={(e) => setCorporateForm((f) => ({ ...f, billing_method: e.target.value }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="approval_required" checked={!!corporateForm.approval_required} onChange={(e) => setCorporateForm((f) => ({ ...f, approval_required: e.target.checked }))} className="rounded border-primary-300" />
                    <label htmlFor="approval_required" className="text-sm text-primary-700">Approval required</label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Max nightly rate (NPR)</label>
                    <input type="number" min={0} step={1} value={corporateForm.max_nightly_rate ?? ''} onChange={(e) => setCorporateForm((f) => ({ ...f, max_nightly_rate: e.target.value === '' ? null : Number(e.target.value) }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Notes</label>
                    <textarea value={corporateForm.notes ?? ''} onChange={(e) => setCorporateForm((f) => ({ ...f, notes: e.target.value }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" rows={2} />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setCorporateFormOpen(false)}>Cancel</Button>
                    <Button type="submit" className="bg-accent-500 hover:bg-accent-600" disabled={corporateFormSaving}>{corporateFormSaving ? 'Saving…' : editingCorporate ? 'Update' : 'Create'}</Button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          {/* Create corporate booking dialog */}
          <Dialog.Root open={createBookingOpen} onOpenChange={setCreateBookingOpen}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-primary-200 bg-background p-6 shadow-lg">
                <Dialog.Title className="text-lg font-semibold text-primary-800">Create corporate booking</Dialog.Title>
                <p className="mt-1 text-sm text-muted-foreground">Create an approved booking on behalf of a guest. Optionally link to a corporate.</p>
                <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); const listing_id = Number(createBookingForm.listing_id); const guest_id = Number(createBookingForm.guest_id); if (!listing_id || !guest_id || !createBookingForm.check_in || !createBookingForm.check_out) { toast({ title: 'Please select listing, guest, and dates.', variant: 'destructive' }); return; } const guests = Math.max(1, parseInt(createBookingForm.guests, 10) || 1); setCreateBookingSaving(true); api.post('/api/admin/bookings/corporate', { listing_id, guest_id, check_in: createBookingForm.check_in, check_out: createBookingForm.check_out, guests, message: createBookingForm.message || undefined, corporate_id: createBookingForm.corporate_id ? Number(createBookingForm.corporate_id) : null }).then(() => { toast({ title: 'Booking created (approved).' }); setCreateBookingOpen(false); const params = new URLSearchParams(); if (adminBookingsStatus) params.set('status', adminBookingsStatus); api.get<{ bookings: AdminBooking[]; total: number }>(`/api/admin/bookings?${params}`).then((r) => { setAdminBookings(r.data.bookings || []); setAdminBookingsTotal(r.data.total ?? 0); }).catch(() => {}); }).catch((err) => toast({ title: err.response?.data?.message || 'Failed to create booking.', variant: 'destructive' })).finally(() => setCreateBookingSaving(false)); }}>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Corporate (optional)</label>
                    <select value={createBookingForm.corporate_id} onChange={(e) => setCreateBookingForm((f) => ({ ...f, corporate_id: e.target.value }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm">
                      <option value="">— None —</option>
                      {corporates.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Listing *</label>
                    <select value={createBookingForm.listing_id} onChange={(e) => setCreateBookingForm((f) => ({ ...f, listing_id: e.target.value }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" required>
                      <option value="">Select listing</option>
                      {corporatesApprovedListings.map((l) => (
                        <option key={l.id} value={l.id}>{l.title} — {l.location}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Guest (user) *</label>
                    <select value={createBookingForm.guest_id} onChange={(e) => setCreateBookingForm((f) => ({ ...f, guest_id: e.target.value }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" required>
                      <option value="">Select guest</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-primary-700">Check-in *</label>
                      <input type="date" value={createBookingForm.check_in} onChange={(e) => setCreateBookingForm((f) => ({ ...f, check_in: e.target.value }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-700">Check-out *</label>
                      <input type="date" value={createBookingForm.check_out} onChange={(e) => setCreateBookingForm((f) => ({ ...f, check_out: e.target.value }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Number of guests</label>
                    <input type="number" min={1} value={createBookingForm.guests} onChange={(e) => setCreateBookingForm((f) => ({ ...f, guests: e.target.value }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Message (optional)</label>
                    <textarea value={createBookingForm.message} onChange={(e) => setCreateBookingForm((f) => ({ ...f, message: e.target.value }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" rows={2} />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setCreateBookingOpen(false)}>Cancel</Button>
                    <Button type="submit" className="bg-accent-500 hover:bg-accent-600" disabled={createBookingSaving}>{createBookingSaving ? 'Creating…' : 'Create booking'}</Button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      )}

      {tab === 'payments' && (
        <Card className="mt-6 border-primary-200">
          <CardHeader className="border-b border-primary-100 bg-primary-50/50">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-accent-500" />
              <h2 className="font-semibold text-primary-800">Payment management</h2>
            </div>
            <p className="text-sm text-muted-foreground">Track payments and reconciliation ({adminPaymentsTotal} total)</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {adminPayments.length === 0 ? (
                <p className="p-8 text-center text-muted-foreground">No payments yet.</p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-primary-200 bg-primary-50/50">
                      <th className="p-3 text-left text-sm font-medium text-primary-800">ID</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Booking</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Listing</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Guest</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Amount</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Status</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Date</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminPayments.map((p) => (
                      <tr key={p.id} className="border-b border-primary-100">
                        <td className="p-3 text-sm">{p.id}</td>
                        <td className="p-3 text-sm">{p.booking_id}</td>
                        <td className="p-3 font-medium text-primary-800">{p.listing_title}</td>
                        <td className="p-3 text-sm">{p.guest_name}</td>
                        <td className="p-3 font-medium text-accent-600">NPR {Number(p.amount).toLocaleString()}</td>
                        <td className="p-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${p.status === 'succeeded' ? 'bg-green-100 text-green-800' : 'bg-secondary-200 text-secondary-800'}`}>{p.status}</span>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">{formatDateOnly(p.created_at)}</td>
                        <td className="p-3">
                          <Button variant="outline" size="sm" onClick={() => setSelectedPayment(p)}>View transaction receipt</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'reports' && (
        <Card className="mt-6 border-primary-200">
          <CardHeader className="border-b border-primary-100 bg-primary-50/50">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-accent-500" />
              <h2 className="font-semibold text-primary-800">Reports & analytics</h2>
            </div>
            <p className="text-sm text-muted-foreground">Booking and payment details</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {adminBookings.length === 0 ? (
                <p className="p-8 text-center text-muted-foreground">No booking records. Switch to Bookings tab to load data, or data will load when you open Reports.</p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-primary-200 bg-primary-50/50">
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Booking ID</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Listing</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Guest</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Check-in</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Check-out</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Guests</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Status</th>
                      <th className="p-3 text-left text-sm font-medium text-primary-800">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminBookings.map((b) => (
                      <tr key={b.id} className="border-b border-primary-100">
                        <td className="p-3 text-sm font-medium text-primary-800">{b.id}</td>
                        <td className="p-3 text-sm">{b.listing_title}</td>
                        <td className="p-3 text-sm">{b.guest_name}</td>
                        <td className="p-3 text-sm text-muted-foreground">{formatDateOnly(b.check_in)}</td>
                        <td className="p-3 text-sm text-muted-foreground">{formatDateOnly(b.check_out)}</td>
                        <td className="p-3 text-sm">{b.guests}</td>
                        <td className="p-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${bookingStatusColor(b.status)}`}>{b.status}</span>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">{formatDateOnly(b.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <p className="p-4 text-sm text-muted-foreground border-t border-primary-100">Payment amounts and transaction receipts are in the Payments tab.</p>
          </CardContent>
        </Card>
      )}

      {tab === 'content' && (
        <div className="mt-6 space-y-6">
          <Card className="border-primary-200">
            <CardHeader className="border-b border-primary-100 bg-primary-50/50">
              <div className="flex items-center gap-2">
                <Youtube className="h-5 w-5 text-accent-500" />
                <h2 className="font-semibold text-primary-800">Landing page video</h2>
              </div>
              <p className="text-sm text-muted-foreground">YouTube video URL shown on the homepage. Leave empty to hide the video section.</p>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSaveLandingYoutube} className="space-y-4 max-w-xl">
                <div>
                  <label htmlFor="landing-youtube" className="block text-sm font-medium text-primary-800">YouTube video URL</label>
                  <input
                    id="landing-youtube"
                    type="url"
                    value={landingYoutubeUrl}
                    onChange={(e) => setLandingYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm"
                  />
                </div>
                <Button type="submit" size="sm" className="bg-accent-500 hover:bg-accent-600" disabled={landingYoutubeSaving}>
                  {landingYoutubeSaving ? 'Saving…' : 'Save'}
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card className="border-primary-200">
            <CardHeader className="border-b border-primary-100 bg-primary-50/50">
              <div className="flex items-center gap-2">
                <Youtube className="h-5 w-5 text-accent-500" />
                <h2 className="font-semibold text-primary-800">YouTube video gallery (Video Stories)</h2>
              </div>
              <p className="text-sm text-muted-foreground">Video URLs shown on the homepage &quot;Video Stories&quot; section and on the View all videos page. Add YouTube watch URLs (e.g. https://www.youtube.com/watch?v=...). Optional title per video.</p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <form onSubmit={handleAddYoutubeVideo} className="flex flex-wrap items-end gap-3">
                <div className="min-w-[200px] flex-1">
                  <label htmlFor="new-video-url" className="block text-sm font-medium text-primary-800">Video URL</label>
                  <input
                    id="new-video-url"
                    type="url"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="min-w-[160px] flex-1">
                  <label htmlFor="new-video-title" className="block text-sm font-medium text-primary-800">Title (optional)</label>
                  <input
                    id="new-video-title"
                    type="text"
                    value={newVideoTitle}
                    onChange={(e) => setNewVideoTitle(e.target.value)}
                    placeholder="Video title"
                    className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm"
                  />
                </div>
                <Button type="submit" size="sm" variant="outline">Add</Button>
              </form>
              {youtubeVideoUrls.length > 0 && (
                <ul className="space-y-2">
                  {youtubeVideoUrls.map((v, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 rounded-md border border-primary-100 bg-primary-50/50 px-3 py-2 text-sm">
                      <span className="truncate flex-1" title={v.url}>{v.title || v.url}</span>
                      <Button type="button" variant="ghost" size="sm" className="shrink-0 text-destructive hover:text-destructive" onClick={() => handleRemoveYoutubeVideo(i)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <form onSubmit={handleSaveYoutubeVideoUrls}>
                <Button type="submit" size="sm" className="bg-accent-500 hover:bg-accent-600" disabled={youtubeVideoUrlsSaving}>
                  {youtubeVideoUrlsSaving ? 'Saving…' : 'Save video gallery'}
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card className="border-primary-200">
            <CardHeader className="border-b border-primary-100 bg-primary-50/50">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent-500" />
                <h2 className="font-semibold text-primary-800">CMS sections</h2>
              </div>
              <p className="text-sm text-muted-foreground">Edit About Us, Privacy Policy, Terms, FAQs, Help Center, Safety, Cancellation, Address, Contact, and other footer/page content. Set display place (e.g. footer, page) and sort order.</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-end gap-3 mb-4">
                <div className="min-w-[180px]">
                  <label className="block text-sm font-medium text-primary-800 mb-1">New section key (e.g. careers, press)</label>
                  <input
                    type="text"
                    value={newCmsSectionKey}
                    onChange={(e) => setNewCmsSectionKey(e.target.value.replace(/\s/g, '_').toLowerCase())}
                    placeholder="section_key"
                    className="w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm"
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!newCmsSectionKey.trim()) return;
                    setCmsSectionForm({ section_key: newCmsSectionKey.trim(), title: '', content: '', display_place: 'footer', sort_order: cmsSections.length });
                    setEditingCmsSection(null);
                    setNewCmsSectionKey('');
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add section
                </Button>
              </div>
              {cmsSectionsLoading ? (
                <p className="p-6 text-center text-muted-foreground">Loading sections…</p>
              ) : cmsSections.length === 0 ? (
                <p className="p-6 text-center text-muted-foreground">No CMS sections yet. Add one above or they may be seeded in the database.</p>
              ) : (
                <ul className="space-y-2">
                  {cmsSections.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2 rounded-md border border-primary-100 bg-primary-50/50 px-3 py-2 text-sm">
                      <span className="font-medium text-primary-800">{s.section_key}</span>
                      <span className="text-muted-foreground">{s.display_place} · order {s.sort_order}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingCmsSection(s);
                          setCmsSectionForm({
                            section_key: s.section_key,
                            title: s.title ?? '',
                            content: s.content ?? '',
                            display_place: s.display_place,
                            sort_order: s.sort_order,
                          });
                        }}
                      >
                        Edit
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* CMS section edit / add dialog */}
          {(editingCmsSection || cmsSectionForm.section_key) && (
            <Dialog.Root
              open={!!(editingCmsSection || cmsSectionForm.section_key)}
              onOpenChange={(open) => {
                if (!open) {
                  setEditingCmsSection(null);
                  setCmsSectionForm({ section_key: '', title: '', content: '', display_place: 'footer', sort_order: 0 });
                }
              }}
            >
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-lg border border-primary-200 bg-background p-6 shadow-lg">
                  <Dialog.Title className="text-lg font-semibold text-primary-800">
                    {editingCmsSection ? `Edit: ${editingCmsSection.section_key}` : `New section: ${cmsSectionForm.section_key}`}
                  </Dialog.Title>
                  <form
                    className="mt-4 space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setCmsSectionSaving(true);
                      const payload = {
                        section_key: cmsSectionForm.section_key,
                        title: cmsSectionForm.title || null,
                        content: cmsSectionForm.content || null,
                        display_place: cmsSectionForm.display_place,
                        sort_order: cmsSectionForm.sort_order,
                      };
                      if (editingCmsSection) {
                        api
                          .patch(`/api/admin/cms/sections/${editingCmsSection.id}`, payload)
                          .then((res) => {
                            const updated = res.data.section as CmsSection;
                            setCmsSections((prev) => prev.map((x) => (x.id === editingCmsSection.id ? updated : x)));
                            toast({ title: 'Section updated.' });
                            setEditingCmsSection(null);
                            setCmsSectionForm({ section_key: '', title: '', content: '', display_place: 'footer', sort_order: 0 });
                          })
                          .catch(() => toast({ title: 'Failed to update.', variant: 'destructive' }))
                          .finally(() => setCmsSectionSaving(false));
                      } else {
                        api
                          .post('/api/admin/cms/sections', payload)
                          .then((res) => {
                            const created = res.data.section as CmsSection;
                            setCmsSections((prev) => [...prev, created].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id));
                            toast({ title: 'Section created.' });
                            setCmsSectionForm({ section_key: '', title: '', content: '', display_place: 'footer', sort_order: 0 });
                          })
                          .catch(() => toast({ title: 'Failed to create.', variant: 'destructive' }))
                          .finally(() => setCmsSectionSaving(false));
                      }
                    }}
                  >
                    <div>
                      <label className="block text-sm font-medium text-primary-800">Section key</label>
                      <input
                        type="text"
                        value={cmsSectionForm.section_key}
                        onChange={(e) => setCmsSectionForm((f) => ({ ...f, section_key: e.target.value.replace(/\s/g, '_') }))}
                        className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm"
                        readOnly={!!editingCmsSection}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-800">Title</label>
                      <input
                        type="text"
                        value={cmsSectionForm.title}
                        onChange={(e) => setCmsSectionForm((f) => ({ ...f, title: e.target.value }))}
                        className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm"
                        placeholder="Section title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-800">Content (plain text or markdown)</label>
                      <textarea
                        value={cmsSectionForm.content}
                        onChange={(e) => setCmsSectionForm((f) => ({ ...f, content: e.target.value }))}
                        className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm min-h-[120px]"
                        placeholder="Body content"
                        rows={6}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-primary-800">Display place</label>
                        <select
                          value={cmsSectionForm.display_place}
                          onChange={(e) => setCmsSectionForm((f) => ({ ...f, display_place: e.target.value }))}
                          className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm"
                        >
                          <option value="footer">footer</option>
                          <option value="page">page</option>
                          <option value="home">home</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-primary-800">Sort order</label>
                        <input
                          type="number"
                          min={0}
                          value={cmsSectionForm.sort_order}
                          onChange={(e) => setCmsSectionForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))}
                          className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingCmsSection(null);
                          setCmsSectionForm({ section_key: '', title: '', content: '', display_place: 'footer', sort_order: 0 });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-accent-500 hover:bg-accent-600" disabled={cmsSectionSaving}>
                        {cmsSectionSaving ? 'Saving…' : editingCmsSection ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </form>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          )}
        </div>
      )}

      {tab === 'settings' && (
        <div className="mt-6 space-y-6">
          <Card className="border-primary-200">
            <CardHeader className="border-b border-primary-100 bg-primary-50/50">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-accent-500" />
                <h2 className="font-semibold text-primary-800">Booking fee (service charge or discount)</h2>
              </div>
              <p className="text-sm text-muted-foreground">Add a service charge (e.g. 5%) or discount (e.g. 10% or fixed amount) applied to all bookings. Leave value empty to have no fee.</p>
            </CardHeader>
            <CardContent className="p-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const value = bookingFeeForm.value.trim();
                  setBookingFeeSaving(true);
                  const payload = value === '' || isNaN(Number(value)) || Number(value) < 0
                    ? null
                    : {
                        type: bookingFeeForm.type,
                        kind: bookingFeeForm.kind,
                        value: Number(value),
                        applies_to: bookingFeeForm.type === 'service_charge' ? bookingFeeForm.applies_to : undefined,
                      };
                  api.patch('/api/admin/settings', { booking_fee: payload })
                    .then((res) => {
                      const bf = res.data.booking_fee ?? null;
                      setBookingFee(bf);
                      setBookingFeeForm(bf ? { type: bf.type, kind: bf.kind, value: String(bf.value), applies_to: bf.applies_to ?? 'guest' } : { type: 'service_charge', kind: 'percent', value: '', applies_to: 'guest' });
                      toast({ title: 'Booking fee saved.' });
                    })
                    .catch(() => toast({ title: 'Failed to save.', variant: 'destructive' }))
                    .finally(() => setBookingFeeSaving(false));
                }}
                className="max-w-md space-y-4"
              >
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary-800">Type</label>
                  <select
                    value={bookingFeeForm.type}
                    onChange={(e) => setBookingFeeForm((f) => ({ ...f, type: e.target.value as 'service_charge' | 'discount' }))}
                    className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
                  >
                    <option value="service_charge">Service charge (platform fee)</option>
                    <option value="discount">Discount (guest only)</option>
                  </select>
                </div>
                {bookingFeeForm.type === 'service_charge' && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-primary-800">Apply to</label>
                    <select
                      value={bookingFeeForm.applies_to}
                      onChange={(e) => setBookingFeeForm((f) => ({ ...f, applies_to: e.target.value as 'guest' | 'host' }))}
                      className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
                    >
                      <option value="guest">Guest (charge added to booking total)</option>
                      <option value="host">Host (deduct from host payout)</option>
                    </select>
                    <p className="mt-1 text-xs text-muted-foreground">
                      When &quot;Host&quot;, the guest pays only the listing subtotal; the service charge is deducted from the host&apos;s earnings.
                    </p>
                  </div>
                )}
                {bookingFeeForm.type === 'discount' && (
                  <p className="text-xs text-muted-foreground">Discount is always applied to the guest (reduces the booking total).</p>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary-800">Kind</label>
                  <select
                    value={bookingFeeForm.kind}
                    onChange={(e) => setBookingFeeForm((f) => ({ ...f, kind: e.target.value as 'percent' | 'fixed' }))}
                    className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
                  >
                    <option value="percent">Percent (%)</option>
                    <option value="fixed">Fixed amount (NPR)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary-800">Value</label>
                  <input
                    type={bookingFeeForm.kind === 'percent' ? 'number' : 'number'}
                    min={0}
                    step={bookingFeeForm.kind === 'percent' ? 0.5 : 1}
                    value={bookingFeeForm.value}
                    onChange={(e) => setBookingFeeForm((f) => ({ ...f, value: e.target.value }))}
                    placeholder={bookingFeeForm.kind === 'percent' ? 'e.g. 5' : 'e.g. 50'}
                    className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {bookingFeeForm.kind === 'percent' ? 'Percentage of subtotal (e.g. 5 for 5%).' : 'Fixed amount in NPR.'} Leave empty for no fee.
                  </p>
                </div>
                <Button type="submit" disabled={bookingFeeSaving} className="bg-accent-500 hover:bg-accent-600">
                  {bookingFeeSaving ? 'Saving…' : 'Save booking fee'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Home placements (hero carousel + featured section) */}
          {homePlacements && (
            <Card className="border-primary-200">
              <CardHeader className="border-b border-primary-100 bg-primary-50/50">
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-accent-500" />
                  <h2 className="font-semibold text-primary-800">Home placements (Hero &amp; Featured)</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Choose which homestays appear on the homepage hero carousel (max 5) and in the featured section. Set prices for these placements; hosts will be able to purchase them in a later phase.
                </p>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <h3 className="font-medium text-primary-800 mb-2">Hero carousel</h3>
                    <div className="space-y-2">
                      <label className="block text-sm text-muted-foreground">Price (NPR) for this placement</label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={homePlacements.hero_carousel_price || ''}
                        onChange={(e) => setHomePlacements((p) => p ? { ...p, hero_carousel_price: Number(e.target.value) || 0 } : p)}
                        placeholder="0"
                        className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
                      />
                      <label className="block text-sm text-muted-foreground mt-3">Listings (max 5, order = slide order)</label>
                      <div className="max-h-48 overflow-y-auto rounded border border-primary-200 bg-muted/30 p-2 space-y-1">
                        {settingsApprovedListings.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No approved listings. Approve some under the Listings tab first.</p>
                        ) : (
                          settingsApprovedListings.map((listing) => {
                            const selected = homePlacements.hero_carousel_listing_ids.includes(listing.id);
                            const atMax = homePlacements.hero_carousel_listing_ids.length >= 5 && !selected;
                            return (
                              <label key={listing.id} className={`flex items-center gap-2 text-sm ${atMax ? 'opacity-60' : ''}`}>
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  disabled={atMax}
                                  onChange={(e) => {
                                    if (!e.target.checked) {
                                      setHomePlacements((p) => p ? { ...p, hero_carousel_listing_ids: p.hero_carousel_listing_ids.filter((id) => id !== listing.id) } : p);
                                    } else if (homePlacements.hero_carousel_listing_ids.length < 5) {
                                      setHomePlacements((p) => p ? { ...p, hero_carousel_listing_ids: [...p.hero_carousel_listing_ids, listing.id].slice(0, 5) } : p);
                                    }
                                  }}
                                  className="rounded border-primary-300"
                                />
                                <span className="truncate">{listing.title}</span>
                                <span className="text-muted-foreground text-xs shrink-0">({listing.location})</span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-primary-800 mb-2">Featured section</h3>
                    <div className="space-y-2">
                      <label className="block text-sm text-muted-foreground">Price (NPR) for this placement</label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={homePlacements.featured_placement_price || ''}
                        onChange={(e) => setHomePlacements((p) => p ? { ...p, featured_placement_price: Number(e.target.value) || 0 } : p)}
                        placeholder="0"
                        className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
                      />
                      <label className="block text-sm text-muted-foreground mt-3">Listings</label>
                      <div className="max-h-48 overflow-y-auto rounded border border-primary-200 bg-muted/30 p-2 space-y-1">
                        {settingsApprovedListings.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No approved listings.</p>
                        ) : (
                          settingsApprovedListings.map((listing) => (
                            <label key={listing.id} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={homePlacements.featured_listing_ids.includes(listing.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setHomePlacements((p) => p ? { ...p, featured_listing_ids: [...p.featured_listing_ids, listing.id] } : p);
                                  } else {
                                    setHomePlacements((p) => p ? { ...p, featured_listing_ids: p.featured_listing_ids.filter((id) => id !== listing.id) } : p);
                                  }
                                }}
                                className="rounded border-primary-300"
                              />
                              <span className="truncate">{listing.title}</span>
                              <span className="text-muted-foreground text-xs shrink-0">({listing.location})</span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  disabled={homePlacementsSaving}
                  onClick={() => {
                    setHomePlacementsSaving(true);
                    api.patch('/api/admin/settings', { home_placements: homePlacements })
                      .then((res) => {
                        const next = res.data?.home_placements ?? homePlacements;
                        setHomePlacements(next);
                        toast({ title: 'Home placements saved.' });
                      })
                      .catch(() => toast({ title: 'Failed to save home placements.', variant: 'destructive' }))
                      .finally(() => setHomePlacementsSaving(false));
                  }}
                  className="bg-accent-500 hover:bg-accent-600"
                >
                  {homePlacementsSaving ? 'Saving…' : 'Save home placements'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Listing display (homestay detail page text) */}
          {listingDisplayForm && (
            <Card className="border-primary-200">
              <CardHeader className="border-b border-primary-100 bg-primary-50/50">
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-accent-500" />
                  <h2 className="font-semibold text-primary-800">Listing display (homestay detail page)</h2>
                </div>
                <p className="text-sm text-muted-foreground">Labels, highlights, trust badges and empty-state text shown on the homestay detail page and booking card.</p>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                <div>
                  <h3 className="font-medium text-primary-800 mb-3">Badge labels</h3>
                  <p className="text-xs text-muted-foreground mb-2">Display names for recommended / featured / new badges on listing cards and detail page.</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {(['recommended', 'featured', 'new'] as const).map((key) => (
                      <div key={key}>
                        <label className="mb-1 block text-xs text-muted-foreground capitalize">{key}</label>
                        <input
                          type="text"
                          value={listingDisplayForm.badge_labels[key] ?? ''}
                          onChange={(e) => setListingDisplayForm((f) => f ? { ...f, badge_labels: { ...f.badge_labels, [key]: e.target.value } } : f)}
                          className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-primary-800 mb-3">Section labels (optional)</h3>
                  <p className="text-xs text-muted-foreground mb-2">Labels for custom listing sections (e.g. owners_story, faqs). Edit as JSON object.</p>
                  <textarea
                    value={sectionLabelsJson}
                    onChange={(e) => setSectionLabelsJson(e.target.value)}
                    onBlur={() => {
                      try {
                        const parsed = JSON.parse(sectionLabelsJson) as Record<string, string>;
                        if (parsed && typeof parsed === 'object') setListingDisplayForm((f) => f ? { ...f, section_labels: parsed } : f);
                      } catch {
                        /* keep previous on invalid */
                      }
                    }}
                    rows={8}
                    className="flex w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <h3 className="font-medium text-primary-800 mb-3">Highlights (listing page)</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Free cancellation title</label>
                      <input
                        type="text"
                        value={listingDisplayForm.highlights.free_cancellation_title}
                        onChange={(e) => setListingDisplayForm((f) => f ? { ...f, highlights: { ...f.highlights, free_cancellation_title: e.target.value } } : f)}
                        className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Free cancellation description</label>
                      <textarea
                        value={listingDisplayForm.highlights.free_cancellation_description}
                        onChange={(e) => setListingDisplayForm((f) => f ? { ...f, highlights: { ...f.highlights, free_cancellation_description: e.target.value } } : f)}
                        rows={2}
                        className="flex w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Great communication title</label>
                      <input
                        type="text"
                        value={listingDisplayForm.highlights.great_communication_title}
                        onChange={(e) => setListingDisplayForm((f) => f ? { ...f, highlights: { ...f.highlights, great_communication_title: e.target.value } } : f)}
                        className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Great communication description</label>
                      <textarea
                        value={listingDisplayForm.highlights.great_communication_description}
                        onChange={(e) => setListingDisplayForm((f) => f ? { ...f, highlights: { ...f.highlights, great_communication_description: e.target.value } } : f)}
                        rows={2}
                        className="flex w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Superhost title (use {'{hostName}'} for name)</label>
                      <input
                        type="text"
                        value={listingDisplayForm.highlights.superhost_title}
                        onChange={(e) => setListingDisplayForm((f) => f ? { ...f, highlights: { ...f.highlights, superhost_title: e.target.value } } : f)}
                        className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Superhost description</label>
                      <textarea
                        value={listingDisplayForm.highlights.superhost_description}
                        onChange={(e) => setListingDisplayForm((f) => f ? { ...f, highlights: { ...f.highlights, superhost_description: e.target.value } } : f)}
                        rows={2}
                        className="flex w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-primary-800 mb-3">Trust badges (booking card)</h3>
                  <ul className="space-y-2 mb-2">
                    {listingDisplayForm.trust_badges.map((line, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="flex-1 rounded-md border border-primary-100 bg-primary-50/50 px-3 py-1.5 text-sm">{line}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setListingDisplayForm((f) => (f ? { ...f, trust_badges: f.trust_badges.filter((_, j) => j !== i) } : f));
                          }}
                          className="rounded p-1 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                          aria-label="Remove"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTrustBadge}
                      onChange={(e) => setNewTrustBadge(e.target.value)}
                      placeholder="New trust badge line"
                      className="flex flex-1 h-9 rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const t = newTrustBadge.trim();
                        if (t) {
                          setListingDisplayForm((f) => f ? { ...f, trust_badges: [...f.trust_badges, t] } : f);
                          setNewTrustBadge('');
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-primary-800 mb-3">Empty-state fallbacks</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">No description text</label>
                      <input
                        type="text"
                        value={listingDisplayForm.empty_fallbacks.no_description}
                        onChange={(e) => setListingDisplayForm((f) => f ? { ...f, empty_fallbacks: { ...f.empty_fallbacks, no_description: e.target.value } } : f)}
                        className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Default host name</label>
                      <input
                        type="text"
                        value={listingDisplayForm.empty_fallbacks.default_host_name}
                        onChange={(e) => setListingDisplayForm((f) => f ? { ...f, empty_fallbacks: { ...f.empty_fallbacks, default_host_name: e.target.value } } : f)}
                        className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">No directions text</label>
                      <input
                        type="text"
                        value={listingDisplayForm.empty_fallbacks.no_directions}
                        onChange={(e) => setListingDisplayForm((f) => f ? { ...f, empty_fallbacks: { ...f.empty_fallbacks, no_directions: e.target.value } } : f)}
                        className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
                      />
                    </div>
                  </div>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!listingDisplayForm) return;
                    let payload = { ...listingDisplayForm };
                    try {
                      const parsed = JSON.parse(sectionLabelsJson) as Record<string, string>;
                      if (parsed && typeof parsed === 'object') payload = { ...payload, section_labels: parsed };
                    } catch {
                      toast({ title: 'Invalid section labels JSON.', variant: 'destructive' });
                      return;
                    }
                    setListingDisplaySaving(true);
                    api.patch('/api/admin/settings', { listing_display: payload })
                      .then((res) => {
                        const updated = res.data.listing_display ?? listingDisplayForm;
                        setListingDisplay(updated);
                        setListingDisplayForm(updated ? JSON.parse(JSON.stringify(updated)) : listingDisplayForm);
                        if (updated?.section_labels) setSectionLabelsJson(JSON.stringify(updated.section_labels, null, 2));
                        toast({ title: 'Listing display settings saved.' });
                      })
                      .catch(() => toast({ title: 'Failed to save.', variant: 'destructive' }))
                      .finally(() => setListingDisplaySaving(false));
                  }}
                >
                  <Button type="submit" disabled={listingDisplaySaving} className="bg-accent-500 hover:bg-accent-600">
                    {listingDisplaySaving ? 'Saving…' : 'Save listing display'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Sparrow SMS */}
          <Card className="border-primary-200">
            <CardHeader className="border-b border-primary-100 bg-primary-50/50">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-accent-500" />
                <h2 className="font-semibold text-primary-800">Sparrow SMS</h2>
              </div>
              <p className="text-sm text-muted-foreground">Configure Sparrow SMS (Nepal) for sending SMS. Get token and sender ID from <a href="https://docs.sparrowsms.com/sms/documentation/" target="_blank" rel="noreferrer" className="text-accent-600 underline">Sparrow SMS</a>. Leave empty to disable SMS.</p>
            </CardHeader>
            <CardContent className="p-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSparrowSmsSaving(true);
                  api.patch('/api/admin/settings', { sparrow_sms: sparrowSms })
                    .then((res) => {
                      setSparrowSms(res.data.sparrow_sms ?? { token: '', from: '' });
                      toast({ title: 'SMS settings saved.' });
                    })
                    .catch(() => toast({ title: 'Failed to save.', variant: 'destructive' }))
                    .finally(() => setSparrowSmsSaving(false));
                }}
                className="max-w-md space-y-4"
              >
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary-800">Token</label>
                  <PasswordInput
                    autoComplete="off"
                    value={sparrowSms.token}
                    onChange={(e) => setSparrowSms((s) => ({ ...s, token: e.target.value }))}
                    placeholder="Sparrow SMS API token"
                    className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary-800">From (sender ID)</label>
                  <input
                    type="text"
                    value={sparrowSms.from}
                    onChange={(e) => setSparrowSms((s) => ({ ...s, from: e.target.value }))}
                    placeholder="e.g. Homestay"
                    className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
                  />
                </div>
                <Button type="submit" disabled={sparrowSmsSaving} className="bg-accent-500 hover:bg-accent-600">
                  {sparrowSmsSaving ? 'Saving…' : 'Save SMS settings'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Notification delivery (email vs SMS, who receives) */}
          {notificationSettings && (
            <Card className="border-primary-200">
              <CardHeader className="border-b border-primary-100 bg-primary-50/50">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-accent-500" />
                  <h2 className="font-semibold text-primary-800">Notification delivery</h2>
                </div>
                <p className="text-sm text-muted-foreground">Choose whether to send each notification by email and/or SMS, and to whom (host or guest).</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-primary-800 mb-2">OTP (login / signup / password reset)</h3>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={notificationSettings.otp.email} onChange={(e) => setNotificationSettings((s) => s ? { ...s, otp: { ...s.otp, email: e.target.checked } } : s)} />
                        <span className="text-sm">Email</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={notificationSettings.otp.sms} onChange={(e) => setNotificationSettings((s) => s ? { ...s, otp: { ...s.otp, sms: e.target.checked } } : s)} />
                        <span className="text-sm">SMS</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-primary-800 mb-2">Listing submitted (to host)</h3>
                    <p className="text-xs text-muted-foreground mb-1">When a new listing is created (optional).</p>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={notificationSettings.listing_submitted.host_email} onChange={(e) => setNotificationSettings((s) => s ? { ...s, listing_submitted: { ...s.listing_submitted, host_email: e.target.checked } } : s)} />
                        <span className="text-sm">Email</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={notificationSettings.listing_submitted.host_sms} onChange={(e) => setNotificationSettings((s) => s ? { ...s, listing_submitted: { ...s.listing_submitted, host_sms: e.target.checked } } : s)} />
                        <span className="text-sm">SMS</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-primary-800 mb-2">Listing approved (to host)</h3>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={notificationSettings.listing_approved.host_email} onChange={(e) => setNotificationSettings((s) => s ? { ...s, listing_approved: { ...s.listing_approved, host_email: e.target.checked } } : s)} />
                        <span className="text-sm">Email</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={notificationSettings.listing_approved.host_sms} onChange={(e) => setNotificationSettings((s) => s ? { ...s, listing_approved: { ...s.listing_approved, host_sms: e.target.checked } } : s)} />
                        <span className="text-sm">SMS</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-primary-800 mb-2">Listing rejected (to host)</h3>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={notificationSettings.listing_rejected.host_email} onChange={(e) => setNotificationSettings((s) => s ? { ...s, listing_rejected: { ...s.listing_rejected, host_email: e.target.checked } } : s)} />
                        <span className="text-sm">Email</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={notificationSettings.listing_rejected.host_sms} onChange={(e) => setNotificationSettings((s) => s ? { ...s, listing_rejected: { ...s.listing_rejected, host_sms: e.target.checked } } : s)} />
                        <span className="text-sm">SMS</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-primary-800 mb-2">Booking created / new inquiry (to host)</h3>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={notificationSettings.booking_created.host_email} onChange={(e) => setNotificationSettings((s) => s ? { ...s, booking_created: { ...s.booking_created, host_email: e.target.checked } } : s)} />
                        <span className="text-sm">Email</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={notificationSettings.booking_created.host_sms} onChange={(e) => setNotificationSettings((s) => s ? { ...s, booking_created: { ...s.booking_created, host_sms: e.target.checked } } : s)} />
                        <span className="text-sm">SMS</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-primary-800 mb-2">Booking approved (to guest)</h3>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={notificationSettings.booking_approved.guest_email} onChange={(e) => setNotificationSettings((s) => s ? { ...s, booking_approved: { ...s.booking_approved, guest_email: e.target.checked } } : s)} />
                        <span className="text-sm">Email</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={notificationSettings.booking_approved.guest_sms} onChange={(e) => setNotificationSettings((s) => s ? { ...s, booking_approved: { ...s.booking_approved, guest_sms: e.target.checked } } : s)} />
                        <span className="text-sm">SMS</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-primary-800 mb-2">Booking declined (to guest)</h3>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={notificationSettings.booking_declined.guest_email} onChange={(e) => setNotificationSettings((s) => s ? { ...s, booking_declined: { ...s.booking_declined, guest_email: e.target.checked } } : s)} />
                        <span className="text-sm">Email</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={notificationSettings.booking_declined.guest_sms} onChange={(e) => setNotificationSettings((s) => s ? { ...s, booking_declined: { ...s.booking_declined, guest_sms: e.target.checked } } : s)} />
                        <span className="text-sm">SMS</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-primary-800 mb-2">Payment succeeded</h3>
                    <p className="text-xs text-muted-foreground mb-2">Guest and host can each receive email and/or SMS.</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <span className="text-sm font-medium text-primary-700">Guest</span>
                        <div className="flex flex-wrap gap-4 mt-1">
                          <label className="flex items-center gap-2">
                            <input type="checkbox" checked={notificationSettings.payment_succeeded.guest_email} onChange={(e) => setNotificationSettings((s) => s ? { ...s, payment_succeeded: { ...s.payment_succeeded, guest_email: e.target.checked } } : s)} />
                            <span className="text-sm">Email</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="checkbox" checked={notificationSettings.payment_succeeded.guest_sms} onChange={(e) => setNotificationSettings((s) => s ? { ...s, payment_succeeded: { ...s.payment_succeeded, guest_sms: e.target.checked } } : s)} />
                            <span className="text-sm">SMS</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-primary-700">Host</span>
                        <div className="flex flex-wrap gap-4 mt-1">
                          <label className="flex items-center gap-2">
                            <input type="checkbox" checked={notificationSettings.payment_succeeded.host_email} onChange={(e) => setNotificationSettings((s) => s ? { ...s, payment_succeeded: { ...s.payment_succeeded, host_email: e.target.checked } } : s)} />
                            <span className="text-sm">Email</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="checkbox" checked={notificationSettings.payment_succeeded.host_sms} onChange={(e) => setNotificationSettings((s) => s ? { ...s, payment_succeeded: { ...s.payment_succeeded, host_sms: e.target.checked } } : s)} />
                            <span className="text-sm">SMS</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <Button
                    type="button"
                    disabled={notificationSettingsSaving}
                    className="bg-accent-500 hover:bg-accent-600"
                    onClick={() => {
                      setNotificationSettingsSaving(true);
                      api.patch('/api/admin/settings', { notification_settings: notificationSettings })
                        .then((res) => {
                          setNotificationSettings(res.data.notification_settings ?? notificationSettings);
                          toast({ title: 'Notification settings saved.' });
                        })
                        .catch(() => toast({ title: 'Failed to save.', variant: 'destructive' }))
                        .finally(() => setNotificationSettingsSaving(false));
                    }}
                  >
                    {notificationSettingsSaving ? 'Saving…' : 'Save notification settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {tab === 'logs' && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">From</span>
              <input type="date" value={logDateFrom} onChange={(e) => setLogDateFrom(e.target.value)} className="rounded border border-primary-200 px-2 py-1 text-sm" />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">To</span>
              <input type="date" value={logDateTo} onChange={(e) => setLogDateTo(e.target.value)} className="rounded border border-primary-200 px-2 py-1 text-sm" />
            </label>
          </div>
          <div className="flex flex-wrap gap-2 border-b border-primary-200 pb-2">
            {LOGS_SUBTABS.map((st) => (
              <button
                key={st}
                type="button"
                className={`rounded px-3 py-1.5 text-sm font-medium capitalize ${logsSubTab === st ? 'bg-accent-500 text-white' : 'bg-primary-100 text-primary-800 hover:bg-primary-200'}`}
                onClick={() => { setLogsSubTab(st); setLogPage(1); setSelectedEmailSmsId(null); setSelectedJourneySessionId(null); setSelectedApiLog(null); setSelectedErrorLog(null); setSelectedHeatmapPath(null); }}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {logsSubTab === 'email_sms' && (
            <Card className="border-primary-200">
              <CardHeader className="border-b border-primary-100 bg-primary-50/50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-accent-500" />
                    <h2 className="font-semibold text-primary-800">Email & SMS log</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Channel</span>
                    <select value={logChannel} onChange={(e) => { setLogChannel(e.target.value); setLogPage(1); }} className="rounded border border-primary-200 px-2 py-1 text-sm">
                      <option value="">All</option>
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                    </select>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Total: {emailSmsLogTotal} — Click a row for full details</p>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-primary-200 bg-primary-50/50"><th className="text-left p-2">Time</th><th className="text-left p-2">Channel</th><th className="text-left p-2">Recipient</th><th className="text-left p-2">Event</th><th className="text-left p-2">Status</th><th className="text-left p-2">Response</th></tr></thead>
                  <tbody>
                    {emailSmsLogRows.map((r) => (
                      <tr key={r.id} className="border-b border-primary-100 cursor-pointer hover:bg-primary-50/80" onClick={() => setSelectedEmailSmsId(r.id)}>
                        <td className="p-2 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                        <td className="p-2">{r.channel}</td>
                        <td className="p-2 font-mono text-xs">{r.recipient}</td>
                        <td className="p-2">{r.event_type ?? '—'}</td>
                        <td className="p-2"><span className={r.status === 'sent' ? 'text-green-600' : 'text-red-600'}>{r.status}</span></td>
                        <td className="p-2 max-w-xs truncate" title={r.api_response ?? ''}>{r.api_response ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center justify-between border-t border-primary-200 px-4 py-2">
                  <span className="text-sm text-muted-foreground">Page {logPage} of {Math.max(1, Math.ceil(emailSmsLogTotal / 25))}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={logPage <= 1} onClick={() => setLogPage((p) => p - 1)}>Previous</Button>
                    <Button variant="outline" size="sm" disabled={logPage >= Math.ceil(emailSmsLogTotal / 25)} onClick={() => setLogPage((p) => p + 1)}>Next</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {logsSubTab === 'journey' && (
            <Card className="border-primary-200">
              <CardHeader className="border-b border-primary-100 bg-primary-50/50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-accent-500" />
                    <h2 className="font-semibold text-primary-800">User journey log</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Event type</span>
                    <select value={logEventType} onChange={(e) => { setLogEventType(e.target.value); setLogPage(1); }} className="rounded border border-primary-200 px-2 py-1 text-sm">
                      <option value="">All</option>
                      <option value="page_view">Page view</option>
                      <option value="click">Click</option>
                      <option value="feature_use">Feature use</option>
                      <option value="login">Login</option>
                      <option value="logout">Logout</option>
                    </select>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Total: {journeyLogTotal} — Click a row to view full session timeline</p>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-primary-200 bg-primary-50/50"><th className="text-left p-2">Time</th><th className="text-left p-2">User</th><th className="text-left p-2">Session</th><th className="text-left p-2">Event</th><th className="text-left p-2">Page</th><th className="text-left p-2">Payload</th></tr></thead>
                  <tbody>
                    {journeyLogRows.map((r) => (
                      <tr key={r.id} className="border-b border-primary-100 cursor-pointer hover:bg-primary-50/80" onClick={() => setSelectedJourneySessionId(r.session_id)}>
                        <td className="p-2 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                        <td className="p-2">{r.user_id ?? '—'}</td>
                        <td className="p-2 font-mono text-xs">{r.session_id.slice(0, 12)}…</td>
                        <td className="p-2">{r.event_type}</td>
                        <td className="p-2">{r.page_or_route ?? '—'}</td>
                        <td className="p-2 max-w-xs truncate" title={r.payload ?? ''}>{r.payload ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center justify-between border-t border-primary-200 px-4 py-2">
                  <span className="text-sm text-muted-foreground">Page {logPage} of {Math.max(1, Math.ceil(journeyLogTotal / 25))}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={logPage <= 1} onClick={() => setLogPage((p) => p - 1)}>Previous</Button>
                    <Button variant="outline" size="sm" disabled={logPage >= Math.ceil(journeyLogTotal / 25)} onClick={() => setLogPage((p) => p + 1)}>Next</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {logsSubTab === 'api' && (
            <Card className="border-primary-200">
              <CardHeader className="border-b border-primary-100 bg-primary-50/50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-accent-500" />
                    <h2 className="font-semibold text-primary-800">API log</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Path contains</span>
                    <input type="text" value={logPath} onChange={(e) => setLogPath(e.target.value)} onBlur={() => setLogPage(1)} placeholder="e.g. bookings" className="w-32 rounded border border-primary-200 px-2 py-1 text-sm" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Total: {apiLogTotal} — Click a row for details</p>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-primary-200 bg-primary-50/50"><th className="text-left p-2">Time</th><th className="text-left p-2">Method</th><th className="text-left p-2">Path</th><th className="text-left p-2">User</th><th className="text-left p-2">Status</th><th className="text-left p-2">Time (ms)</th></tr></thead>
                  <tbody>
                    {apiLogRows.map((r) => (
                      <tr key={r.id} className="border-b border-primary-100 cursor-pointer hover:bg-primary-50/80" onClick={() => setSelectedApiLog(r)}>
                        <td className="p-2 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                        <td className="p-2">{r.method}</td>
                        <td className="p-2 font-mono text-xs">{r.path}</td>
                        <td className="p-2">{r.user_id ?? '—'}</td>
                        <td className="p-2"><span className={r.response_status >= 400 ? 'text-red-600' : 'text-green-600'}>{r.response_status}</span></td>
                        <td className="p-2">{r.response_time_ms}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center justify-between border-t border-primary-200 px-4 py-2">
                  <span className="text-sm text-muted-foreground">Page {logPage} of {Math.max(1, Math.ceil(apiLogTotal / 25))}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={logPage <= 1} onClick={() => setLogPage((p) => p - 1)}>Previous</Button>
                    <Button variant="outline" size="sm" disabled={logPage >= Math.ceil(apiLogTotal / 25)} onClick={() => setLogPage((p) => p + 1)}>Next</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {logsSubTab === 'errors' && (
            <Card className="border-primary-200">
              <CardHeader className="border-b border-primary-100 bg-primary-50/50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-accent-500" />
                    <h2 className="font-semibold text-primary-800">Error log</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Source</span>
                    <select value={logSource} onChange={(e) => { setLogSource(e.target.value); setLogPage(1); }} className="rounded border border-primary-200 px-2 py-1 text-sm">
                      <option value="">All</option>
                      <option value="frontend">Frontend</option>
                      <option value="api">API</option>
                      <option value="database">Database</option>
                    </select>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Total: {errorLogTotal} — Click a row for full message and stack</p>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-primary-200 bg-primary-50/50"><th className="text-left p-2">Time</th><th className="text-left p-2">Source</th><th className="text-left p-2">Level</th><th className="text-left p-2">Message</th><th className="text-left p-2">Path</th></tr></thead>
                  <tbody>
                    {errorLogRows.map((r) => (
                      <tr key={r.id} className="border-b border-primary-100 cursor-pointer hover:bg-primary-50/80" onClick={() => setSelectedErrorLog(r)}>
                        <td className="p-2 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                        <td className="p-2">{r.source}</td>
                        <td className="p-2">{r.level}</td>
                        <td className="p-2 max-w-md truncate" title={r.message}>{r.message}</td>
                        <td className="p-2">{r.request_path ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center justify-between border-t border-primary-200 px-4 py-2">
                  <span className="text-sm text-muted-foreground">Page {logPage} of {Math.max(1, Math.ceil(errorLogTotal / 25))}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={logPage <= 1} onClick={() => setLogPage((p) => p - 1)}>Previous</Button>
                    <Button variant="outline" size="sm" disabled={logPage >= Math.ceil(errorLogTotal / 25)} onClick={() => setLogPage((p) => p + 1)}>Next</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {logsSubTab === 'analytics' && (
            <>
              {!analyticsData ? (
                <Card className="border-primary-200"><CardContent className="py-12 text-center text-muted-foreground">Select date range above and view Analytics. No data for the selected range.</CardContent></Card>
              ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-primary-200">
                <CardHeader><h3 className="font-medium">Email/SMS by day</h3></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={Object.entries((analyticsData!.email_sms_by_day || []).reduce<Record<string, Record<string, number>>>((acc, { day, channel, count }) => { acc[day] = acc[day] || {}; acc[day][channel] = count; return acc; }, {})).map(([day, channels]) => ({ day, ...channels }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="email" fill="#0ea5e9" name="Email" />
                      <Bar dataKey="sms" fill="#22c55e" name="SMS" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="border-primary-200">
                <CardHeader><h3 className="font-medium">User journey by day</h3></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={Object.entries((analyticsData!.journey_by_day || []).reduce<Record<string, Record<string, number>>>((acc, { day, event_type, count }) => { acc[day] = acc[day] || {}; acc[day][event_type] = (acc[day][event_type] || 0) + count; return acc; }, {})).map(([day, events]) => ({ day, ...events }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="page_view" stroke="#0ea5e9" name="Page views" />
                      <Line type="monotone" dataKey="click" stroke="#22c55e" name="Clicks" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="border-primary-200">
                <CardHeader><h3 className="font-medium">API responses by day</h3></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={Object.values((analyticsData!.api_by_day || []).reduce<Record<string, { day: string; '2xx': number; '4xx': number; '5xx': number }>>((acc, { day, status_bucket, count }) => { if (!acc[day]) acc[day] = { day, '2xx': 0, '4xx': 0, '5xx': 0 }; acc[day][status_bucket as '2xx'|'4xx'|'5xx'] = count; return acc; }, {}))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="2xx" fill="#22c55e" name="2xx" />
                      <Bar dataKey="4xx" fill="#eab308" name="4xx" />
                      <Bar dataKey="5xx" fill="#ef4444" name="5xx" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="border-primary-200">
                <CardHeader><h3 className="font-medium">Errors by day</h3></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={Object.entries((analyticsData!.errors_by_day || []).reduce<Record<string, Record<string, number>>>((acc, { day, source, count }) => { acc[day] = acc[day] || {}; acc[day][source] = (acc[day][source] || 0) + count; return acc; }, {})).map(([day, sources]) => ({ day, ...sources }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="frontend" fill="#ef4444" name="Frontend" />
                      <Bar dataKey="api" fill="#eab308" name="API" />
                      <Bar dataKey="database" fill="#0ea5e9" name="Database" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
              )}
            </>
          )}

          {logsSubTab === 'heatmap' && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-primary-200">
                <CardHeader className="border-b border-primary-100 bg-primary-50/50">
                  <div className="flex items-center gap-2">
                    <MousePointer className="h-5 w-5 text-accent-500" />
                    <h2 className="font-semibold text-primary-800">Page view heat map</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">Views per route (top 50)</p>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-primary-200 bg-primary-50/50"><th className="text-left p-2">Path</th><th className="text-right p-2">Views</th></tr></thead>
                    <tbody>
                      {heatmapPageViews.map((r, i) => (
                        <tr key={i} className="border-b border-primary-100 cursor-pointer hover:bg-primary-50/80" onClick={() => setSelectedHeatmapPath(selectedHeatmapPath === r.path ? null : r.path)}>
                          <td className="p-2 font-mono text-xs">{r.path}</td>
                          <td className="p-2 text-right font-medium">{r.views.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
              <Card className="border-primary-200">
                <CardHeader className="border-b border-primary-100 bg-primary-50/50">
                  <h2 className="font-semibold text-primary-800">Click events (sample)</h2>
                  <p className="text-sm text-muted-foreground">Recent clicks with position for heat map</p>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto max-h-96 overflow-y-auto">
                  {selectedHeatmapPath && (
                    <p className="px-4 py-2 text-sm bg-accent-50 text-accent-800 border-b border-primary-200">
                      Showing clicks for path: <strong className="font-mono">{selectedHeatmapPath}</strong>
                      <button type="button" className="ml-2 text-accent-600 underline" onClick={() => setSelectedHeatmapPath(null)}>Clear filter</button>
                    </p>
                  )}
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-primary-200 bg-primary-50/50 sticky top-0 bg-primary-50"><th className="text-left p-2">Time</th><th className="text-left p-2">Page</th><th className="text-left p-2">Payload (x, y, tag)</th></tr></thead>
                    <tbody>
                      {(selectedHeatmapPath ? heatmapClicks.filter((r) => r.page_or_route === selectedHeatmapPath) : heatmapClicks).slice(0, 80).map((r) => {
                        let pl = r.payload;
                        try { const p = typeof pl === 'string' ? JSON.parse(pl) : pl; pl = p && typeof p === 'object' ? `${p.x ?? ''}, ${p.y ?? ''} ${p.tag ?? ''}` : String(pl); } catch { pl = String(pl); }
                        return (
                          <tr key={r.id} className="border-b border-primary-100">
                            <td className="p-2 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                            <td className="p-2 font-mono text-xs">{r.page_or_route ?? '—'}</td>
                            <td className="p-2 text-xs">{pl}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Log detail dialogs */}
      <Dialog.Root open={!!emailSmsDetail} onOpenChange={(open) => { if (!open) { setSelectedEmailSmsId(null); setEmailSmsDetail(null); } }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-primary-200 bg-background shadow-lg overflow-hidden flex flex-col">
            {emailSmsDetail && (
              <>
                <div className="flex items-center justify-between border-b border-primary-100 p-4 bg-primary-50/50">
                  <Dialog.Title className="font-semibold text-primary-800">Email / SMS log detail</Dialog.Title>
                  <Dialog.Close asChild>
                    <button type="button" className="rounded p-1 hover:bg-primary-200" aria-label="Close"><X className="h-5 w-5" /></button>
                  </Dialog.Close>
                </div>
                <div className="p-4 overflow-y-auto space-y-3 text-sm">
                  <dl className="grid grid-cols-[120px_1fr] gap-2">
                    <dt className="text-muted-foreground">Time</dt><dd>{new Date(emailSmsDetail.created_at).toLocaleString()}</dd>
                    <dt className="text-muted-foreground">Channel</dt><dd>{emailSmsDetail.channel}</dd>
                    <dt className="text-muted-foreground">Recipient</dt><dd className="font-mono break-all">{emailSmsDetail.recipient}</dd>
                    <dt className="text-muted-foreground">Subject</dt><dd>{emailSmsDetail.subject ?? '—'}</dd>
                    <dt className="text-muted-foreground">Event type</dt><dd>{emailSmsDetail.event_type ?? '—'}</dd>
                    <dt className="text-muted-foreground">Status</dt><dd><span className={emailSmsDetail.status === 'sent' ? 'text-green-600' : 'text-red-600'}>{emailSmsDetail.status}</span></dd>
                  </dl>
                  <div>
                    <div className="font-medium text-muted-foreground mb-1">Body / Message</div>
                    <pre className="rounded bg-primary-50 p-3 text-xs whitespace-pre-wrap break-words max-h-40 overflow-y-auto">{emailSmsDetail.body_or_message ?? '—'}</pre>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground mb-1">API response</div>
                    <pre className="rounded bg-primary-50 p-3 text-xs whitespace-pre-wrap break-words max-h-32 overflow-y-auto">{emailSmsDetail.api_response ?? '—'}</pre>
                  </div>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={!!selectedJourneySessionId} onOpenChange={(open) => { if (!open) { setSelectedJourneySessionId(null); setJourneySessionEvents([]); } }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-primary-200 bg-background shadow-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-primary-100 p-4 bg-primary-50/50">
              <Dialog.Title className="font-semibold text-primary-800">User journey — Session timeline</Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" className="rounded p-1 hover:bg-primary-200" aria-label="Close" onClick={() => { setSelectedJourneySessionId(null); setJourneySessionEvents([]); }}><X className="h-5 w-5" /></button>
              </Dialog.Close>
            </div>
            <div className="p-4 overflow-y-auto">
              <p className="text-sm text-muted-foreground mb-3 font-mono break-all">Session: {selectedJourneySessionId}</p>
              <p className="text-sm text-muted-foreground mb-3">{journeySessionEvents.length} events (chronological)</p>
              <ul className="space-y-2">
                {journeySessionEvents.map((e) => (
                  <li key={e.id} className="flex gap-3 rounded border border-primary-100 p-2 text-sm">
                    <span className="text-muted-foreground shrink-0">{new Date(e.created_at).toLocaleTimeString()}</span>
                    <span className="font-medium shrink-0 w-24">{e.event_type}</span>
                    <span className="font-mono text-xs truncate">{e.page_or_route ?? '—'}</span>
                    {e.payload && <span className="truncate text-muted-foreground" title={e.payload}>{e.payload}</span>}
                  </li>
                ))}
              </ul>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={!!selectedApiLog} onOpenChange={(open) => !open && setSelectedApiLog(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-primary-200 bg-background p-6 shadow-lg">
            {selectedApiLog && (
              <>
                <div className="flex items-center justify-between border-b border-primary-100 pb-3">
                  <Dialog.Title className="font-semibold text-primary-800">API log detail</Dialog.Title>
                  <Dialog.Close asChild>
                    <button type="button" className="rounded p-1 hover:bg-primary-200" aria-label="Close"><X className="h-5 w-5" /></button>
                  </Dialog.Close>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <div><dt className="text-muted-foreground">Time</dt><dd>{new Date(selectedApiLog.created_at).toLocaleString()}</dd></div>
                  <div><dt className="text-muted-foreground">Method</dt><dd className="font-mono">{selectedApiLog.method}</dd></div>
                  <div><dt className="text-muted-foreground">Path</dt><dd className="font-mono break-all">{selectedApiLog.path}</dd></div>
                  <div><dt className="text-muted-foreground">User ID</dt><dd>{selectedApiLog.user_id ?? '—'}</dd></div>
                  <div><dt className="text-muted-foreground">Response status</dt><dd><span className={selectedApiLog.response_status >= 400 ? 'text-red-600' : 'text-green-600'}>{selectedApiLog.response_status}</span></dd></div>
                  <div><dt className="text-muted-foreground">Response time</dt><dd>{selectedApiLog.response_time_ms} ms</dd></div>
                </dl>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={!!selectedErrorLog} onOpenChange={(open) => !open && setSelectedErrorLog(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-primary-200 bg-background shadow-lg overflow-hidden flex flex-col">
            {selectedErrorLog && (
              <>
                <div className="flex items-center justify-between border-b border-primary-100 p-4 bg-primary-50/50">
                  <Dialog.Title className="font-semibold text-primary-800">Error log detail</Dialog.Title>
                  <Dialog.Close asChild>
                    <button type="button" className="rounded p-1 hover:bg-primary-200" aria-label="Close"><X className="h-5 w-5" /></button>
                  </Dialog.Close>
                </div>
                <div className="p-4 overflow-y-auto space-y-3 text-sm">
                  <dl className="grid grid-cols-[120px_1fr] gap-2">
                    <dt className="text-muted-foreground">Time</dt><dd>{new Date(selectedErrorLog.created_at).toLocaleString()}</dd>
                    <dt className="text-muted-foreground">Source</dt><dd>{selectedErrorLog.source}</dd>
                    <dt className="text-muted-foreground">Level</dt><dd>{selectedErrorLog.level}</dd>
                    <dt className="text-muted-foreground">Request path</dt><dd className="font-mono">{selectedErrorLog.request_path ?? '—'}</dd>
                    <dt className="text-muted-foreground">Request ID</dt><dd className="font-mono text-xs">{selectedErrorLog.request_id ?? '—'}</dd>
                  </dl>
                  <div>
                    <div className="font-medium text-muted-foreground mb-1">Message</div>
                    <pre className="rounded bg-red-50 p-3 text-xs whitespace-pre-wrap break-words">{selectedErrorLog.message}</pre>
                  </div>
                  {selectedErrorLog.stack_or_detail && (
                    <div>
                      <div className="font-medium text-muted-foreground mb-1">Stack / Detail</div>
                      <pre className="rounded bg-primary-50 p-3 text-xs whitespace-pre-wrap break-words max-h-60 overflow-y-auto">{selectedErrorLog.stack_or_detail}</pre>
                    </div>
                  )}
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Booking details dialog */}
      <Dialog.Root open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-primary-200 bg-background p-6 shadow-lg">
            {selectedBooking && (
              <>
                <div className="flex items-center justify-between border-b border-primary-100 pb-3">
                  <Dialog.Title className="font-semibold text-primary-800">Booking details</Dialog.Title>
                  <Dialog.Close asChild>
                    <button type="button" className="rounded p-1 hover:bg-primary-100" aria-label="Close">
                      <X className="h-5 w-5" />
                    </button>
                  </Dialog.Close>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <div><dt className="font-medium text-muted-foreground">Booking ID</dt><dd className="font-medium text-primary-800">{selectedBooking.id}</dd></div>
                  <div><dt className="font-medium text-muted-foreground">Listing</dt><dd className="text-primary-800">{selectedBooking.listing_title}</dd></div>
                  <div><dt className="font-medium text-muted-foreground">Guest</dt><dd className="text-primary-800">{selectedBooking.guest_name} ({selectedBooking.guest_email})</dd></div>
                  <div><dt className="font-medium text-muted-foreground">Check-in</dt><dd className="text-primary-800">{formatDateOnly(selectedBooking.check_in)}</dd></div>
                  <div><dt className="font-medium text-muted-foreground">Check-out</dt><dd className="text-primary-800">{formatDateOnly(selectedBooking.check_out)}</dd></div>
                  <div><dt className="font-medium text-muted-foreground">Guests</dt><dd className="text-primary-800">{selectedBooking.guests}</dd></div>
                  <div><dt className="font-medium text-muted-foreground">Status</dt><dd><span className={`rounded-full px-2 py-1 text-xs font-medium ${bookingStatusColor(selectedBooking.status)}`}>{selectedBooking.status}</span></dd></div>
                  <div><dt className="font-medium text-muted-foreground">Created</dt><dd className="text-primary-800">{formatDateOnly(selectedBooking.created_at)}</dd></div>
                </dl>
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/listings/${selectedBooking.listing_id}`} state={{ from: 'admin' }} onClick={() => setSelectedBooking(null)}>View listing</Link>
                  </Button>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Transaction receipt dialog */}
      <Dialog.Root open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-primary-200 bg-background p-6 shadow-lg">
            {selectedPayment && (() => {
              const p = selectedPayment;
              const downloadReceiptPdf = () => {
                const doc = new jsPDF();
                doc.setFontSize(18);
                doc.text('Transaction Receipt', 20, 20);
                doc.setFontSize(11);
                let y = 36;
                doc.text(`Payment ID: ${p.id}`, 20, y); y += 8;
                doc.text(`Booking ID: ${p.booking_id}`, 20, y); y += 8;
                doc.text(`Listing: ${p.listing_title}`, 20, y); y += 8;
                doc.text(`Guest: ${p.guest_name}`, 20, y); y += 8;
                doc.text(`Amount: NPR ${Number(p.amount).toLocaleString()}`, 20, y); y += 8;
                doc.text(`Status: ${p.status}`, 20, y); y += 8;
                doc.text(`Date: ${formatDateOnly(p.created_at)}`, 20, y);
                doc.save(`receipt-${p.id}.pdf`);
                toast({ title: 'Receipt downloaded.' });
              };
              return (
                <>
                  <div className="flex items-center justify-between border-b border-primary-100 pb-3">
                    <Dialog.Title className="font-semibold text-primary-800">Transaction receipt</Dialog.Title>
                    <Dialog.Close asChild>
                      <button type="button" className="rounded p-1 hover:bg-primary-100" aria-label="Close">
                        <X className="h-5 w-5" />
                      </button>
                    </Dialog.Close>
                  </div>
                  <dl className="mt-4 space-y-2 text-sm">
                    <div><dt className="font-medium text-muted-foreground">Payment ID</dt><dd className="font-medium text-primary-800">{p.id}</dd></div>
                    <div><dt className="font-medium text-muted-foreground">Booking ID</dt><dd className="text-primary-800">{p.booking_id}</dd></div>
                    <div><dt className="font-medium text-muted-foreground">Listing</dt><dd className="text-primary-800">{p.listing_title}</dd></div>
                    <div><dt className="font-medium text-muted-foreground">Guest</dt><dd className="text-primary-800">{p.guest_name}</dd></div>
                    <div><dt className="font-medium text-muted-foreground">Amount</dt><dd className="font-semibold text-accent-600">NPR {Number(p.amount).toLocaleString()}</dd></div>
                    <div><dt className="font-medium text-muted-foreground">Status</dt><dd className="text-primary-800">{p.status}</dd></div>
                    <div><dt className="font-medium text-muted-foreground">Date</dt><dd className="text-primary-800">{formatDateOnly(p.created_at)}</dd></div>
                  </dl>
                  <div className="mt-6 flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={downloadReceiptPdf}>
                      <Download className="mr-1.5 h-4 w-4" />
                      Download PDF
                    </Button>
                    <Dialog.Close asChild>
                      <Button size="sm">Close</Button>
                    </Dialog.Close>
                  </div>
                </>
              );
            })()}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
