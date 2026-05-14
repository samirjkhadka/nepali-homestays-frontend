import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { jsPDF } from 'jspdf';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PasswordInput } from '@/components/ui/password-input';
import { Users, FileCheck, Calendar, CreditCard, BarChart3, FileText, Youtube, X, Download, Home, MessageSquare, Bell, Activity, AlertCircle, Mail, MousePointer, Building2, Plus, RefreshCw, Newspaper, ChevronUp, ChevronDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { api } from '@/lib/api';
import { bookingFeeDelta, parseAmenityChargesJson } from '@/lib/booking-price-breakdown';
import { OfflineProofPreview } from '@/components/booking/OfflineProofPreview';
import { useToast } from '@/hooks/use-toast';
import { HOMESTAY_CATEGORIES } from '@/data/districts';
import { AdminTable } from '@/components/admin/AdminTable';
import { DateRangePicker } from '@/components/DateRangePicker';

function formatBookingPaymentMethod(raw: string | null | undefined): string {
  const s = (raw ?? '').trim().toLowerCase();
  if (s === 'npx') return 'NPX';
  if (s === 'himalpay') return 'N-Cash (HimalPay)';
  if (!s) return '—';
  return (raw ?? '').trim();
}

type Listing = { id: number; title: string; host_id: number; status: string; created_at: string; badge?: string | null };
type ApprovedListing = { id: number; title: string; location: string; badge: string | null };
type LiveListing = { id: number; title: string; location: string; badge: string | null; status: string };
type User = { id: number; name: string; email: string; phone: string | null; role: string; created_at?: string; blocked?: boolean; host_listing_id?: number | null; host_listing_title?: string | null };
type VideoEntry = { url: string; title?: string };
type ChargeableAmenity = { id: number; listing_id: number; name: string; price_npr: number; charge_type: 'per_night' | 'one_time' };
type AdminBooking = {
  id: number;
  listing_id: number;
  listing_title: string;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  guests: number;
  status: string;
  created_at: string;
  corporate_name?: string | null;
  subtotal_npr?: number | null;
  total_amount?: number | null;
  amenity_charges_json?: string | null;
  listing_price_per_night?: number | null;
  offline_payment_proof_url?: string | null;
  offline_payment_remarks?: string | null;
  payment_provider?: string | null;
};
type AdminPayment = { id: number; booking_id: number; amount: number; service_charge?: number; status: string; created_at: string; listing_title: string; guest_name: string; payment_provider?: string | null };
type Corporate = { id: number; name: string; status: string; contact_name: string | null; contact_email: string | null; contact_phone: string | null; billing_method: string | null; approval_required: boolean; max_nightly_rate: number | null; notes: string | null; created_at: string; updated_at: string };
type CmsSection = { id: number; section_key: string; title: string | null; content: string | null; display_place: string; sort_order: number; created_at: string; updated_at: string };

function isValidCmsSection(s: unknown): s is CmsSection {
  if (typeof s !== 'object' || s === null) return false;
  const o = s as Record<string, unknown>;
  return (
    typeof o.id === 'number' &&
    typeof o.section_key === 'string' &&
    typeof o.display_place === 'string' &&
    typeof o.sort_order === 'number'
  );
}

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

/** Must match public API: GET /api/listings/hero (max 5) and /featured (max 6) + admin zod. */
const MAX_HOME_HERO_CAROUSEL = 5;
const MAX_HOME_FEATURED = 6;

const EMPTY_HOME_PLACEMENTS: HomePlacementSettings = {
  hero_carousel_listing_ids: [],
  featured_listing_ids: [],
  hero_carousel_price: 0,
  featured_placement_price: 0,
};

type HomePartnerIcon = 'CreditCard' | 'Plane' | 'PartyPopper' | 'Building2';
type HomePartnerItemForm = { name: string; tag: string; website?: string };
type HomePartnerCategoryForm = {
  title: string;
  description?: string;
  icon: HomePartnerIcon;
  partners: HomePartnerItemForm[];
};
type HomePartnersForm = {
  section_badge?: string;
  section_title?: string;
  section_subtitle?: string;
  categories: HomePartnerCategoryForm[];
};
type FestivalsPageConfig = {
  badge?: string;
  title: string;
  subtitle?: string;
  festivals: Array<{
    id: string;
    name: string;
    monthIndex: number;
    region?: string;
    duration?: string;
    description: string;
    emoji?: string;
  }>;
};
type FestivalItemForm = {
  id: string;
  name: string;
  monthIndex: string;
  region: string;
  duration: string;
  description: string;
  emoji: string;
};
type FestivalsPageForm = {
  badge: string;
  title: string;
  subtitle: string;
  festivals: FestivalItemForm[];
};
type TripPlannerPageConfig = {
  badge?: string;
  title: string;
  subtitle?: string;
  route_map_title?: string;
  route_map_description?: string;
  suggested_routes_title?: string;
  suggested_routes: Array<{
    id: string;
    name: string;
    days: number;
    description: string;
    stops: string[];
    emoji?: string;
  }>;
};
type SuggestedRouteForm = {
  id: string;
  name: string;
  days: string;
  description: string;
  stopsText: string;
  emoji: string;
};
type TripPlannerPageForm = {
  badge: string;
  title: string;
  subtitle: string;
  route_map_title: string;
  route_map_description: string;
  suggested_routes_title: string;
  suggested_routes: SuggestedRouteForm[];
};

const HOME_PARTNER_ICONS: HomePartnerIcon[] = ['CreditCard', 'Plane', 'PartyPopper', 'Building2'];
const EMPTY_PARTNER = (): HomePartnerItemForm => ({ name: '', tag: '', website: '' });
const EMPTY_CATEGORY = (): HomePartnerCategoryForm => ({
  title: '',
  description: '',
  icon: 'Building2',
  partners: [EMPTY_PARTNER()],
});
const EMPTY_HOME_PARTNERS = (): HomePartnersForm => ({
  section_badge: 'Our Partners',
  section_title: 'Powered by Trusted Partners',
  section_subtitle: '',
  categories: [EMPTY_CATEGORY()],
});
const EMPTY_FESTIVALS_PAGE = (): FestivalsPageConfig => ({
  badge: 'Cultural Calendar',
  title: 'Festivals of Nepal',
  subtitle: "Time your visit with one of Nepal's vibrant festivals to experience the country at its most alive.",
  festivals: [],
});
const EMPTY_FESTIVAL_ITEM = (): FestivalItemForm => ({
  id: '',
  name: '',
  monthIndex: '',
  region: '',
  duration: '',
  description: '',
  emoji: '',
});
const EMPTY_FESTIVALS_FORM = (): FestivalsPageForm => ({
  badge: 'Cultural Calendar',
  title: 'Festivals of Nepal',
  subtitle: "Time your visit with one of Nepal's vibrant festivals to experience the country at its most alive.",
  festivals: [EMPTY_FESTIVAL_ITEM()],
});
const EMPTY_TRIP_PLANNER_PAGE = (): TripPlannerPageConfig => ({
  badge: 'Trip Planner',
  title: 'Build your homestay journey',
  subtitle: 'Chain multiple homestays into a multi-stop trip. Inspired by community routes across Nepal.',
  route_map_title: 'Route map preview',
  route_map_description: 'Connect a map provider to render the route between your stops.',
  suggested_routes_title: 'Suggested routes',
  suggested_routes: [],
});
const EMPTY_ROUTE_FORM = (): SuggestedRouteForm => ({
  id: '',
  name: '',
  days: '',
  description: '',
  stopsText: '',
  emoji: '',
});
const EMPTY_TRIP_PLANNER_FORM = (): TripPlannerPageForm => ({
  badge: 'Trip Planner',
  title: 'Build your homestay journey',
  subtitle: 'Chain multiple homestays into a multi-stop trip. Inspired by community routes across Nepal.',
  route_map_title: 'Route map preview',
  route_map_description: 'Connect a map provider to render the route between your stops.',
  suggested_routes_title: 'Suggested routes',
  suggested_routes: [EMPTY_ROUTE_FORM()],
});

function normalizeHomePartners(raw: unknown): HomePartnersForm {
  if (!raw || typeof raw !== 'object') return EMPTY_HOME_PARTNERS();
  const obj = raw as Record<string, unknown>;
  const categoriesRaw = Array.isArray(obj.categories) ? obj.categories : [];
  const categories: HomePartnerCategoryForm[] = categoriesRaw.flatMap((c) => {
    if (!c || typeof c !== 'object') return [];
    const co = c as Record<string, unknown>;
    const partnersRaw = Array.isArray(co.partners) ? co.partners : [];
    const partners: HomePartnerItemForm[] = partnersRaw.flatMap((p) => {
      if (!p || typeof p !== 'object') return [];
      const po = p as Record<string, unknown>;
      return [{
        name: typeof po.name === 'string' ? po.name : '',
        tag: typeof po.tag === 'string' ? po.tag : '',
        website: typeof po.website === 'string' ? po.website : '',
      }];
    });
    const icon = typeof co.icon === 'string' && HOME_PARTNER_ICONS.includes(co.icon as HomePartnerIcon)
      ? (co.icon as HomePartnerIcon)
      : 'Building2';
    return [{
      title: typeof co.title === 'string' ? co.title : '',
      description: typeof co.description === 'string' ? co.description : '',
      icon,
      partners: partners.length > 0 ? partners : [EMPTY_PARTNER()],
    }];
  });
  return {
    section_badge: typeof obj.section_badge === 'string' ? obj.section_badge : 'Our Partners',
    section_title: typeof obj.section_title === 'string' ? obj.section_title : 'Powered by Trusted Partners',
    section_subtitle: typeof obj.section_subtitle === 'string' ? obj.section_subtitle : '',
    categories: categories.length > 0 ? categories : [EMPTY_CATEGORY()],
  };
}

function normalizeFestivalsPage(raw: unknown): FestivalsPageForm {
  if (!raw || typeof raw !== 'object') return EMPTY_FESTIVALS_FORM();
  const obj = raw as Record<string, unknown>;
  const items = Array.isArray(obj.festivals) ? obj.festivals : [];
  const festivals = items.flatMap((it) => {
    if (!it || typeof it !== 'object') return [];
    const f = it as Record<string, unknown>;
    return [{
      id: typeof f.id === 'string' ? f.id : '',
      name: typeof f.name === 'string' ? f.name : '',
      monthIndex: typeof f.monthIndex === 'number' ? String(f.monthIndex) : '',
      region: typeof f.region === 'string' ? f.region : '',
      duration: typeof f.duration === 'string' ? f.duration : '',
      description: typeof f.description === 'string' ? f.description : '',
      emoji: typeof f.emoji === 'string' ? f.emoji : '',
    }];
  });
  return {
    badge: typeof obj.badge === 'string' ? obj.badge : 'Cultural Calendar',
    title: typeof obj.title === 'string' ? obj.title : 'Festivals of Nepal',
    subtitle: typeof obj.subtitle === 'string' ? obj.subtitle : '',
    festivals: festivals.length ? festivals : [EMPTY_FESTIVAL_ITEM()],
  };
}

function normalizeTripPlannerPage(raw: unknown): TripPlannerPageForm {
  if (!raw || typeof raw !== 'object') return EMPTY_TRIP_PLANNER_FORM();
  const obj = raw as Record<string, unknown>;
  const routesRaw = Array.isArray(obj.suggested_routes) ? obj.suggested_routes : [];
  const routes = routesRaw.flatMap((it) => {
    if (!it || typeof it !== 'object') return [];
    const r = it as Record<string, unknown>;
    const stops = Array.isArray(r.stops) ? r.stops.filter((s) => typeof s === 'string') as string[] : [];
    return [{
      id: typeof r.id === 'string' ? r.id : '',
      name: typeof r.name === 'string' ? r.name : '',
      days: typeof r.days === 'number' ? String(r.days) : '',
      description: typeof r.description === 'string' ? r.description : '',
      stopsText: stops.join(', '),
      emoji: typeof r.emoji === 'string' ? r.emoji : '',
    }];
  });
  return {
    badge: typeof obj.badge === 'string' ? obj.badge : 'Trip Planner',
    title: typeof obj.title === 'string' ? obj.title : 'Build your homestay journey',
    subtitle: typeof obj.subtitle === 'string' ? obj.subtitle : '',
    route_map_title: typeof obj.route_map_title === 'string' ? obj.route_map_title : '',
    route_map_description: typeof obj.route_map_description === 'string' ? obj.route_map_description : '',
    suggested_routes_title: typeof obj.suggested_routes_title === 'string' ? obj.suggested_routes_title : 'Suggested routes',
    suggested_routes: routes.length ? routes : [EMPTY_ROUTE_FORM()],
  };
}

/** Keys must match backend `email-templates` / `email_template_overrides`. */
const ADMIN_EMAIL_TEMPLATE_KEYS = [
  'otp',
  'password_reset',
  'admin_password_reset',
  'listing_approved',
  'listing_rejected',
  'booking_request',
  'booking_approved',
  'booking_declined',
  'payment_received',
  'payment_received_host',
  'offline_booking_confirmed',
] as const;

const ADMIN_TABS = ['overview', 'listings', 'users', 'bookings', 'corporates', 'payments', 'reports', 'content', 'settings', 'logs'] as const;
type AdminTab = (typeof ADMIN_TABS)[number];

const LISTING_BADGES = ['recommended', 'featured', 'new'] as const;
function parseBadges(badge: string | null | undefined): string[] {
  if (!badge || typeof badge !== 'string') return [];
  return badge.split(',').map((b) => b.trim()).filter((b) => LISTING_BADGES.includes(b as (typeof LISTING_BADGES)[number]));
}
function formatBadges(badges: string[]): string {
  return badges.filter((b) => LISTING_BADGES.includes(b as (typeof LISTING_BADGES)[number])).join(',');
}

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
  const [pendingListingsSearch, setPendingListingsSearch] = useState('');
  const [liveListingsSearch, setLiveListingsSearch] = useState('');
  /** When opening Listings from overview cards, narrow the live table. */
  const [adminLiveListingsFilter, setAdminLiveListingsFilter] = useState<'all' | 'disabled' | 'enabled'>('all');
  const [adminConfirm, setAdminConfirm] = useState<{ title: string; description: string; action: () => void } | null>(null);
  const [adminBookingsSearch, setAdminBookingsSearch] = useState('');
  const [adminPaymentsSearch, setAdminPaymentsSearch] = useState('');
  const [reportsSearch, setReportsSearch] = useState('');
  const [cmsSearch, setCmsSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<{ total_users?: number; total_listings?: number; approved_listings?: number; disabled_listings?: number; total_bookings?: number; total_revenue?: number }>({});
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
  const [youtubeChannelId, setYoutubeChannelId] = useState('');
  const [youtubeChannelIdSaving, setYoutubeChannelIdSaving] = useState(false);
  const [newsSyncLoading, setNewsSyncLoading] = useState(false);
  const [videosSyncLoading, setVideosSyncLoading] = useState(false);
  const [_bookingFee, setBookingFee] = useState<{ type: 'service_charge' | 'discount'; kind: 'percent' | 'fixed'; value: number } | null>(null);
  const [bookingFeeSaving, setBookingFeeSaving] = useState(false);
  const [bookingFeeForm, setBookingFeeForm] = useState({ type: 'service_charge' as 'service_charge' | 'discount', kind: 'percent' as 'percent' | 'fixed', value: '', applies_to: 'guest' as 'guest' | 'host' });
  const [partialPaymentMinPercent, setPartialPaymentMinPercent] = useState(25);
  const [partialPaymentMinSaving, setPartialPaymentMinSaving] = useState(false);
  const [paymentGatewayEnabled, setPaymentGatewayEnabled] = useState(true);
  const [paymentNpxEnabled, setPaymentNpxEnabled] = useState(true);
  const [paymentHimalpayEnabled, setPaymentHimalpayEnabled] = useState(false);
  const [offlineBookingGuestMessage, setOfflineBookingGuestMessage] = useState('');
  const [paymentGatewaySaving, setPaymentGatewaySaving] = useState(false);
  type FeeRule = { type: 'service_charge' | 'discount'; kind: 'percent' | 'fixed'; value: number; applies_to?: 'guest' | 'host' };
  const [bookingFeeByCategory, setBookingFeeByCategory] = useState<Record<string, FeeRule>>({});
  const [bookingFeeByListing, setBookingFeeByListing] = useState<Record<string, FeeRule>>({});
  const [feeRulesSaving, setFeeRulesSaving] = useState(false);
  const [_listingDisplay, setListingDisplay] = useState<ListingDisplaySettings | null>(null);
  const [listingDisplaySaving, setListingDisplaySaving] = useState(false);
  const [listingDisplayForm, setListingDisplayForm] = useState<ListingDisplaySettings | null>(null);
  const [sectionLabelsJson, setSectionLabelsJson] = useState('');
  const [newTrustBadge, setNewTrustBadge] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [offlineProofUrl, setOfflineProofUrl] = useState('');
  const [offlineRemarks, setOfflineRemarks] = useState('');
  const [offlineApproving, setOfflineApproving] = useState(false);

  useEffect(() => {
    if (selectedBooking) {
      setOfflineProofUrl('');
      setOfflineRemarks('');
    }
  }, [selectedBooking?.id]);

  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null);
  const [liveListings, setLiveListings] = useState<LiveListing[]>([]);
  const [sparrowSms, setSparrowSms] = useState<SparrowSmsSettings>({ token: '', from: '' });
  const [sparrowSmsSaving, setSparrowSmsSaving] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [notificationSettingsSaving, setNotificationSettingsSaving] = useState(false);
  const [homePlacements, setHomePlacements] = useState<HomePlacementSettings>(EMPTY_HOME_PLACEMENTS);
  const [homePlacementsSaving, setHomePlacementsSaving] = useState(false);
  const [homePartnersForm, setHomePartnersForm] = useState<HomePartnersForm>(EMPTY_HOME_PARTNERS());
  const [homePartnersSaving, setHomePartnersSaving] = useState(false);
  const [festivalsPageForm, setFestivalsPageForm] = useState<FestivalsPageForm>(EMPTY_FESTIVALS_FORM());
  const [festivalsPageSaving, setFestivalsPageSaving] = useState(false);
  const [tripPlannerPageForm, setTripPlannerPageForm] = useState<TripPlannerPageForm>(EMPTY_TRIP_PLANNER_FORM());
  const [tripPlannerPageSaving, setTripPlannerPageSaving] = useState(false);
  const [emailTemplatesMap, setEmailTemplatesMap] = useState<Record<string, { subject?: string; innerHtml?: string; bodyText?: string }>>({});
  const [emailTemplateKey, setEmailTemplateKey] = useState<string>(ADMIN_EMAIL_TEMPLATE_KEYS[0]);
  const [emailTemplateSubject, setEmailTemplateSubject] = useState('');
  const [emailTemplateInnerHtml, setEmailTemplateInnerHtml] = useState('');
  const [emailTemplateBodyText, setEmailTemplateBodyText] = useState('');
  const [emailTemplatesSaving, setEmailTemplatesSaving] = useState(false);
  const [userResetPwId, setUserResetPwId] = useState<number | null>(null);
  const [userResetPwSaving, setUserResetPwSaving] = useState(false);
  const [settingsApprovedListings, setSettingsApprovedListings] = useState<ApprovedListing[]>([]);
  /** Loaded on Settings tab for titles + fallback if /listings/approved fails (same payload as Listings “live” table). */
  const [homePlacementLabelListings, setHomePlacementLabelListings] = useState<LiveListing[]>([]);
  const [logsSubTab, setLogsSubTab] = useState<LogsSubTab>('email_sms');
  const [logDateFrom, setLogDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10);
  });
  const [logDateTo, setLogDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [emailSmsLogRows, setEmailSmsLogRows] = useState<{ id: number; channel: string; recipient: string; subject: string | null; body_preview: string | null; event_type: string | null; status: string; api_response: string | null; created_at: string }[]>([]);
  const [emailSmsLogTotal, setEmailSmsLogTotal] = useState(0);
  const [journeyLogRows, setJourneyLogRows] = useState<{ id: number; user_id: number | null; session_id: string; event_type: string; page_or_route: string | null; payload: string | null; created_at: string; user_phone?: string | null; user_name?: string | null }[]>([]);
  const [journeyLogTotal, setJourneyLogTotal] = useState(0);
  const [apiLogRows, setApiLogRows] = useState<{ id: number; method: string; path: string; user_id: number | null; response_status: number; response_time_ms: number; created_at: string; user_phone?: string | null; user_name?: string | null; request_body?: string | null; response_body?: string | null; request_body_preview?: string | null; response_body_preview?: string | null }[]>([]);
  const [apiLogTotal, setApiLogTotal] = useState(0);
  const [errorLogRows, setErrorLogRows] = useState<{ id: number; source: string; level: string; message: string; stack_or_detail: string | null; user_id: number | null; request_path: string | null; request_id: string | null; created_at: string }[]>([]);
  const [errorLogTotal, setErrorLogTotal] = useState(0);
  const [analyticsData, setAnalyticsData] = useState<{ email_sms_by_day: { day: string; channel: string; count: number }[]; journey_by_day: { day: string; event_type: string; count: number }[]; api_by_day: { day: string; status_bucket: string; count: number }[]; errors_by_day: { day: string; source: string; count: number }[] } | null>(null);
  const [heatmapPageViews, setHeatmapPageViews] = useState<{ path: string; views: number }[]>([]);
  const [heatmapClicks, setHeatmapClicks] = useState<{ id: number; session_id: string; page_or_route: string | null; payload: string | null; created_at: string }[]>([]);
  const [logPage, setLogPage] = useState(1);
  const [logsFiltersApplied, setLogsFiltersApplied] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [logChannel, setLogChannel] = useState<string>('');
  const [logEventType, setLogEventType] = useState<string>('');
  const [logPath, setLogPath] = useState('');
  const [logSource, setLogSource] = useState<string>('');
  const [selectedEmailSmsId, setSelectedEmailSmsId] = useState<number | null>(null);
  const [emailSmsDetail, setEmailSmsDetail] = useState<{ id: number; channel: string; recipient: string; subject: string | null; body_or_message: string | null; event_type: string | null; status: string; api_response: string | null; created_at: string } | null>(null);
  const [selectedJourneySessionId, setSelectedJourneySessionId] = useState<string | null>(null);
  const [journeySessionEvents, setJourneySessionEvents] = useState<{ id: number; user_id: number | null; session_id: string; event_type: string; page_or_route: string | null; payload: string | null; created_at: string }[]>([]);
  const [selectedApiLog, setSelectedApiLog] = useState<{ id: number; method: string; path: string; user_id: number | null; response_status: number; response_time_ms: number; created_at: string; user_phone?: string | null; user_name?: string | null; request_body?: string | null; response_body?: string | null } | null>(null);
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
  const [createBookingForm, setCreateBookingForm] = useState({ corporate_id: '' as string, listing_id: '', guest_id: '', guest_names: '', check_in: '', check_out: '', guests: '1', message: '' });
  const [createBookingSaving, setCreateBookingSaving] = useState(false);
  const [createBookingListingPrice, setCreateBookingListingPrice] = useState<number | null>(null);
  const [createBookingChargeableAmenities, setCreateBookingChargeableAmenities] = useState<ChargeableAmenity[]>([]);
  const [createBookingAmenityQuantities, setCreateBookingAmenityQuantities] = useState<Record<number, number>>({});
  const [addAmenityForm, setAddAmenityForm] = useState({ name: '', price_npr: '', charge_type: 'one_time' as 'per_night' | 'one_time' });
  const [addAmenitySaving, setAddAmenitySaving] = useState(false);
  const [corporatesApprovedListings, setCorporatesApprovedListings] = useState<ApprovedListing[]>([]);
  const [createBookingCalendarOpen, setCreateBookingCalendarOpen] = useState(false);
  const createBookingCalendarRef = useRef<HTMLDivElement>(null);
  const [logCalendarOpen, setLogCalendarOpen] = useState(false);
  const logCalendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!createBookingCalendarOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (createBookingCalendarRef.current && !createBookingCalendarRef.current.contains(e.target as Node)) {
        setCreateBookingCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [createBookingCalendarOpen]);

  useEffect(() => {
    if (!logCalendarOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (logCalendarRef.current && !logCalendarRef.current.contains(e.target as Node)) {
        setLogCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [logCalendarOpen]);

  // CMS (content tab)
  const [cmsSections, setCmsSections] = useState<CmsSection[]>([]);
  const [cmsSectionsLoading, setCmsSectionsLoading] = useState(false);
  const [editingCmsSection, setEditingCmsSection] = useState<CmsSection | null>(null);
  const [cmsSectionForm, setCmsSectionForm] = useState<{ section_key: string; title: string; content: string; display_place: string; sort_order: number }>({ section_key: '', title: '', content: '', display_place: 'footer', sort_order: 0 });
  const [cmsSectionSaving, setCmsSectionSaving] = useState(false);
  const [newCmsSectionKey, setNewCmsSectionKey] = useState('');
  const filteredCmsSections = useMemo(() => {
    const valid = cmsSections.filter(isValidCmsSection);
    const q = cmsSearch.trim().toLowerCase();
    if (!q) return valid;
    return valid.filter(
      (s) =>
        (s.section_key && s.section_key.toLowerCase().includes(q)) ||
        !!(s.title && s.title.toLowerCase().includes(q))
    );
  }, [cmsSections, cmsSearch]);
  // Users tab
  const [usersSearch, setUsersSearch] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState<User | null>(null);
  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [addAdminForm, setAddAdminForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [addAdminSaving, setAddAdminSaving] = useState(false);

  useEffect(() => {
    api.get<{
      pending_listings?: Listing[]; listings?: Listing[]; users?: User[];
      total_users?: number; total_listings?: number; approved_listings?: number; disabled_listings?: number; total_bookings?: number; total_revenue?: number;
    }>('/api/admin/dashboard').then((res) => {
      const dashboardPending = (res.data as { pending_listings?: unknown }).pending_listings;
      const dashboardListings = (res.data as { listings?: unknown }).listings;
      setPendingListings(Array.isArray(dashboardPending) ? dashboardPending : Array.isArray(dashboardListings) ? dashboardListings : []);
      setUsers(res.data.users || []);
      setStats({
        total_users: res.data.total_users,
        total_listings: res.data.total_listings,
        approved_listings: res.data.approved_listings,
        disabled_listings: res.data.disabled_listings,
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
    if (tab !== 'users') return;
    setUsersLoading(true);
    const params = new URLSearchParams();
    if (usersSearch.trim()) params.set('search', usersSearch.trim());
    api.get<{ users: User[] }>(`/api/admin/users?${params}`).then((res) => {
      setUsers(res.data.users || []);
    }).catch(() => setUsers([])).finally(() => setUsersLoading(false));
  }, [tab, usersSearch]);

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
    if (!createBookingOpen || !createBookingForm.listing_id) {
      setCreateBookingListingPrice(null);
      setCreateBookingChargeableAmenities([]);
      setCreateBookingAmenityQuantities({});
      return;
    }
    const id = Number(createBookingForm.listing_id);
    if (!Number.isInteger(id)) return;
    api.get<{ price_per_night?: number }>(`/api/listings/${id}`).then((res) => setCreateBookingListingPrice(res.data.price_per_night ?? null)).catch(() => setCreateBookingListingPrice(null));
    api.get<{ amenities: ChargeableAmenity[] }>(`/api/listings/${id}/chargeable-amenities`).then((res) => {
      setCreateBookingChargeableAmenities(res.data.amenities || []);
      setCreateBookingAmenityQuantities({});
    }).catch(() => setCreateBookingChargeableAmenities([]));
  }, [createBookingOpen, createBookingForm.listing_id]);

  useEffect(() => {
    if (tab !== 'content') return;
    api.get<{ landing_youtube_url?: string | null; youtube_video_urls?: VideoEntry[]; youtube_channel_id?: string }>('/api/admin/settings').then((res) => {
      setLandingYoutubeUrl(res.data.landing_youtube_url || '');
      setYoutubeVideoUrls(Array.isArray(res.data.youtube_video_urls) ? res.data.youtube_video_urls : []);
      setYoutubeChannelId(res.data.youtube_channel_id ?? '');
    }).catch(() => { setLandingYoutubeUrl(''); setYoutubeVideoUrls([]); setYoutubeChannelId(''); });
  }, [tab]);

  useEffect(() => {
    if (tab !== 'content') return;
    setCmsSectionsLoading(true);
    api.get<{ sections: CmsSection[] }>('/api/admin/cms/sections').then((res) => {
      const raw = Array.isArray(res.data.sections) ? res.data.sections : [];
      setCmsSections(raw.filter(isValidCmsSection));
    }).catch(() => setCmsSections([])).finally(() => setCmsSectionsLoading(false));
  }, [tab]);

  useEffect(() => {
    if (tab !== 'settings') return;
    api
      .get<{
        booking_fee?: { type: 'service_charge' | 'discount'; kind: 'percent' | 'fixed'; value: number; applies_to?: 'guest' | 'host' } | null;
        booking_fee_by_category?: Record<string, { type: 'service_charge' | 'discount'; kind: 'percent' | 'fixed'; value: number; applies_to?: 'guest' | 'host' }>;
        booking_fee_by_listing?: Record<string, { type: 'service_charge' | 'discount'; kind: 'percent' | 'fixed'; value: number; applies_to?: 'guest' | 'host' }>;
        partial_payment_min_percent?: number;
        payment_gateway_enabled?: boolean;
        payment_npx_enabled?: boolean;
        payment_himalpay_enabled?: boolean;
        offline_booking_guest_message?: string;
        listing_display?: ListingDisplaySettings;
        sparrow_sms?: SparrowSmsSettings;
        notification_settings?: NotificationSettings;
        home_placements?: HomePlacementSettings;
        home_partners?: Record<string, unknown>;
        festivals_page?: FestivalsPageConfig;
        trip_planner_page?: TripPlannerPageConfig;
        email_template_overrides?: Record<string, { subject?: string; innerHtml?: string; bodyText?: string }>;
      }>('/api/admin/settings')
      .then((settingsRes) => {
        const res = settingsRes.data;
        const bf = res.booking_fee ?? null;
        setBookingFee(bf);
        setBookingFeeForm(bf ? { type: bf.type, kind: bf.kind, value: String(bf.value), applies_to: bf.applies_to ?? 'guest' } : { type: 'service_charge', kind: 'percent', value: '', applies_to: 'guest' });
        const minPct = res.partial_payment_min_percent;
        setPartialPaymentMinPercent(typeof minPct === 'number' && minPct >= 1 && minPct <= 100 ? minPct : 25);
        setPaymentGatewayEnabled(res.payment_gateway_enabled !== false);
        setPaymentNpxEnabled(res.payment_npx_enabled !== false);
        setPaymentHimalpayEnabled(res.payment_himalpay_enabled === true);
        setOfflineBookingGuestMessage(typeof res.offline_booking_guest_message === 'string' ? res.offline_booking_guest_message : '');
        setBookingFeeByCategory(res.booking_fee_by_category ?? {});
        setBookingFeeByListing(res.booking_fee_by_listing ?? {});
        const ld = res.listing_display ?? null;
        setListingDisplay(ld);
        const form = ld ? JSON.parse(JSON.stringify(ld)) : null;
        setListingDisplayForm(form);
        setSectionLabelsJson(form?.section_labels ? JSON.stringify(form.section_labels, null, 2) : '{}');
        setSparrowSms(res.sparrow_sms ?? { token: '', from: '' });
        setNotificationSettings(res.notification_settings ?? null);
        {
          const hp = res.home_placements;
          if (hp) {
            const toIds = (arr: unknown) =>
              (Array.isArray(arr) ? arr : [])
                .map((x) => (typeof x === 'number' ? x : parseInt(String(x), 10)))
                .filter((n) => Number.isFinite(n) && n >= 1);
            setHomePlacements({
              ...EMPTY_HOME_PLACEMENTS,
              ...hp,
              hero_carousel_listing_ids: toIds(hp.hero_carousel_listing_ids),
              featured_listing_ids: toIds(hp.featured_listing_ids),
              hero_carousel_price: Number(hp.hero_carousel_price) || 0,
              featured_placement_price: Number(hp.featured_placement_price) || 0,
            });
          } else {
            setHomePlacements(EMPTY_HOME_PLACEMENTS);
          }
        }
        setHomePartnersForm(normalizeHomePartners(res.home_partners));
        setFestivalsPageForm(normalizeFestivalsPage(res.festivals_page ?? EMPTY_FESTIVALS_PAGE()));
        setTripPlannerPageForm(normalizeTripPlannerPage(res.trip_planner_page ?? EMPTY_TRIP_PLANNER_PAGE()));
        setEmailTemplatesMap(
          res.email_template_overrides && typeof res.email_template_overrides === 'object' && !Array.isArray(res.email_template_overrides)
            ? (res.email_template_overrides as Record<string, { subject?: string; innerHtml?: string; bodyText?: string }>)
            : {}
        );
      })
      .catch(() => {
        setBookingFee(null);
        setBookingFeeForm({ type: 'service_charge', kind: 'percent', value: '', applies_to: 'guest' });
        setBookingFeeByCategory({});
        setBookingFeeByListing({});
        setListingDisplay(null);
        setListingDisplayForm(null);
        setSectionLabelsJson('{}');
        setSparrowSms({ token: '', from: '' });
        setNotificationSettings(null);
        setHomePlacements(EMPTY_HOME_PLACEMENTS);
        setHomePartnersForm(EMPTY_HOME_PARTNERS());
        setFestivalsPageForm(EMPTY_FESTIVALS_FORM());
        setTripPlannerPageForm(EMPTY_TRIP_PLANNER_FORM());
        setEmailTemplatesMap({});
      });
  }, [tab]);

  useEffect(() => {
    if (tab !== 'settings') return;
    const o = emailTemplatesMap[emailTemplateKey] ?? {};
    setEmailTemplateSubject(typeof o.subject === 'string' ? o.subject : '');
    setEmailTemplateInnerHtml(typeof o.innerHtml === 'string' ? o.innerHtml : '');
    setEmailTemplateBodyText(typeof o.bodyText === 'string' ? o.bodyText : '');
  }, [tab, emailTemplateKey, emailTemplatesMap]);

  useEffect(() => {
    if (tab !== 'settings') return;
    api
      .get<{ listings: ApprovedListing[] }>('/api/admin/listings/approved')
      .then((r) => setSettingsApprovedListings(r.data?.listings ?? []))
      .catch(() => setSettingsApprovedListings([]));
  }, [tab]);

  useEffect(() => {
    if (tab !== 'settings') return;
    api
      .get<{ listings: LiveListing[] }>('/api/admin/listings/live')
      .then((r) => setHomePlacementLabelListings(r.data?.listings ?? []))
      .catch(() => setHomePlacementLabelListings([]));
  }, [tab]);

  const homePlacementPickerList = useMemo((): ApprovedListing[] => {
    if (settingsApprovedListings.length > 0) return settingsApprovedListings;
    return homePlacementLabelListings
      .filter((l) => l.status === 'approved')
      .map((l) => ({ id: l.id, title: l.title, location: l.location, badge: l.badge ?? null }));
  }, [settingsApprovedListings, homePlacementLabelListings]);

  const homePlacementIdLabel = useMemo(() => {
    const m = new Map<number, string>();
    for (const l of homePlacementLabelListings) m.set(Number(l.id), l.title);
    for (const l of settingsApprovedListings) m.set(Number(l.id), l.title);
    return (id: number) => m.get(Number(id)) ?? `Listing #${id}`;
  }, [homePlacementLabelListings, settingsApprovedListings]);

  // Logs: only fetch when filters are applied (From + To required) to reduce DB load
  useEffect(() => {
    if (tab !== 'logs' || !logsFiltersApplied) return;
    const from = logDateFrom ? `${logDateFrom}T00:00:00.000Z` : undefined;
    const to = logDateTo ? `${logDateTo}T23:59:59.999Z` : undefined;
    if (!from || !to) return;
    const page = logPage;
    const limit = 25;
    const buildQ = (extra: Record<string, string> = {}) => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit), from_date: from, to_date: to });
      Object.entries(extra).forEach(([k, v]) => { if (v) params.set(k, v); });
      return `?${params.toString()}`;
    };
    if (logsSubTab === 'email_sms') {
      const extra: Record<string, string> = {};
      if (logChannel) extra.channel = logChannel;
      if (logSearch.trim()) extra.search = logSearch.trim();
      api.get<{ rows: typeof emailSmsLogRows; total: number }>(`/api/admin/logs/email-sms${buildQ(extra)}`).then((res) => {
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
    } else if (logsSubTab === 'analytics') {
      api.get<typeof analyticsData>(`/api/admin/logs/analytics?from_date=${encodeURIComponent(from)}&to_date=${encodeURIComponent(to)}`).then((res) => {
        setAnalyticsData(res.data);
      }).catch(() => setAnalyticsData(null));
    } else if (logsSubTab === 'heatmap') {
      api
        .get<{ rows: Record<string, unknown>[] }>(`/api/admin/logs/heatmap/page-views?from_date=${encodeURIComponent(from)}&to_date=${encodeURIComponent(to)}&limit=50`)
        .then((res) => {
          const raw = res.data.rows || [];
          setHeatmapPageViews(
            raw.map((row) => ({
              path: String(row.path ?? row.page_or_route ?? ''),
              views: Number(row.views ?? row.cnt ?? row.count ?? 0) || 0,
            }))
          );
        })
        .catch(() => setHeatmapPageViews([]));
      api
        .get<{ rows: Record<string, unknown>[] }>(`/api/admin/logs/heatmap/clicks?from_date=${encodeURIComponent(from)}&to_date=${encodeURIComponent(to)}&limit=200`)
        .then((res) => {
          const raw = res.data.rows || [];
          setHeatmapClicks(
            raw.map((row, i) => ({
              id: Number(row.id ?? i),
              session_id: String(row.session_id ?? ''),
              page_or_route: row.page_or_route != null ? String(row.page_or_route) : null,
              payload: row.payload != null ? String(row.payload) : null,
              created_at: String(row.created_at ?? new Date().toISOString()),
            }))
          );
        })
        .catch(() => setHeatmapClicks([]));
    }
  }, [tab, logsSubTab, logsFiltersApplied, logDateFrom, logDateTo, logPage, logChannel, logSearch, logEventType, logPath, logSource]);

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

  const handleSyncNews = () => {
    setNewsSyncLoading(true);
    api.post<{ count: number }>('/api/admin/news/sync')
      .then((res) => {
        toast({ title: `Synced ${res.data?.count ?? 0} news/blogs from Homestay Khabar.` });
      })
      .catch((err) => toast({ title: err.response?.data?.message || 'Sync failed', variant: 'destructive' }))
      .finally(() => setNewsSyncLoading(false));
  };

  const handleSyncVideos = () => {
    setVideosSyncLoading(true);
    api.post<{ count: number; videos?: VideoEntry[] }>('/api/admin/videos/sync')
      .then((res) => {
        const count = res.data?.count ?? 0;
        if (Array.isArray(res.data?.videos)) setYoutubeVideoUrls(res.data.videos);
        toast({ title: `Synced ${count} videos from YouTube channel.` });
      })
      .catch((err) => toast({ title: err.response?.data?.message || 'Sync failed', variant: 'destructive' }))
      .finally(() => setVideosSyncLoading(false));
  };

  const handleSaveYoutubeChannelId = () => {
    setYoutubeChannelIdSaving(true);
    api.patch('/api/admin/settings', { youtube_channel_id: youtubeChannelId.trim() || '' })
      .then(() => toast({ title: 'YouTube channel ID saved.' }))
      .catch(() => toast({ title: 'Failed to save.', variant: 'destructive' }))
      .finally(() => setYoutubeChannelIdSaving(false));
  };

  const liveListingsFiltered = useMemo(() => {
    let rows = liveListings;
    if (adminLiveListingsFilter === 'disabled') rows = rows.filter((l) => l.status === 'disabled');
    else if (adminLiveListingsFilter === 'enabled') rows = rows.filter((l) => l.status === 'approved');
    return rows;
  }, [liveListings, adminLiveListingsFilter]);

  const handleApprove = (id: number) => {
    setAdminConfirm({
      title: 'Approve this homestay?',
      description: 'Guests will be able to find it and book (subject to your payment settings).',
      action: () => {
        setAdminConfirm(null);
        api.patch(`/api/admin/listings/${id}/approve`).then(() => {
          toast({ title: 'Listing approved.' });
          setPendingListings((list) => list.filter((l) => l.id !== id));
        }).catch(() => toast({ title: 'Failed.', variant: 'destructive' }));
      },
    });
  };

  const handleReject = (id: number) => {
    setAdminConfirm({
      title: 'Reject this listing?',
      description: 'The host will need to submit a new application.',
      action: () => {
        setAdminConfirm(null);
        api.patch(`/api/admin/listings/${id}/reject`, {}).then(() => {
          toast({ title: 'Listing rejected.' });
          setPendingListings((list) => list.filter((l) => l.id !== id));
        }).catch(() => toast({ title: 'Failed.', variant: 'destructive' }));
      },
    });
  };

  const handleBadgeChange = (id: number, badges: string[]) => {
    const value = formatBadges(badges);
    api.patch(`/api/admin/listings/${id}/badge`, { badges })
      .then((res) => {
        toast({ title: 'Badges updated.' });
        const nextBadge = res.data.listing?.badge ?? (value || null);
        setPendingListings((list) => list.map((l) => l.id === id ? { ...l, badge: nextBadge } : l));
        setLiveListings((list) => list.map((l) => l.id === id ? { ...l, badge: nextBadge } : l));
      })
      .catch(() => toast({ title: 'Failed to update badges.', variant: 'destructive' }));
  };

  const handleStatusChange = (id: number, status: 'approved' | 'disabled') => {
    setAdminConfirm({
      title: status === 'disabled' ? 'Disable this homestay?' : 'Enable this homestay?',
      description:
        status === 'disabled'
          ? 'It will be hidden from search and the site until you enable it again.'
          : 'It will become visible to guests again.',
      action: () => {
        setAdminConfirm(null);
        api
          .patch<{ listing?: { status?: string } }>(`/api/admin/listings/${id}/status`, { status })
          .then((res) => {
            toast({ title: status === 'approved' ? 'Listing enabled.' : 'Listing disabled.' });
            setLiveListings((list) =>
              list.map((l) => (l.id === id ? { ...l, status: res.data.listing?.status ?? status } : l))
            );
          })
          .catch(() => toast({ title: 'Failed to update status.', variant: 'destructive' }));
      },
    });
  };

  const handleRoleChange = (userId: number, role: string) => {
    api.patch(`/api/admin/users/${userId}`, { role }).then(() => {
      toast({ title: 'User updated.' });
      setUsers((list) => list.map((u) => u.id === userId ? { ...u, role } : u));
    }).catch(() => toast({ title: 'Failed.', variant: 'destructive' }));
  };

  return (
    <div>
      <Dialog.Root open={!!adminConfirm} onOpenChange={(open) => { if (!open) setAdminConfirm(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content aria-describedby={undefined} className="fixed left-1/2 top-1/2 z-[60] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-primary-200 bg-background p-6 shadow-lg">
            <Dialog.Title className="text-lg font-semibold text-primary-800">{adminConfirm?.title}</Dialog.Title>
            <p className="mt-2 text-sm text-muted-foreground">{adminConfirm?.description}</p>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAdminConfirm(null)}>Cancel</Button>
              <Button type="button" className="bg-accent-500 hover:bg-accent-600" onClick={() => adminConfirm?.action()}>Confirm</Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <h1 className="text-3xl font-bold text-primary-800">Admin dashboard</h1>
      <p className="mt-1 text-muted-foreground">Moderate listings and manage users</p>
      <div className="mt-6 flex flex-wrap gap-2 border-b border-primary-200">
        {ADMIN_TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={`px-4 py-2 font-medium capitalize transition-colors ${tab === t ? 'border-b-2 border-accent-500 text-accent-600' : 'text-muted-foreground hover:text-primary-700'}`}
            onClick={() => {
              setTab(t);
              if (t === 'listings') setAdminLiveListingsFilter('all');
            }}
          >
            {t === 'listings' ? 'Listings' : t === 'corporates' ? 'Corporates' : t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card className="cursor-pointer border-primary-200 transition-shadow hover:shadow-md" onClick={() => { setTab('listings'); setAdminLiveListingsFilter('all'); }}>
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
            <Card className="cursor-pointer border-primary-200 transition-shadow hover:shadow-md" onClick={() => { setTab('listings'); setAdminLiveListingsFilter('enabled'); }}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-full bg-primary-100 p-3">
                  <Home className="h-8 w-8 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-800">{stats.approved_listings ?? '—'}</p>
                  <p className="text-sm text-muted-foreground">Approved listings</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer border-primary-200 transition-shadow hover:shadow-md" onClick={() => { setTab('listings'); setAdminLiveListingsFilter('disabled'); }}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-full bg-primary-100 p-3">
                  <AlertCircle className="h-8 w-8 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-800">{stats.disabled_listings ?? '—'}</p>
                  <p className="text-sm text-muted-foreground">Disabled listings</p>
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
                <Button size="sm" variant="outline" asChild>
                  <Link to="/admin/notifications/send"><Bell className="w-4 h-4 mr-1 inline" />Send notifications</Link>
                </Button>
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
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-accent-500" />
                  <span className="font-semibold text-primary-800 text-lg">Listings</span>
                </div>
                <p className="text-sm text-muted-foreground">Approve or reject new homestay listings</p>
              </div>
              <input
                type="text"
                placeholder="Search by title or ID…"
                value={pendingListingsSearch}
                onChange={(e) => setPendingListingsSearch(e.target.value)}
                className="h-9 w-56 rounded-md border border-primary-200 bg-background px-2 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {pendingListings.filter((l) => !pendingListingsSearch.trim() || l.title.toLowerCase().includes(pendingListingsSearch.toLowerCase()) || String(l.id).includes(pendingListingsSearch)).length === 0 ? (
              <p className="text-muted-foreground">No listings found.</p>
            ) : (
              <div className="space-y-4">
                {pendingListings.filter((l) => !pendingListingsSearch.trim() || l.title.toLowerCase().includes(pendingListingsSearch.toLowerCase()) || String(l.id).includes(pendingListingsSearch)).map((l) => {
                  const currentBadges = parseBadges(l.badge);
                  return (
                  <div key={l.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-primary-200 p-4">
                    <div>
                      <p className="font-medium text-primary-800">{l.title}</p>
                      <p className="text-sm text-muted-foreground">ID: {l.id}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-3 rounded-md border border-primary-200 bg-muted/30 px-2 py-1.5">
                        <span className="text-xs font-medium text-muted-foreground">Badges:</span>
                        {LISTING_BADGES.map((b) => (
                          <label key={b} className="flex cursor-pointer items-center gap-1.5 text-sm">
                            <input type="checkbox" checked={currentBadges.includes(b)} onChange={() => { const next = currentBadges.includes(b) ? currentBadges.filter((x) => x !== b) : [...currentBadges, b]; handleBadgeChange(l.id, next); }} className="rounded border-primary-300" />
                            <span>{b.charAt(0).toUpperCase() + b.slice(1)}</span>
                          </label>
                        ))}
                      </div>
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
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary-200">
          <CardHeader className="border-b border-primary-100 bg-primary-50/50">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-primary-800">Approved & disabled listings</h2>
                <p className="text-sm text-muted-foreground">Enable or disable homestays. Disabled listings are hidden from search and the site. Set badges for approved listings.</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {(['all', 'enabled', 'disabled'] as const).map((f) => (
                    <Button
                      key={f}
                      type="button"
                      size="sm"
                      variant={adminLiveListingsFilter === f ? 'default' : 'outline'}
                      className={adminLiveListingsFilter === f ? 'bg-accent-500 hover:bg-accent-600' : ''}
                      onClick={() => setAdminLiveListingsFilter(f)}
                    >
                      {f === 'all' ? 'All' : f === 'enabled' ? 'Enabled only' : 'Disabled only'}
                    </Button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                placeholder="Search by title, ID or location…"
                value={liveListingsSearch}
                onChange={(e) => setLiveListingsSearch(e.target.value)}
                className="h-9 w-56 rounded-md border border-primary-200 bg-background px-2 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <AdminTable<LiveListing>
              data={liveListingsFiltered.filter((l) => !liveListingsSearch.trim() || l.title.toLowerCase().includes(liveListingsSearch.toLowerCase()) || l.location?.toLowerCase().includes(liveListingsSearch.toLowerCase()) || String(l.id).includes(liveListingsSearch))}
              keyExtractor={(l) => l.id}
              pageSize={15}
              emptyMessage="No approved or disabled listings."
              containerClassName="max-h-[70vh] overflow-y-auto"
              columns={[
                { key: 'id', label: 'ID', sortable: true },
                { key: 'title', label: 'Title', sortable: true },
                { key: 'location', label: 'Location', sortable: true },
                { key: 'status', label: 'Status', sortable: true, render: (l) => <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${l.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground'}`}>{l.status === 'approved' ? 'Enabled' : 'Disabled'}</span> },
                { key: 'badge', label: 'Badges', render: (l) => { const currentBadges = parseBadges(l.badge); return (<div className="flex flex-wrap items-center gap-2">{LISTING_BADGES.map((b) => (<label key={b} className="flex cursor-pointer items-center gap-1 text-sm"><input type="checkbox" checked={currentBadges.includes(b)} disabled={l.status !== 'approved'} onChange={() => { const next = currentBadges.includes(b) ? currentBadges.filter((x) => x !== b) : [...currentBadges, b]; handleBadgeChange(l.id, next); }} className="rounded border-primary-300" /><span>{b.charAt(0).toUpperCase() + b.slice(1)}</span></label>))}</div>); } },
                { key: 'actions', label: 'Actions', render: (l) => (<div className="flex items-center gap-2">{l.status === 'approved' ? (<Button type="button" variant="outline" size="sm" onClick={() => handleStatusChange(l.id, 'disabled')}>Disable</Button>) : (<Button type="button" size="sm" className="bg-accent-500 hover:bg-accent-600" onClick={() => handleStatusChange(l.id, 'approved')}>Enable</Button>)}<Link to={`/admin/listings/${l.id}/edit`} className="text-sm text-primary hover:underline">Edit</Link><Link to={`/listings/${l.id}`} className="text-sm text-primary hover:underline" state={{ from: 'admin' }}>View</Link></div>) },
              ]}
            />
          </CardContent>
        </Card>
        </div>
      )}

      {tab === 'users' && (
        <>
          <Card className="mt-6 border-primary-200">
            <CardHeader className="border-b border-primary-100 bg-primary-50/50">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary-600" />
                    <h2 className="font-semibold text-primary-800">Users</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">Manage users, roles, and block/unblock. Add admin users (they verify OTP on first login).</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone…"
                    value={usersSearch}
                    onChange={(e) => setUsersSearch(e.target.value)}
                    className="h-9 w-56 rounded-md border border-primary-200 bg-background px-2 text-sm"
                  />
                  <Button size="sm" className="bg-accent-500 hover:bg-accent-600" onClick={() => { setAddAdminForm({ name: '', email: '', phone: '', password: '' }); setAddAdminOpen(true); }}>
                    Add admin user
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {usersLoading ? (
                <p className="p-8 text-center text-muted-foreground">Loading users…</p>
              ) : (
                <AdminTable<User>
                  data={users.filter((u) => !usersSearch.trim() || u.name?.toLowerCase().includes(usersSearch.toLowerCase()) || u.email?.toLowerCase().includes(usersSearch.toLowerCase()) || (u.phone && u.phone.includes(usersSearch)))}
                  keyExtractor={(u) => u.id}
                  pageSize={15}
                  emptyMessage="No users found."
                  containerClassName="max-h-[70vh] overflow-y-auto"
                  columns={[
                    { key: 'id', label: 'ID', sortable: true },
                    { key: 'name', label: 'Name', sortable: true },
                    { key: 'email', label: 'Email', sortable: true },
                    { key: 'phone', label: 'Mobile', sortable: true, render: (u) => u.phone ?? '—' },
                    { key: 'created_at', label: 'Created', sortable: true, render: (u) => u.created_at ? formatDateOnly(u.created_at) : '—' },
                    { key: 'role', label: 'Role', sortable: true, render: (u) => (<><span className={`rounded-full px-2 py-1 text-xs font-medium ${u.role === 'admin' ? 'bg-accent-100 text-accent-800' : u.role === 'host' ? 'bg-primary-100 text-primary-800' : 'bg-secondary-200 text-secondary-800'}`}>{u.role === 'admin' ? 'Admin' : u.role === 'host' ? 'Host' : 'Guest'}</span>{u.blocked && <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">Blocked</span>}</>) },
                    { key: 'host_listing_id', label: 'Host listing', render: (u) => u.host_listing_id != null && u.host_listing_title != null ? <span title={u.host_listing_title ?? ''}>#{u.host_listing_id} – {u.host_listing_title}</span> : '—' },
                    { key: 'change_role', label: 'Change role', render: (u) => (<select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)} className="rounded-md border border-primary-200 bg-background px-2 py-1.5 text-sm"><option value="guest">Guest</option><option value="host">Host</option><option value="admin">Admin</option></select>) },
                    {
                      key: 'actions',
                      label: 'Actions',
                      render: (u) => (
                        <div className="flex flex-wrap items-center gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => setSelectedUserDetail(u)}>
                            View detail
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            title={!u.email?.trim() ? 'User has no email' : undefined}
                            disabled={!u.email?.trim()}
                            onClick={() => setUserResetPwId(u.id)}
                          >
                            Reset password
                          </Button>
                          {u.blocked ? (
                            <Button
                              type="button"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() =>
                                api
                                  .patch(`/api/admin/users/${u.id}/block`, { blocked: false })
                                  .then(() => {
                                    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, blocked: false } : x)));
                                    toast({ title: 'User unblocked.' });
                                  })
                                  .catch((err) => toast({ title: err.response?.data?.message || 'Failed', variant: 'destructive' }))
                              }
                            >
                              Unblock
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                api
                                  .patch(`/api/admin/users/${u.id}/block`, { blocked: true })
                                  .then(() => {
                                    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, blocked: true } : x)));
                                    toast({ title: 'User blocked.' });
                                  })
                                  .catch((err) => toast({ title: err.response?.data?.message || 'Failed', variant: 'destructive' }))
                              }
                            >
                              Block
                            </Button>
                          )}
                        </div>
                      ),
                    },
                  ]}
                />
              )}
            </CardContent>
          </Card>

          <Dialog.Root open={!!selectedUserDetail} onOpenChange={(open) => !open && setSelectedUserDetail(null)}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50" />
              <Dialog.Content aria-describedby={undefined} className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-primary-200 bg-background p-6 shadow-lg">
                <Dialog.Title className="text-lg font-semibold text-primary-800">User detail</Dialog.Title>
                {selectedUserDetail && (
                  <div className="mt-4 space-y-2 text-sm">
                    <p><span className="font-medium text-muted-foreground">ID:</span> {selectedUserDetail.id}</p>
                    <p><span className="font-medium text-muted-foreground">Name:</span> {selectedUserDetail.name}</p>
                    <p><span className="font-medium text-muted-foreground">Email:</span> {selectedUserDetail.email}</p>
                    <p><span className="font-medium text-muted-foreground">Mobile:</span> {selectedUserDetail.phone ?? '—'}</p>
                    <p><span className="font-medium text-muted-foreground">Role:</span> {selectedUserDetail.role === 'admin' ? 'Admin' : selectedUserDetail.role === 'host' ? 'Host' : 'Guest'}</p>
                    <p><span className="font-medium text-muted-foreground">Created:</span> {selectedUserDetail.created_at ? formatDateOnly(selectedUserDetail.created_at) : '—'}</p>
                    {selectedUserDetail.blocked && <p className="text-red-600 font-medium">Blocked</p>}
                  </div>
                )}
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" onClick={() => setSelectedUserDetail(null)}>Close</Button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          <Dialog.Root open={userResetPwId !== null} onOpenChange={(open) => !open && setUserResetPwId(null)}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50" />
              <Dialog.Content aria-describedby={undefined} className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-primary-200 bg-background p-6 shadow-lg">
                <Dialog.Title className="text-lg font-semibold text-primary-800">Reset user password</Dialog.Title>
                <p className="mt-2 text-sm text-muted-foreground">
                  A strong temporary password will be emailed to the user. They must choose a new password the next time they sign in.
                </p>
                {userResetPwId != null && (
                  <p className="mt-3 text-sm">
                    <span className="font-medium text-primary-800">{users.find((x) => x.id === userResetPwId)?.name ?? 'User'}</span>
                    {' · '}
                    <span className="text-muted-foreground">{users.find((x) => x.id === userResetPwId)?.email}</span>
                  </p>
                )}
                <div className="mt-6 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setUserResetPwId(null)} disabled={userResetPwSaving}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="bg-accent-500 hover:bg-accent-600"
                    disabled={userResetPwId == null || userResetPwSaving}
                    onClick={() => {
                      if (userResetPwId == null) return;
                      setUserResetPwSaving(true);
                      api
                        .post(`/api/admin/users/${userResetPwId}/reset-password`)
                        .then((res) => {
                          toast({ title: res.data?.message || 'Password reset email sent.' });
                          setUserResetPwId(null);
                        })
                        .catch((err) => toast({ title: err.response?.data?.message || 'Failed to reset password.', variant: 'destructive' }))
                        .finally(() => setUserResetPwSaving(false));
                    }}
                  >
                    {userResetPwSaving ? 'Sending…' : 'Send reset email'}
                  </Button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          <Dialog.Root open={addAdminOpen} onOpenChange={setAddAdminOpen}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50" />
              <Dialog.Content aria-describedby={undefined} className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-primary-200 bg-background p-6 shadow-lg">
                <Dialog.Title className="text-lg font-semibold text-primary-800">Add admin user</Dialog.Title>
                <p className="mt-1 text-sm text-muted-foreground">New admin will need to verify OTP on first login.</p>
                <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); if (!addAdminForm.name.trim() || !addAdminForm.email.trim() || !addAdminForm.password) { toast({ title: 'Name, email and password required.', variant: 'destructive' }); return; } setAddAdminSaving(true); api.post('/api/admin/users', { name: addAdminForm.name.trim(), email: addAdminForm.email.trim(), phone: addAdminForm.phone.trim() || undefined, password: addAdminForm.password }).then(() => { toast({ title: 'Admin user created.' }); setAddAdminOpen(false); setAddAdminForm({ name: '', email: '', phone: '', password: '' }); const params = new URLSearchParams(); if (usersSearch.trim()) params.set('search', usersSearch.trim()); return api.get<{ users: User[] }>(`/api/admin/users?${params}`); }).then((r) => { if (r?.data?.users) setUsers(r.data.users); }).catch((err) => toast({ title: err.response?.data?.message || 'Failed to create admin.', variant: 'destructive' })).finally(() => setAddAdminSaving(false)); }}>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Name *</label>
                    <input type="text" value={addAdminForm.name} onChange={(e) => setAddAdminForm((f) => ({ ...f, name: e.target.value }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Email *</label>
                    <input type="email" value={addAdminForm.email} onChange={(e) => setAddAdminForm((f) => ({ ...f, email: e.target.value }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Phone (optional)</label>
                    <input type="text" value={addAdminForm.phone} onChange={(e) => setAddAdminForm((f) => ({ ...f, phone: e.target.value }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Password *</label>
                    <PasswordInput value={addAdminForm.password} onChange={(e) => setAddAdminForm((f) => ({ ...f, password: e.target.value }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" required />
                    <p className="mt-1 text-xs text-muted-foreground">Min 8 chars, uppercase, lowercase, number, special character.</p>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setAddAdminOpen(false)}>Cancel</Button>
                    <Button type="submit" className="bg-accent-500 hover:bg-accent-600" disabled={addAdminSaving}>{addAdminSaving ? 'Creating…' : 'Create admin'}</Button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </>
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
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Search guest or listing…"
                  value={adminBookingsSearch}
                  onChange={(e) => setAdminBookingsSearch(e.target.value)}
                  className="h-9 w-48 rounded-md border border-primary-200 bg-background px-2 text-sm"
                />
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
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <AdminTable<AdminBooking>
              data={adminBookings.filter((b) => !adminBookingsSearch.trim() || (b.guest_name && b.guest_name.toLowerCase().includes(adminBookingsSearch.toLowerCase())) || (b.listing_title && b.listing_title.toLowerCase().includes(adminBookingsSearch.toLowerCase())))}
              keyExtractor={(b) => b.id}
              noPagination
              emptyMessage="No bookings found."
              containerClassName="max-h-[70vh] overflow-y-auto"
              columns={[
                { key: 'id', label: 'ID', sortable: true },
                { key: 'listing_title', label: 'Listing', sortable: true },
                { key: 'guest_name', label: 'Guest', sortable: true },
                { key: 'corporate_name', label: 'Corporate', render: (b) => b.corporate_name || '—' },
                { key: 'dates', label: 'Dates', sortValue: (b) => b.check_in, render: (b) => `${formatDateOnly(b.check_in)} – ${formatDateOnly(b.check_out)}` },
                { key: 'status', label: 'Status', sortable: true, render: (b) => <span className={`rounded-full px-2 py-1 text-xs font-medium ${bookingStatusColor(b.status)}`}>{b.status}</span> },
                { key: 'payment_provider', label: 'Online pay', render: (b) => formatBookingPaymentMethod(b.payment_provider) },
                { key: 'actions', label: 'Actions', render: (b) => <Button variant="outline" size="sm" onClick={() => setSelectedBooking(b)}>View booking details</Button> },
              ]}
            />
            {adminBookingsTotal > 0 && (
              <p className="border-t border-primary-200 px-4 py-2 text-sm text-muted-foreground">{adminBookingsTotal} total</p>
            )}
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
              <Button size="sm" className="bg-accent-500 hover:bg-accent-600" onClick={() => { setCreateBookingForm({ corporate_id: '', listing_id: '', guest_id: '', guest_names: '', check_in: '', check_out: '', guests: '1', message: '' }); setCreateBookingListingPrice(null); setCreateBookingChargeableAmenities([]); setCreateBookingAmenityQuantities({}); setCreateBookingOpen(true); }}>
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
              <AdminTable<Corporate>
                data={corporates.filter((c) => !corporatesSearch.trim() || c.name?.toLowerCase().includes(corporatesSearch.toLowerCase()) || c.contact_email?.toLowerCase().includes(corporatesSearch.toLowerCase()))}
                keyExtractor={(c) => c.id}
                pageSize={15}
                emptyMessage="No corporates found. Add one to start recording corporate bookings."
                containerClassName="max-h-[70vh] overflow-y-auto"
                columns={[
                  { key: 'name', label: 'Name', sortable: true },
                  { key: 'status', label: 'Status', sortable: true, render: (c) => <span className="rounded-full px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800">{c.status}</span> },
                  { key: 'contact', label: 'Contact', render: (c) => `${c.contact_name || '—'} ${c.contact_email ? `(${c.contact_email})` : ''}` },
                  { key: 'billing_method', label: 'Billing', render: (c) => c.billing_method || '—' },
                  { key: 'max_nightly_rate', label: 'Max rate', sortValue: (c) => c.max_nightly_rate ?? 0, render: (c) => c.max_nightly_rate != null ? `NPR ${Number(c.max_nightly_rate).toLocaleString()}` : '—' },
                  { key: 'actions', label: 'Actions', render: (c) => <Button variant="outline" size="sm" onClick={() => { setEditingCorporate(c); setCorporateForm({ name: c.name, status: c.status, contact_name: c.contact_name ?? '', contact_email: c.contact_email ?? '', contact_phone: c.contact_phone ?? '', billing_method: c.billing_method ?? '', approval_required: c.approval_required, max_nightly_rate: c.max_nightly_rate, notes: c.notes ?? '' }); setCorporateFormOpen(true); }}>Edit</Button> },
                ]}
              />
            </CardContent>
          </Card>

          {/* Create/Edit Corporate dialog */}
          <Dialog.Root open={corporateFormOpen} onOpenChange={(open) => { setCorporateFormOpen(open); if (!open) setEditingCorporate(null); }}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50" />
              <Dialog.Content aria-describedby={undefined} className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-primary-200 bg-background p-6 shadow-lg">
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
              <Dialog.Content aria-describedby={undefined} className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-primary-200 bg-background p-6 shadow-lg">
                <Dialog.Title className="text-lg font-semibold text-primary-800">Create corporate booking</Dialog.Title>
                <p className="mt-1 text-sm text-muted-foreground">Add guest names (one per line or comma-separated) or upload CSV. Number of guests and total price are calculated from the list.</p>
                <form className="mt-4 space-y-3" onSubmit={(e) => {
                  e.preventDefault();
                  const listing_id = Number(createBookingForm.listing_id);
                  if (!listing_id || !createBookingForm.check_in || !createBookingForm.check_out) { toast({ title: 'Please select listing and dates.', variant: 'destructive' }); return; }
                  const raw = createBookingForm.guest_names.trim().replace(/\r\n/g, '\n').split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
                  const guestCount = raw.length >= 1 ? raw.length : Math.max(1, parseInt(createBookingForm.guests, 10) || 1);
                  const useGuestNames = raw.length >= 1;
                  if (useGuestNames && guestCount !== raw.length) { toast({ title: 'Guest names count mismatch.', variant: 'destructive' }); return; }
                  if (!useGuestNames && !createBookingForm.guest_id) { toast({ title: 'Add guest names or select a primary guest (user).', variant: 'destructive' }); return; }
                  setCreateBookingSaving(true);
                  const amenitiesPayload = createBookingChargeableAmenities
                    .filter((a) => (createBookingAmenityQuantities[a.id] ?? 0) > 0)
                    .map((a) => ({ id: a.id, quantity: createBookingAmenityQuantities[a.id] ?? 0 }));
                  const payload = {
                    listing_id,
                    check_in: createBookingForm.check_in,
                    check_out: createBookingForm.check_out,
                    guests: guestCount,
                    message: createBookingForm.message || undefined,
                    corporate_id: createBookingForm.corporate_id ? Number(createBookingForm.corporate_id) : null,
                    ...(useGuestNames ? { guest_names: raw.join('\n'), guest_id: null } : { guest_id: Number(createBookingForm.guest_id) }),
                    ...(amenitiesPayload.length > 0 ? { amenities: amenitiesPayload } : {}),
                  };
                  api.post('/api/admin/bookings/corporate', payload).then(() => {
                    toast({ title: 'Booking created (approved).' });
                    setCreateBookingOpen(false);
                    setCreateBookingChargeableAmenities([]);
                    setCreateBookingAmenityQuantities({});
                    const params = new URLSearchParams();
                    if (adminBookingsStatus) params.set('status', adminBookingsStatus);
                    api.get<{ bookings: AdminBooking[]; total: number }>(`/api/admin/bookings?${params}`).then((r) => { setAdminBookings(r.data.bookings || []); setAdminBookingsTotal(r.data.total ?? 0); }).catch(() => {});
                  }).catch((err) => toast({ title: err.response?.data?.message || 'Failed to create booking.', variant: 'destructive' })).finally(() => setCreateBookingSaving(false));
                }}>
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
                    <label className="block text-sm font-medium text-primary-700">Guest names (one per line or comma-separated)</label>
                    <textarea value={createBookingForm.guest_names} onChange={(e) => setCreateBookingForm((f) => ({ ...f, guest_names: e.target.value }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" rows={4} placeholder={'e.g. Ram Sharma\nSita Rai\nOr: Ram Sharma, Sita Rai'} />
                    <p className="mt-1 text-xs text-muted-foreground">Or upload CSV/txt (one name per line or comma-separated)</p>
                    <input type="file" accept=".csv,.txt" className="mt-1 block w-full text-sm text-muted-foreground file:mr-2 file:rounded-md file:border-0 file:bg-primary-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-800 hover:file:bg-primary-200" onChange={(ev) => { const f = ev.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => { const text = (r.result as string) || ''; const lines = text.replace(/\r\n/g, '\n').split(/[\n,]/).map((s) => s.trim()).filter(Boolean); setCreateBookingForm((prev) => ({ ...prev, guest_names: lines.join('\n') })); }; r.readAsText(f); ev.target.value = ''; }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Primary guest (user) — only if not using guest names above</label>
                    <select value={createBookingForm.guest_id} onChange={(e) => setCreateBookingForm((f) => ({ ...f, guest_id: e.target.value }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm">
                      <option value="">— None (use guest names list) —</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative" ref={createBookingCalendarRef}>
                    <button
                      type="button"
                      onClick={() => setCreateBookingCalendarOpen((v) => !v)}
                      className="grid grid-cols-2 gap-3 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-left hover:bg-primary-50/50 transition-colors"
                      aria-expanded={createBookingCalendarOpen}
                    >
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground">Check-in *</label>
                        <span className="text-sm text-primary-800">
                          {createBookingForm.check_in
                            ? new Date(createBookingForm.check_in + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                            : 'Add date'}
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground">Check-out *</label>
                        <span className="text-sm text-primary-800">
                          {createBookingForm.check_out
                            ? new Date(createBookingForm.check_out + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                            : 'Add date'}
                        </span>
                      </div>
                    </button>
                    {createBookingCalendarOpen && (
                      <div className="absolute right-0 z-[100] mt-1 bg-card border border-primary-200 rounded-xl shadow-xl p-3 calendar-popup">
                        <DateRangePicker
                          checkIn={createBookingForm.check_in}
                          checkOut={createBookingForm.check_out}
                          onCheckInChange={(v) => setCreateBookingForm((f) => ({ ...f, check_in: v }))}
                          onCheckOutChange={(v) => {
                            setCreateBookingForm((f) => ({ ...f, check_out: v }));
                            if (v) setCreateBookingCalendarOpen(false);
                          }}
                        />
                      </div>
                    )}
                  </div>
                  {createBookingForm.listing_id && (
                    <div>
                      <label className="block text-sm font-medium text-primary-700">Chargeable amenities (optional)</label>
                      <p className="mt-0.5 text-xs text-muted-foreground">Add optional add-ons; charges will appear on the invoice.</p>
                      {createBookingChargeableAmenities.length > 0 ? (
                        <div className="mt-2 space-y-2 rounded-lg border border-primary-200 bg-primary-50/30 p-3">
                          {createBookingChargeableAmenities.map((a) => (
                            <div key={a.id} className="flex items-center justify-between gap-4">
                              <span className="text-sm text-primary-800">{a.name} — NPR {Number(a.price_npr).toLocaleString()}{a.charge_type === 'per_night' ? ' / night' : ' (one-time)'}</span>
                              <input
                                type="number"
                                min={0}
                                value={createBookingAmenityQuantities[a.id] ?? 0}
                                onChange={(e) => setCreateBookingAmenityQuantities((prev) => ({ ...prev, [a.id]: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                                className="w-20 rounded-md border border-primary-200 bg-background px-2 py-1 text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-2 rounded-lg border border-dashed border-primary-200 bg-primary-50/20 p-3">
                          <p className="text-sm text-muted-foreground mb-2">No chargeable amenities for this listing. Add one:</p>
                          <div className="flex flex-wrap items-end gap-2">
                            <input type="text" placeholder="Name (e.g. Community hall)" value={addAmenityForm.name} onChange={(e) => setAddAmenityForm((f) => ({ ...f, name: e.target.value }))} className="rounded-md border border-primary-200 bg-background px-2 py-1.5 text-sm w-40" />
                            <input type="number" min={0} step={0.01} placeholder="Price NPR" value={addAmenityForm.price_npr} onChange={(e) => setAddAmenityForm((f) => ({ ...f, price_npr: e.target.value }))} className="rounded-md border border-primary-200 bg-background px-2 py-1.5 text-sm w-24" />
                            <select value={addAmenityForm.charge_type} onChange={(e) => setAddAmenityForm((f) => ({ ...f, charge_type: e.target.value as 'per_night' | 'one_time' }))} className="rounded-md border border-primary-200 bg-background px-2 py-1.5 text-sm">
                              <option value="one_time">One-time</option>
                              <option value="per_night">Per night</option>
                            </select>
                            <Button type="button" size="sm" variant="outline" disabled={addAmenitySaving || !addAmenityForm.name.trim() || !Number(addAmenityForm.price_npr)} onClick={() => {
                              const lid = Number(createBookingForm.listing_id);
                              if (!lid) return;
                              setAddAmenitySaving(true);
                              api.post(`/api/admin/listings/${lid}/chargeable-amenities`, { name: addAmenityForm.name.trim(), price_npr: Number(addAmenityForm.price_npr), charge_type: addAmenityForm.charge_type }).then(() => {
                                setAddAmenityForm({ name: '', price_npr: '', charge_type: 'one_time' });
                                return api.get<{ amenities: ChargeableAmenity[] }>(`/api/listings/${lid}/chargeable-amenities`);
                              }).then((res) => {
                                setCreateBookingChargeableAmenities(res.data.amenities || []);
                                toast({ title: 'Chargeable amenity added.' });
                              }).catch((err) => toast({ title: err.response?.data?.message || 'Failed to add amenity', variant: 'destructive' })).finally(() => setAddAmenitySaving(false));
                            }}>{addAmenitySaving ? 'Adding…' : 'Add'}</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {(() => {
                    const raw = createBookingForm.guest_names.trim().replace(/\r\n/g, '\n').split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
                    const guests = raw.length >= 1 ? raw.length : Math.max(1, parseInt(createBookingForm.guests, 10) || 1);
                    const nights = createBookingForm.check_in && createBookingForm.check_out
                      ? Math.max(0, Math.ceil((new Date(createBookingForm.check_out).getTime() - new Date(createBookingForm.check_in).getTime()) / (24 * 60 * 60 * 1000)))
                      : 0;
                    const pricePerNight = createBookingListingPrice ?? 0;
                    const subtotal = nights * pricePerNight * guests;
                    let amenityTotal = 0;
                    createBookingChargeableAmenities.forEach((a) => {
                      const qty = createBookingAmenityQuantities[a.id] ?? 0;
                      if (qty <= 0) return;
                      if (a.charge_type === 'per_night') amenityTotal += qty * nights * Number(a.price_npr);
                      else amenityTotal += qty * Number(a.price_npr);
                    });
                    amenityTotal = Math.round(amenityTotal * 100) / 100;
                    const total = Math.round((subtotal + amenityTotal) * 100) / 100;
                    return (
                      <div className="rounded-lg border border-primary-200 bg-primary-50/50 p-3 text-sm">
                        <p><span className="font-medium text-muted-foreground">Number of guests:</span> {guests}{raw.length >= 1 ? ` (from ${raw.length} name(s))` : ''}</p>
                        {nights > 0 && <p><span className="font-medium text-muted-foreground">Nights:</span> {nights}</p>}
                        {nights > 0 && pricePerNight > 0 && <p><span className="font-medium text-muted-foreground">Accommodation subtotal (NPR):</span> {subtotal.toLocaleString()} ({pricePerNight.toLocaleString()} × {nights} × {guests})</p>}
                        {amenityTotal > 0 && <p><span className="font-medium text-muted-foreground">Amenities (NPR):</span> {amenityTotal.toLocaleString()}</p>}
                        {total > 0 && <p className="font-semibold text-primary-800"><span className="font-medium text-muted-foreground">Total (NPR):</span> {total.toLocaleString()}</p>}
                      </div>
                    );
                  })()}
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
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-accent-500" />
                  <h2 className="font-semibold text-primary-800">Payment management</h2>
                </div>
                <p className="text-sm text-muted-foreground">Track payments and reconciliation ({adminPaymentsTotal} total)</p>
              </div>
              <input
                type="text"
                placeholder="Search guest or listing…"
                value={adminPaymentsSearch}
                onChange={(e) => setAdminPaymentsSearch(e.target.value)}
                className="h-9 w-48 rounded-md border border-primary-200 bg-background px-2 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <AdminTable<AdminPayment>
              data={adminPayments.filter((p) => !adminPaymentsSearch.trim() || (p.guest_name && p.guest_name.toLowerCase().includes(adminPaymentsSearch.toLowerCase())) || (p.listing_title && p.listing_title.toLowerCase().includes(adminPaymentsSearch.toLowerCase())))}
              keyExtractor={(p) => p.id}
              noPagination
              emptyMessage="No payments yet."
              containerClassName="max-h-[70vh] overflow-y-auto"
              columns={[
                { key: 'id', label: 'ID', sortable: true },
                { key: 'booking_id', label: 'Booking', sortable: true },
                { key: 'listing_title', label: 'Listing', sortable: true },
                { key: 'guest_name', label: 'Guest', sortable: true },
                { key: 'amount', label: 'Amount', sortable: true, render: (p) => <span className="font-medium text-accent-600">NPR {Number(p.amount).toLocaleString()}</span> },
                { key: 'service_charge', label: 'Service charge', render: (p) => `NPR ${Number(p.service_charge ?? 0).toLocaleString()}` },
                { key: 'payment_provider', label: 'Method', render: (p) => formatBookingPaymentMethod(p.payment_provider) },
                { key: 'status', label: 'Status', sortable: true, render: (p) => <span className={`rounded-full px-2 py-1 text-xs font-medium ${p.status === 'succeeded' ? 'bg-green-100 text-green-800' : 'bg-secondary-200 text-secondary-800'}`}>{p.status}</span> },
                { key: 'created_at', label: 'Date', sortable: true, render: (p) => formatDateOnly(p.created_at) },
                { key: 'actions', label: 'Receipt', render: (p) => <Button variant="outline" size="sm" onClick={() => setSelectedPayment(p)}>View transaction receipt</Button> },
              ]}
            />
          </CardContent>
        </Card>
      )}

      {tab === 'reports' && (
        <Card className="mt-6 border-primary-200">
          <CardHeader className="border-b border-primary-100 bg-primary-50/50">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-accent-500" />
                  <h2 className="font-semibold text-primary-800">Reports & analytics</h2>
                </div>
                <p className="text-sm text-muted-foreground">Booking and payment details</p>
              </div>
              <input
                type="text"
                placeholder="Search guest or listing…"
                value={reportsSearch}
                onChange={(e) => setReportsSearch(e.target.value)}
                className="h-9 w-48 rounded-md border border-primary-200 bg-background px-2 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <AdminTable<AdminBooking>
              data={adminBookings.filter((b) => !reportsSearch.trim() || (b.guest_name && b.guest_name.toLowerCase().includes(reportsSearch.toLowerCase())) || (b.listing_title && b.listing_title.toLowerCase().includes(reportsSearch.toLowerCase())))}
              keyExtractor={(b) => b.id}
              pageSize={20}
              emptyMessage="No booking records. Switch to Bookings tab to load data, or data will load when you open Reports."
              containerClassName="max-h-[70vh] overflow-y-auto"
              columns={[
                { key: 'id', label: 'Booking ID', sortable: true },
                { key: 'listing_title', label: 'Listing', sortable: true },
                { key: 'guest_name', label: 'Guest', sortable: true },
                { key: 'check_in', label: 'Check-in', sortable: true, render: (b) => formatDateOnly(b.check_in) },
                { key: 'check_out', label: 'Check-out', sortable: true, render: (b) => formatDateOnly(b.check_out) },
                { key: 'guests', label: 'Guests', sortable: true },
                { key: 'status', label: 'Status', sortable: true, render: (b) => <span className={`rounded-full px-2 py-1 text-xs font-medium ${bookingStatusColor(b.status)}`}>{b.status}</span> },
                { key: 'payment_provider', label: 'Online pay', render: (b) => formatBookingPaymentMethod(b.payment_provider) },
                { key: 'created_at', label: 'Created', sortable: true, render: (b) => formatDateOnly(b.created_at) },
              ]}
            />
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
                <Newspaper className="h-5 w-5 text-accent-500" />
                <h2 className="font-semibold text-primary-800">Blogs & News</h2>
              </div>
              <p className="text-sm text-muted-foreground">Blogs and news are fetched from Homestay Khabar. Click Sync to pull the latest articles and save them; the homepage Blogs section will show these synced items.</p>
            </CardHeader>
            <CardContent className="p-6">
              <Button type="button" size="sm" className="bg-accent-500 hover:bg-accent-600" disabled={newsSyncLoading} onClick={handleSyncNews}>
                {newsSyncLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                {newsSyncLoading ? 'Syncing…' : 'Sync news & blogs'}
              </Button>
            </CardContent>
          </Card>
          <Card className="border-primary-200">
            <CardHeader className="border-b border-primary-100 bg-primary-50/50">
              <div className="flex items-center gap-2">
                <Youtube className="h-5 w-5 text-accent-500" />
                <h2 className="font-semibold text-primary-800">YouTube video gallery (Video Stories)</h2>
              </div>
              <p className="text-sm text-muted-foreground">Video URLs shown on the homepage &quot;Video Stories&quot; section and on the View all videos page. Set the channel URL or ID below (default: Homestay Khabar) and click &quot;Sync videos&quot; to pull latest videos (no API key), or add URLs manually.</p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-wrap items-end gap-3 p-3 rounded-lg bg-primary-50/50 border border-primary-100">
                <div className="min-w-[200px] flex-1">
                  <label htmlFor="youtube-channel-id" className="block text-sm font-medium text-primary-800">YouTube channel URL or ID</label>
                  <input
                    id="youtube-channel-id"
                    type="text"
                    value={youtubeChannelId}
                    onChange={(e) => setYoutubeChannelId(e.target.value)}
                    placeholder="https://www.youtube.com/@homestaykhabar"
                    className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm"
                  />
                </div>
                <Button type="button" size="sm" variant="outline" disabled={youtubeChannelIdSaving} onClick={handleSaveYoutubeChannelId}>
                  {youtubeChannelIdSaving ? 'Saving…' : 'Save channel'}
                </Button>
                <Button type="button" size="sm" className="bg-accent-500 hover:bg-accent-600" disabled={videosSyncLoading} onClick={handleSyncVideos}>
                  {videosSyncLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  {videosSyncLoading ? 'Syncing…' : 'Sync videos from channel'}
                </Button>
              </div>
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
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-accent-500" />
                    <h2 className="font-semibold text-primary-800">CMS sections</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">Edit About Us, Privacy Policy, Terms, FAQs, Help Center, Safety, Cancellation, Address, Contact, and other footer/page content. Set display place (e.g. footer, page) and sort order.</p>
                </div>
                <input
                  type="text"
                  placeholder="Search by key or title…"
                  value={cmsSearch}
                  onChange={(e) => setCmsSearch(e.target.value)}
                  className="h-9 w-48 rounded-md border border-primary-200 bg-background px-2 text-sm"
                />
              </div>
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
              ) : filteredCmsSections.length === 0 ? (
                <p className="p-6 text-center text-muted-foreground">
                  {cmsSections.filter(isValidCmsSection).length === 0
                    ? 'No CMS sections yet. Add one above or they may be seeded in the database.'
                    : 'No sections match your search.'}
                </p>
              ) : (
                <ul className="space-y-2">
                  {filteredCmsSections.map((s) => (
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
                <Dialog.Content aria-describedby={undefined} className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-lg border border-primary-200 bg-background p-6 shadow-lg">
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
                            const fromApi = res.data.section;
                            const next: CmsSection = isValidCmsSection(fromApi)
                              ? fromApi
                              : {
                                  ...editingCmsSection,
                                  section_key: payload.section_key,
                                  title: payload.title,
                                  content: payload.content,
                                  display_place: payload.display_place,
                                  sort_order: payload.sort_order,
                                };
                            setCmsSections((prev) => prev.map((x) => (x.id === editingCmsSection.id ? next : x)));
                            toast({ title: 'Section updated.' });
                            setEditingCmsSection(null);
                            setCmsSectionForm({ section_key: '', title: '', content: '', display_place: 'footer', sort_order: 0 });
                          })
                          .catch(() => toast({ title: 'Failed to update.', variant: 'destructive' }))
                          .finally(() => setCmsSectionSaving(false));
                      } else {
                        api
                          .post('/api/admin/cms/sections', payload)
                          .then(async (res) => {
                            const created = res.data.section;
                            if (isValidCmsSection(created)) {
                              setCmsSections((prev) => [...prev, created].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id));
                            } else {
                              try {
                                const list = await api.get<{ sections: CmsSection[] }>('/api/admin/cms/sections');
                                const raw = Array.isArray(list.data.sections) ? list.data.sections : [];
                                setCmsSections(raw.filter(isValidCmsSection));
                              } catch {
                                toast({ title: 'Section may have been created but the list could not be refreshed.', variant: 'destructive' });
                                setCmsSectionSaving(false);
                                return;
                              }
                            }
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
                <h2 className="font-semibold text-primary-800">Default booking fee (service charge or discount)</h2>
              </div>
              <p className="text-sm text-muted-foreground">Default applied when no category or listing-specific rule matches. Add a service charge (e.g. 5%) or discount (e.g. 10% or fixed). Leave value empty for no fee.</p>
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

          {/* Service charge by category (homestay category) */}
          <Card className="border-primary-200">
            <CardHeader className="border-b border-primary-100 bg-primary-50/50">
              <h2 className="font-semibold text-primary-800">Service charge by category</h2>
              <p className="text-sm text-muted-foreground">Assign a service charge or discount to all homestays in a category (e.g. Rural 5%, Eco 10%). Overrides the default above. Uses the same homestay categories as listings: Rural, Urban, Eco, Cultural, Farmstay.</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {Object.entries(bookingFeeByCategory).map(([category, fee]) => {
                  const categoryOptions = [...new Set([...HOMESTAY_CATEGORIES, category as string].filter(Boolean))];
                  return (
                  <div key={category || '__empty__'} className="flex flex-wrap items-end gap-2 rounded-lg border border-border p-3">
                    <div className="min-w-[140px]">
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">Category</label>
                      <select
                        value={category}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === category) return;
                          setBookingFeeByCategory((prev) => {
                            const next = { ...prev };
                            delete next[category];
                            if (v) next[v] = fee;
                            return next;
                          });
                        }}
                        className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-2 text-sm"
                      >
                        <option value="">Select category…</option>
                        {categoryOptions.map((c) => (
                          <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <select value={fee.type} onChange={(e) => setBookingFeeByCategory((prev) => ({ ...prev, [category]: { ...prev[category], type: e.target.value as 'service_charge' | 'discount' } }))} className="h-9 rounded-md border border-primary-200 bg-background px-2 text-sm">
                      <option value="service_charge">Service charge</option>
                      <option value="discount">Discount</option>
                    </select>
                    <select value={fee.kind} onChange={(e) => setBookingFeeByCategory((prev) => ({ ...prev, [category]: { ...prev[category], kind: e.target.value as 'percent' | 'fixed' } }))} className="h-9 rounded-md border border-primary-200 bg-background px-2 text-sm">
                      <option value="percent">%</option>
                      <option value="fixed">NPR flat</option>
                    </select>
                    <input type="number" min={0} step={fee.kind === 'percent' ? 0.5 : 1} value={fee.value} onChange={(e) => setBookingFeeByCategory((prev) => ({ ...prev, [category]: { ...prev[category], value: Number(e.target.value) || 0 } }))} className="h-9 w-20 rounded-md border border-primary-200 bg-background px-2 text-sm" />
                    {fee.type === 'service_charge' && (
                      <select value={fee.applies_to ?? 'guest'} onChange={(e) => setBookingFeeByCategory((prev) => ({ ...prev, [category]: { ...prev[category], applies_to: e.target.value as 'guest' | 'host' } }))} className="h-9 rounded-md border border-primary-200 bg-background px-2 text-sm">
                        <option value="guest">Guest</option>
                        <option value="host">Host</option>
                      </select>
                    )}
                    <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setBookingFeeByCategory((prev) => { const next = { ...prev }; delete next[category]; return next; })}>Remove</Button>
                  </div>
                  );
                })}
                <Button type="button" variant="outline" size="sm" onClick={() => setBookingFeeByCategory((prev) => ({ ...prev, ['']: { type: 'service_charge', kind: 'percent', value: 0, applies_to: 'guest' } }))}>Add category rule</Button>
              </div>
              <Button className="mt-4 bg-accent-500 hover:bg-accent-600" disabled={feeRulesSaving} onClick={() => {
                const cleaned: Record<string, FeeRule> = {};
                for (const [cat, fee] of Object.entries(bookingFeeByCategory)) {
                  if (cat.trim() && typeof fee.value === 'number' && fee.value >= 0) cleaned[cat.trim()] = fee;
                }
                setFeeRulesSaving(true);
                api.patch('/api/admin/settings', { booking_fee_by_category: cleaned, booking_fee_by_listing: Object.fromEntries(Object.entries(bookingFeeByListing).filter(([k, f]) => /^\d+$/.test(k) && typeof f.value === 'number' && f.value >= 0)) })
                  .then((res) => { setBookingFeeByCategory(res.data?.booking_fee_by_category ?? {}); setBookingFeeByListing(res.data?.booking_fee_by_listing ?? {}); toast({ title: 'Fee rules saved.' }); })
                  .catch(() => toast({ title: 'Failed to save.', variant: 'destructive' }))
                  .finally(() => setFeeRulesSaving(false));
              }}>{feeRulesSaving ? 'Saving…' : 'Save category & listing rules'}</Button>
            </CardContent>
          </Card>

          {/* Service charge by listing (single homestay) */}
          <Card className="border-primary-200">
            <CardHeader className="border-b border-primary-100 bg-primary-50/50">
              <h2 className="font-semibold text-primary-800">Service charge by listing</h2>
              <p className="text-sm text-muted-foreground">Assign a service charge or discount to a single homestay (overrides category and default). E.g. Homestay 4 = Rs 10 flat, Homestay 5 = 2.3%.</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {Object.entries(bookingFeeByListing).map(([listingId, fee]) => (
                  <div key={listingId} className="flex flex-wrap items-end gap-2 rounded-lg border border-border p-3">
                    <div className="min-w-[200px]">
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">Homestay</label>
                      <select
                        value={listingId}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (!v) return;
                          setBookingFeeByListing((prev) => { const next = { ...prev }; delete next[listingId]; next[v] = fee; return next; });
                        }}
                        className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-2 text-sm"
                      >
                        <option value="">Select…</option>
                        {settingsApprovedListings.map((l) => (
                          <option key={l.id} value={String(l.id)}>{l.id} – {l.title}</option>
                        ))}
                      </select>
                    </div>
                    <select value={fee.type} onChange={(e) => setBookingFeeByListing((prev) => ({ ...prev, [listingId]: { ...prev[listingId], type: e.target.value as 'service_charge' | 'discount' } }))} className="h-9 rounded-md border border-primary-200 bg-background px-2 text-sm">
                      <option value="service_charge">Service charge</option>
                      <option value="discount">Discount</option>
                    </select>
                    <select value={fee.kind} onChange={(e) => setBookingFeeByListing((prev) => ({ ...prev, [listingId]: { ...prev[listingId], kind: e.target.value as 'percent' | 'fixed' } }))} className="h-9 rounded-md border border-primary-200 bg-background px-2 text-sm">
                      <option value="percent">%</option>
                      <option value="fixed">NPR flat</option>
                    </select>
                    <input type="number" min={0} step={fee.kind === 'percent' ? 0.1 : 1} value={fee.value} onChange={(e) => setBookingFeeByListing((prev) => ({ ...prev, [listingId]: { ...prev[listingId], value: Number(e.target.value) || 0 } }))} className="h-9 w-20 rounded-md border border-primary-200 bg-background px-2 text-sm" />
                    {fee.type === 'service_charge' && (
                      <select value={fee.applies_to ?? 'guest'} onChange={(e) => setBookingFeeByListing((prev) => ({ ...prev, [listingId]: { ...prev[listingId], applies_to: e.target.value as 'guest' | 'host' } }))} className="h-9 rounded-md border border-primary-200 bg-background px-2 text-sm">
                        <option value="guest">Guest</option>
                        <option value="host">Host</option>
                      </select>
                    )}
                    <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setBookingFeeByListing((prev) => { const next = { ...prev }; delete next[listingId]; return next; })}>Remove</Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setBookingFeeByListing((prev) => ({ ...prev, ['']: { type: 'service_charge', kind: 'percent', value: 0, applies_to: 'guest' } }))}>Add listing rule</Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Save using the &quot;Save category &amp; listing rules&quot; button above.</p>
            </CardContent>
          </Card>

          <Card className="border-primary-200">
            <CardHeader className="border-b border-primary-100 bg-primary-50/50">
              <h2 className="font-semibold text-primary-800">Online payment gateway</h2>
              <p className="text-sm text-muted-foreground">
                When on, guests pay via your configured gateway when they reserve. When off, they submit a reservation request only; they receive a confirmation email and see a message that your team will call them (or they can use your contact details).
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={paymentGatewayEnabled}
                  onChange={(e) => setPaymentGatewayEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-primary-200"
                />
                <span className="text-sm font-medium text-primary-800">Require online payment when reserving</span>
              </label>
              <p className="text-xs text-muted-foreground">
                If online payment is on, enable at least one method below (and configure server credentials: NPX env vars, or HimalPay <code className="rounded bg-muted px-1">HIMALPAY_CHECKOUT_API_KEY</code>).
              </p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={paymentNpxEnabled}
                  onChange={(e) => setPaymentNpxEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-primary-200"
                />
                <span className="text-sm font-medium text-primary-800">Enable e-bank / m-bank (NPX)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={paymentHimalpayEnabled}
                  onChange={(e) => setPaymentHimalpayEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-primary-200"
                />
                <span className="text-sm font-medium text-primary-800">Enable N-cash (HimalPay)</span>
              </label>
              <div>
                <label className="mb-1 block text-sm font-medium text-primary-800">Extra message for guests (optional)</label>
                <p className="text-xs text-muted-foreground mb-2">
                  Shown in the confirmation email and appended to the on-screen confirmation. Use for phone numbers, office hours, or “call us on …”.
                </p>
                <textarea
                  value={offlineBookingGuestMessage}
                  onChange={(e) => setOfflineBookingGuestMessage(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder="e.g. Call us on +977-1-XXXXXXX (10am–6pm) to confirm your stay."
                  className="w-full min-h-[100px] rounded-md border border-primary-200 bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={paymentGatewaySaving}
                  className="bg-accent-500 hover:bg-accent-600"
                  onClick={() => {
                    setPaymentGatewaySaving(true);
                    api
                      .patch('/api/admin/settings', {
                        payment_gateway_enabled: paymentGatewayEnabled,
                        payment_npx_enabled: paymentNpxEnabled,
                        payment_himalpay_enabled: paymentHimalpayEnabled,
                        offline_booking_guest_message: offlineBookingGuestMessage.trim() || null,
                      })
                      .then((res) => {
                        setPaymentGatewayEnabled(res.data?.payment_gateway_enabled === true);
                        setPaymentNpxEnabled(res.data?.payment_npx_enabled === true);
                        setPaymentHimalpayEnabled(res.data?.payment_himalpay_enabled === true);
                        setOfflineBookingGuestMessage(
                          typeof res.data?.offline_booking_guest_message === 'string' ? res.data.offline_booking_guest_message : ''
                        );
                        toast({ title: 'Payment options saved.' });
                      })
                      .catch(() => toast({ title: 'Failed to save.', variant: 'destructive' }))
                      .finally(() => setPaymentGatewaySaving(false));
                  }}
                >
                  {paymentGatewaySaving ? 'Saving…' : 'Save payment options'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={paymentGatewaySaving}
                  className="border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setPaymentGatewaySaving(true);
                    api
                      .patch('/api/admin/settings', { disable_all_online_payment_methods: true })
                      .then((res) => {
                        setPaymentGatewayEnabled(res.data?.payment_gateway_enabled === true);
                        setPaymentNpxEnabled(res.data?.payment_npx_enabled === true);
                        setPaymentHimalpayEnabled(res.data?.payment_himalpay_enabled === true);
                        toast({ title: 'All online payment methods disabled.' });
                      })
                      .catch(() => toast({ title: 'Failed to save.', variant: 'destructive' }))
                      .finally(() => setPaymentGatewaySaving(false));
                  }}
                >
                  Disable all online payment methods
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary-200">
            <CardHeader className="border-b border-primary-100 bg-primary-50/50">
              <h2 className="font-semibold text-primary-800">Partial payment (min %)</h2>
              <p className="text-sm text-muted-foreground">Minimum percent of total that guests must pay when choosing &quot;Pay partial now&quot; (e.g. 25). No discount applies when paying partial. Rest is paid at checkout; host marks as paid.</p>
            </CardHeader>
            <CardContent className="p-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const val = Math.max(1, Math.min(100, Math.round(Number(partialPaymentMinPercent))));
                  setPartialPaymentMinSaving(true);
                  api.patch('/api/admin/settings', { partial_payment_min_percent: val })
                    .then((res) => {
                      setPartialPaymentMinPercent(res.data?.partial_payment_min_percent ?? val);
                      toast({ title: 'Minimum partial payment % saved.' });
                    })
                    .catch(() => toast({ title: 'Failed to save.', variant: 'destructive' }))
                    .finally(() => setPartialPaymentMinSaving(false));
                }}
                className="flex flex-wrap items-end gap-4"
              >
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary-800">Minimum partial payment (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={partialPaymentMinPercent}
                    onChange={(e) => setPartialPaymentMinPercent(Number(e.target.value) || 25)}
                    className="flex h-9 w-24 rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
                  />
                </div>
                <Button type="submit" disabled={partialPaymentMinSaving} className="bg-accent-500 hover:bg-accent-600">
                  {partialPaymentMinSaving ? 'Saving…' : 'Save'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Home placements (hero carousel + featured section) — Admin → Settings → scroll to "Home placements" */}
          <Card className="border-primary-200">
            <CardHeader className="border-b border-primary-100 bg-primary-50/50">
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5 text-accent-500" />
                <h2 className="font-semibold text-primary-800">Home placements (Hero &amp; Featured)</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Choose which homestays appear on the public homepage: hero carousel (max {MAX_HOME_HERO_CAROUSEL} slides) and the featured block (max {MAX_HOME_FEATURED} cards). Order below controls hero slide order. Set placement prices (optional); paid placement for hosts can be added later.
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span>
                  Hero: {homePlacements.hero_carousel_listing_ids.length}/{MAX_HOME_HERO_CAROUSEL} selected
                </span>
                <span>·</span>
                <span>
                  Featured: {homePlacements.featured_listing_ids.length}/{MAX_HOME_FEATURED} selected
                </span>
              </div>
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
                      onChange={(e) => setHomePlacements((p) => ({ ...p, hero_carousel_price: Number(e.target.value) || 0 }))}
                      placeholder="0"
                      className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
                    />
                    <label className="block text-sm text-muted-foreground mt-3">
                      Add listings (max {MAX_HOME_HERO_CAROUSEL}; then set slide order in the list below)
                    </label>
                    <div className="max-h-48 overflow-y-auto rounded border border-primary-200 bg-muted/30 p-2 space-y-1">
                      {homePlacementPickerList.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No approved listings. Approve some under the Listings tab first.</p>
                      ) : (
                        homePlacementPickerList.map((listing) => {
                          const lid = Number(listing.id);
                          const selected = homePlacements.hero_carousel_listing_ids.some((x) => Number(x) === lid);
                          const atMax = homePlacements.hero_carousel_listing_ids.length >= MAX_HOME_HERO_CAROUSEL && !selected;
                          return (
                            <label key={listing.id} className={`flex items-center gap-2 text-sm ${atMax ? 'opacity-60' : ''}`}>
                              <input
                                type="checkbox"
                                checked={selected}
                                disabled={atMax}
                                onChange={(e) => {
                                  if (!e.target.checked) {
                                    setHomePlacements((p) => ({ ...p, hero_carousel_listing_ids: p.hero_carousel_listing_ids.filter((id) => Number(id) !== lid) }));
                                  } else if (homePlacements.hero_carousel_listing_ids.length < MAX_HOME_HERO_CAROUSEL) {
                                    setHomePlacements((p) => ({
                                      ...p,
                                      hero_carousel_listing_ids: [...p.hero_carousel_listing_ids, lid].slice(0, MAX_HOME_HERO_CAROUSEL),
                                    }));
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
                    {homePlacements.hero_carousel_listing_ids.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-primary-800">Hero slide order (first = first slide)</p>
                        <ol className="list-none space-y-1 rounded border border-primary-200 bg-background p-2">
                          {homePlacements.hero_carousel_listing_ids.map((id, idx) => {
                            return (
                              <li key={id} className="flex items-center justify-between gap-2 rounded border border-border/50 bg-muted/20 px-2 py-1.5 text-sm">
                                <span>
                                  {idx + 1}. {homePlacementIdLabel(Number(id))}
                                </span>
                                <div className="flex shrink-0 items-center gap-0.5">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={idx === 0}
                                    onClick={() => {
                                      setHomePlacements((p) => {
                                        const next = [...p.hero_carousel_listing_ids];
                                        [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                                        return { ...p, hero_carousel_listing_ids: next };
                                      });
                                    }}
                                    aria-label="Move up"
                                  >
                                    <ChevronUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={idx >= homePlacements.hero_carousel_listing_ids.length - 1}
                                    onClick={() => {
                                      setHomePlacements((p) => {
                                        const next = [...p.hero_carousel_listing_ids];
                                        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                                        return { ...p, hero_carousel_listing_ids: next };
                                      });
                                    }}
                                    aria-label="Move down"
                                  >
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => {
                                      setHomePlacements((p) => ({
                                        ...p,
                                        hero_carousel_listing_ids: p.hero_carousel_listing_ids.filter((_, i) => i !== idx),
                                      }));
                                    }}
                                    aria-label="Remove from hero order"
                                    title="Remove from hero"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </li>
                            );
                          })}
                        </ol>
                      </div>
                    )}
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
                      onChange={(e) => setHomePlacements((p) => ({ ...p, featured_placement_price: Number(e.target.value) || 0 }))}
                      placeholder="0"
                      className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
                    />
                    <label className="block text-sm text-muted-foreground mt-3">Listings (max {MAX_HOME_FEATURED}, grid order on site follows this list)</label>
                    <div className="max-h-48 overflow-y-auto rounded border border-primary-200 bg-muted/30 p-2 space-y-1">
                      {homePlacementPickerList.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No approved listings.</p>
                      ) : (
                        homePlacementPickerList.map((listing) => {
                          const lid = Number(listing.id);
                          const selected = homePlacements.featured_listing_ids.some((x) => Number(x) === lid);
                          const atMax = homePlacements.featured_listing_ids.length >= MAX_HOME_FEATURED && !selected;
                          return (
                            <label key={listing.id} className={`flex items-center gap-2 text-sm ${atMax ? 'opacity-60' : ''}`}>
                              <input
                                type="checkbox"
                                checked={selected}
                                disabled={atMax}
                                onChange={(e) => {
                                  if (!e.target.checked) {
                                    setHomePlacements((p) => ({ ...p, featured_listing_ids: p.featured_listing_ids.filter((id) => Number(id) !== lid) }));
                                  } else if (homePlacements.featured_listing_ids.length < MAX_HOME_FEATURED) {
                                    setHomePlacements((p) => ({
                                      ...p,
                                      featured_listing_ids: [...p.featured_listing_ids, lid].slice(0, MAX_HOME_FEATURED),
                                    }));
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
                    {homePlacements.featured_listing_ids.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-primary-800">Card order (first = left / top on homepage)</p>
                        <ol className="list-none space-y-1 rounded border border-primary-200 bg-background p-2">
                          {homePlacements.featured_listing_ids.map((id, idx) => {
                            return (
                              <li key={id} className="flex items-center justify-between gap-2 rounded border border-border/50 bg-muted/20 px-2 py-1.5 text-sm">
                                <span>
                                  {idx + 1}. {homePlacementIdLabel(Number(id))}
                                </span>
                                <div className="flex shrink-0 items-center gap-0.5">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={idx === 0}
                                    onClick={() => {
                                      setHomePlacements((p) => {
                                        const next = [...p.featured_listing_ids];
                                        [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                                        return { ...p, featured_listing_ids: next };
                                      });
                                    }}
                                    aria-label="Move up"
                                  >
                                    <ChevronUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={idx >= homePlacements.featured_listing_ids.length - 1}
                                    onClick={() => {
                                      setHomePlacements((p) => {
                                        const next = [...p.featured_listing_ids];
                                        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                                        return { ...p, featured_listing_ids: next };
                                      });
                                    }}
                                    aria-label="Move down"
                                  >
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => {
                                      setHomePlacements((p) => ({
                                        ...p,
                                        featured_listing_ids: p.featured_listing_ids.filter((_, i) => i !== idx),
                                      }));
                                    }}
                                    aria-label="Remove from featured order"
                                    title="Remove from featured"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </li>
                            );
                          })}
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button
                type="button"
                disabled={homePlacementsSaving}
                onClick={() => {
                  setHomePlacementsSaving(true);
                  const payload: HomePlacementSettings = {
                    ...homePlacements,
                    hero_carousel_listing_ids: homePlacements.hero_carousel_listing_ids.slice(0, MAX_HOME_HERO_CAROUSEL),
                    featured_listing_ids: homePlacements.featured_listing_ids.slice(0, MAX_HOME_FEATURED),
                  };
                  api.patch('/api/admin/settings', { home_placements: payload })
                    .then((res) => {
                      const next = res.data?.home_placements ?? payload;
                      setHomePlacements({ ...EMPTY_HOME_PLACEMENTS, ...next });
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

          {/* Homepage partners */}
          {tab === 'settings' && (
            <Card className="border-primary-200">
              <CardHeader className="border-b border-primary-100 bg-primary-50/50">
                <h2 className="font-semibold text-primary-800">Homepage — Our Partners</h2>
                <p className="text-sm text-muted-foreground">
                  Manage homepage partner groups with simple fields. Add categories and partner rows without editing JSON.
                </p>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Section badge</label>
                    <input
                      value={homePartnersForm.section_badge ?? ''}
                      onChange={(e) => setHomePartnersForm((f) => ({ ...f, section_badge: e.target.value }))}
                      className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-muted-foreground">Section title</label>
                    <input
                      value={homePartnersForm.section_title ?? ''}
                      onChange={(e) => setHomePartnersForm((f) => ({ ...f, section_title: e.target.value }))}
                      className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Section subtitle</label>
                  <textarea
                    value={homePartnersForm.section_subtitle ?? ''}
                    onChange={(e) => setHomePartnersForm((f) => ({ ...f, section_subtitle: e.target.value }))}
                    rows={2}
                    className="flex w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium text-primary-800">Partner categories</h3>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setHomePartnersForm((f) => ({ ...f, categories: [...f.categories, EMPTY_CATEGORY()] }))}
                    >
                      Add category
                    </Button>
                  </div>
                  {homePartnersForm.categories.map((category, cIdx) => (
                    <div key={`partner-category-${cIdx}`} className="rounded-lg border border-primary-200 p-4 space-y-3 bg-muted/20">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-xs text-muted-foreground">Category title</label>
                          <input
                            value={category.title}
                            onChange={(e) =>
                              setHomePartnersForm((f) => ({
                                ...f,
                                categories: f.categories.map((c, i) => (i === cIdx ? { ...c, title: e.target.value } : c)),
                              }))
                            }
                            className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-muted-foreground">Icon</label>
                          <select
                            value={category.icon}
                            onChange={(e) =>
                              setHomePartnersForm((f) => ({
                                ...f,
                                categories: f.categories.map((c, i) => (i === cIdx ? { ...c, icon: e.target.value as HomePartnerIcon } : c)),
                              }))
                            }
                            className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
                          >
                            {HOME_PARTNER_ICONS.map((icon) => (
                              <option key={icon} value={icon}>
                                {icon}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-end justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              setHomePartnersForm((f) => {
                                const next = f.categories.filter((_, i) => i !== cIdx);
                                return { ...f, categories: next.length ? next : [EMPTY_CATEGORY()] };
                              })
                            }
                          >
                            Remove category
                          </Button>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">Category description</label>
                        <input
                          value={category.description ?? ''}
                          onChange={(e) =>
                            setHomePartnersForm((f) => ({
                              ...f,
                              categories: f.categories.map((c, i) => (i === cIdx ? { ...c, description: e.target.value } : c)),
                            }))
                          }
                          className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-muted-foreground">Partners</p>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              setHomePartnersForm((f) => ({
                                ...f,
                                categories: f.categories.map((c, i) =>
                                  i === cIdx ? { ...c, partners: [...c.partners, EMPTY_PARTNER()] } : c
                                ),
                              }))
                            }
                          >
                            Add partner
                          </Button>
                        </div>
                        {category.partners.map((partner, pIdx) => (
                          <div key={`partner-row-${cIdx}-${pIdx}`} className="grid gap-2 sm:grid-cols-12 items-end">
                            <div className="sm:col-span-3">
                              <label className="mb-1 block text-xs text-muted-foreground">Name</label>
                              <input
                                value={partner.name}
                                onChange={(e) =>
                                  setHomePartnersForm((f) => ({
                                    ...f,
                                    categories: f.categories.map((c, i) =>
                                      i === cIdx
                                        ? {
                                            ...c,
                                            partners: c.partners.map((p, j) => (j === pIdx ? { ...p, name: e.target.value } : p)),
                                          }
                                        : c
                                    ),
                                  }))
                                }
                                className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <label className="mb-1 block text-xs text-muted-foreground">Tag</label>
                              <input
                                value={partner.tag}
                                onChange={(e) =>
                                  setHomePartnersForm((f) => ({
                                    ...f,
                                    categories: f.categories.map((c, i) =>
                                      i === cIdx
                                        ? {
                                            ...c,
                                            partners: c.partners.map((p, j) => (j === pIdx ? { ...p, tag: e.target.value } : p)),
                                          }
                                        : c
                                    ),
                                  }))
                                }
                                className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
                              />
                            </div>
                            <div className="sm:col-span-5">
                              <label className="mb-1 block text-xs text-muted-foreground">Website (optional)</label>
                              <input
                                value={partner.website ?? ''}
                                onChange={(e) =>
                                  setHomePartnersForm((f) => ({
                                    ...f,
                                    categories: f.categories.map((c, i) =>
                                      i === cIdx
                                        ? {
                                            ...c,
                                            partners: c.partners.map((p, j) => (j === pIdx ? { ...p, website: e.target.value } : p)),
                                          }
                                        : c
                                    ),
                                  }))
                                }
                                className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm"
                              />
                            </div>
                            <div className="sm:col-span-1">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  setHomePartnersForm((f) => ({
                                    ...f,
                                    categories: f.categories.map((c, i) =>
                                      i === cIdx
                                        ? {
                                            ...c,
                                            partners: c.partners.length > 1 ? c.partners.filter((_, j) => j !== pIdx) : c.partners,
                                          }
                                        : c
                                    ),
                                  }))
                                }
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={homePartnersSaving}
                    onClick={() => {
                      const payload = {
                        section_badge: (homePartnersForm.section_badge || '').trim(),
                        section_title: (homePartnersForm.section_title || '').trim(),
                        section_subtitle: (homePartnersForm.section_subtitle || '').trim(),
                        categories: homePartnersForm.categories
                          .map((c) => ({
                            title: c.title.trim(),
                            description: (c.description || '').trim(),
                            icon: c.icon,
                            partners: c.partners
                              .map((p) => ({ name: p.name.trim(), tag: p.tag.trim(), website: (p.website || '').trim() }))
                              .filter((p) => p.name && p.tag)
                              .map((p) => ({ ...p, website: p.website || undefined })),
                          }))
                          .filter((c) => c.title && c.partners.length > 0),
                      };
                      if (!payload.section_title || payload.categories.length === 0) {
                        toast({ title: 'Add at least one category with one partner and a section title.', variant: 'destructive' });
                        return;
                      }
                      setHomePartnersSaving(true);
                      api
                        .patch('/api/admin/settings', { home_partners: payload })
                        .then((r) => {
                          const o = r.data as { home_partners?: unknown };
                          setHomePartnersForm(normalizeHomePartners(o.home_partners));
                          toast({ title: 'Partners saved.' });
                        })
                        .catch((err) =>
                          toast({ title: err.response?.data?.message || 'Failed to save partners.', variant: 'destructive' })
                        )
                        .finally(() => setHomePartnersSaving(false));
                    }}
                    className="bg-accent-500 hover:bg-accent-600"
                  >
                    {homePartnersSaving ? 'Saving…' : 'Save partners'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={homePartnersSaving}
                    onClick={() => {
                      setHomePartnersSaving(true);
                      api
                        .patch('/api/admin/settings', { home_partners: null })
                        .then((r) => {
                          const o = r.data as { home_partners?: unknown };
                          setHomePartnersForm(normalizeHomePartners(o.home_partners));
                          toast({ title: 'Cleared — site now uses default partner list.' });
                        })
                        .catch(() => toast({ title: 'Failed to clear.', variant: 'destructive' }))
                        .finally(() => setHomePartnersSaving(false));
                    }}
                  >
                    Clear to defaults
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {tab === 'settings' && (
            <Card className="border-primary-200">
              <CardHeader className="border-b border-primary-100 bg-primary-50/50">
                <h2 className="font-semibold text-primary-800">Festivals Page Configuration</h2>
                <p className="text-sm text-muted-foreground">
                  Configure hero text and the month-wise festival cards shown on `/festivals`.
                </p>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Badge</label>
                    <input value={festivalsPageForm.badge} onChange={(e) => setFestivalsPageForm((f) => ({ ...f, badge: e.target.value }))} className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-muted-foreground">Title</label>
                    <input value={festivalsPageForm.title} onChange={(e) => setFestivalsPageForm((f) => ({ ...f, title: e.target.value }))} className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Subtitle</label>
                  <textarea value={festivalsPageForm.subtitle} onChange={(e) => setFestivalsPageForm((f) => ({ ...f, subtitle: e.target.value }))} rows={2} className="flex w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium text-primary-800">Festivals</h3>
                    <Button type="button" variant="outline" onClick={() => setFestivalsPageForm((f) => ({ ...f, festivals: [...f.festivals, EMPTY_FESTIVAL_ITEM()] }))}>
                      Add festival
                    </Button>
                  </div>
                  {festivalsPageForm.festivals.map((festival, idx) => (
                    <div key={`festival-${idx}`} className="rounded-lg border border-primary-200 p-4 space-y-3 bg-muted/20">
                      <div className="grid gap-3 sm:grid-cols-12">
                        <div className="sm:col-span-3">
                          <label className="mb-1 block text-xs text-muted-foreground">ID</label>
                          <input value={festival.id} onChange={(e) => setFestivalsPageForm((f) => ({ ...f, festivals: f.festivals.map((x, i) => i === idx ? { ...x, id: e.target.value } : x) }))} className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm" />
                        </div>
                        <div className="sm:col-span-4">
                          <label className="mb-1 block text-xs text-muted-foreground">Name</label>
                          <input value={festival.name} onChange={(e) => setFestivalsPageForm((f) => ({ ...f, festivals: f.festivals.map((x, i) => i === idx ? { ...x, name: e.target.value } : x) }))} className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs text-muted-foreground">Month (0-11)</label>
                          <input type="number" min={0} max={11} value={festival.monthIndex} onChange={(e) => setFestivalsPageForm((f) => ({ ...f, festivals: f.festivals.map((x, i) => i === idx ? { ...x, monthIndex: e.target.value } : x) }))} className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs text-muted-foreground">Emoji</label>
                          <input value={festival.emoji} onChange={(e) => setFestivalsPageForm((f) => ({ ...f, festivals: f.festivals.map((x, i) => i === idx ? { ...x, emoji: e.target.value } : x) }))} className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm" />
                        </div>
                        <div className="sm:col-span-1 flex items-end justify-end">
                          <Button type="button" variant="outline" onClick={() => setFestivalsPageForm((f) => ({ ...f, festivals: f.festivals.length > 1 ? f.festivals.filter((_, i) => i !== idx) : f.festivals }))}>Remove</Button>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs text-muted-foreground">Region</label>
                          <input value={festival.region} onChange={(e) => setFestivalsPageForm((f) => ({ ...f, festivals: f.festivals.map((x, i) => i === idx ? { ...x, region: e.target.value } : x) }))} className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-muted-foreground">Duration</label>
                          <input value={festival.duration} onChange={(e) => setFestivalsPageForm((f) => ({ ...f, festivals: f.festivals.map((x, i) => i === idx ? { ...x, duration: e.target.value } : x) }))} className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">Description</label>
                        <textarea value={festival.description} onChange={(e) => setFestivalsPageForm((f) => ({ ...f, festivals: f.festivals.map((x, i) => i === idx ? { ...x, description: e.target.value } : x) }))} rows={2} className="flex w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={festivalsPageSaving}
                    onClick={() => {
                      const payload: FestivalsPageConfig = {
                        badge: festivalsPageForm.badge.trim(),
                        title: festivalsPageForm.title.trim(),
                        subtitle: festivalsPageForm.subtitle.trim(),
                        festivals: festivalsPageForm.festivals
                          .map((f) => ({
                            id: f.id.trim(),
                            name: f.name.trim(),
                            monthIndex: Number(f.monthIndex),
                            region: f.region.trim() || undefined,
                            duration: f.duration.trim() || undefined,
                            description: f.description.trim(),
                            emoji: f.emoji.trim() || undefined,
                          }))
                          .filter((f) => f.id && f.name && Number.isInteger(f.monthIndex) && f.monthIndex >= 0 && f.monthIndex <= 11 && f.description),
                      };
                      if (!payload.title || payload.festivals.length === 0) {
                        toast({ title: 'Add title and at least one valid festival.', variant: 'destructive' });
                        return;
                      }
                      setFestivalsPageSaving(true);
                      api.patch('/api/admin/settings', { festivals_page: payload })
                        .then((r) => {
                          const next = (r.data?.festivals_page ?? payload) as FestivalsPageConfig;
                          setFestivalsPageForm(normalizeFestivalsPage(next));
                          toast({ title: 'Festivals page settings saved.' });
                        })
                        .catch((err) => toast({ title: err.response?.data?.message || 'Failed to save festivals settings.', variant: 'destructive' }))
                        .finally(() => setFestivalsPageSaving(false));
                    }}
                    className="bg-accent-500 hover:bg-accent-600"
                  >
                    {festivalsPageSaving ? 'Saving…' : 'Save festivals settings'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={festivalsPageSaving}
                    onClick={() => {
                      setFestivalsPageSaving(true);
                      api.patch('/api/admin/settings', { festivals_page: null })
                        .then((r) => {
                          const next = (r.data?.festivals_page ?? EMPTY_FESTIVALS_PAGE()) as FestivalsPageConfig;
                          setFestivalsPageForm(normalizeFestivalsPage(next));
                          toast({ title: 'Festivals page reset to defaults.' });
                        })
                        .catch(() => toast({ title: 'Failed to reset festivals settings.', variant: 'destructive' }))
                        .finally(() => setFestivalsPageSaving(false));
                    }}
                  >
                    Reset to defaults
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {tab === 'settings' && (
            <Card className="border-primary-200">
              <CardHeader className="border-b border-primary-100 bg-primary-50/50">
                <h2 className="font-semibold text-primary-800">Trip Planner Page Configuration</h2>
                <p className="text-sm text-muted-foreground">
                  Configure hero text, route map copy, and suggested route cards shown on `/trip-planner`.
                </p>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Badge</label>
                    <input value={tripPlannerPageForm.badge} onChange={(e) => setTripPlannerPageForm((f) => ({ ...f, badge: e.target.value }))} className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-muted-foreground">Title</label>
                    <input value={tripPlannerPageForm.title} onChange={(e) => setTripPlannerPageForm((f) => ({ ...f, title: e.target.value }))} className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Subtitle</label>
                  <textarea value={tripPlannerPageForm.subtitle} onChange={(e) => setTripPlannerPageForm((f) => ({ ...f, subtitle: e.target.value }))} rows={2} className="flex w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Route map title</label>
                    <input value={tripPlannerPageForm.route_map_title} onChange={(e) => setTripPlannerPageForm((f) => ({ ...f, route_map_title: e.target.value }))} className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Suggested routes title</label>
                    <input value={tripPlannerPageForm.suggested_routes_title} onChange={(e) => setTripPlannerPageForm((f) => ({ ...f, suggested_routes_title: e.target.value }))} className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Route map description</label>
                  <textarea value={tripPlannerPageForm.route_map_description} onChange={(e) => setTripPlannerPageForm((f) => ({ ...f, route_map_description: e.target.value }))} rows={2} className="flex w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium text-primary-800">Suggested routes</h3>
                    <Button type="button" variant="outline" onClick={() => setTripPlannerPageForm((f) => ({ ...f, suggested_routes: [...f.suggested_routes, EMPTY_ROUTE_FORM()] }))}>
                      Add route
                    </Button>
                  </div>
                  {tripPlannerPageForm.suggested_routes.map((route, idx) => (
                    <div key={`trip-route-${idx}`} className="rounded-lg border border-primary-200 p-4 space-y-3 bg-muted/20">
                      <div className="grid gap-3 sm:grid-cols-12">
                        <div className="sm:col-span-3">
                          <label className="mb-1 block text-xs text-muted-foreground">ID</label>
                          <input value={route.id} onChange={(e) => setTripPlannerPageForm((f) => ({ ...f, suggested_routes: f.suggested_routes.map((x, i) => i === idx ? { ...x, id: e.target.value } : x) }))} className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm" />
                        </div>
                        <div className="sm:col-span-4">
                          <label className="mb-1 block text-xs text-muted-foreground">Name</label>
                          <input value={route.name} onChange={(e) => setTripPlannerPageForm((f) => ({ ...f, suggested_routes: f.suggested_routes.map((x, i) => i === idx ? { ...x, name: e.target.value } : x) }))} className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs text-muted-foreground">Days</label>
                          <input type="number" min={1} value={route.days} onChange={(e) => setTripPlannerPageForm((f) => ({ ...f, suggested_routes: f.suggested_routes.map((x, i) => i === idx ? { ...x, days: e.target.value } : x) }))} className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs text-muted-foreground">Emoji</label>
                          <input value={route.emoji} onChange={(e) => setTripPlannerPageForm((f) => ({ ...f, suggested_routes: f.suggested_routes.map((x, i) => i === idx ? { ...x, emoji: e.target.value } : x) }))} className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm" />
                        </div>
                        <div className="sm:col-span-1 flex items-end justify-end">
                          <Button type="button" variant="outline" onClick={() => setTripPlannerPageForm((f) => ({ ...f, suggested_routes: f.suggested_routes.length > 1 ? f.suggested_routes.filter((_, i) => i !== idx) : f.suggested_routes }))}>Remove</Button>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">Description</label>
                        <textarea value={route.description} onChange={(e) => setTripPlannerPageForm((f) => ({ ...f, suggested_routes: f.suggested_routes.map((x, i) => i === idx ? { ...x, description: e.target.value } : x) }))} rows={2} className="flex w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">Stops (comma separated)</label>
                        <input value={route.stopsText} onChange={(e) => setTripPlannerPageForm((f) => ({ ...f, suggested_routes: f.suggested_routes.map((x, i) => i === idx ? { ...x, stopsText: e.target.value } : x) }))} className="flex h-9 w-full rounded-md border border-primary-200 bg-background px-3 py-1 text-sm" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={tripPlannerPageSaving}
                    onClick={() => {
                      const payload: TripPlannerPageConfig = {
                        badge: tripPlannerPageForm.badge.trim(),
                        title: tripPlannerPageForm.title.trim(),
                        subtitle: tripPlannerPageForm.subtitle.trim(),
                        route_map_title: tripPlannerPageForm.route_map_title.trim(),
                        route_map_description: tripPlannerPageForm.route_map_description.trim(),
                        suggested_routes_title: tripPlannerPageForm.suggested_routes_title.trim(),
                        suggested_routes: tripPlannerPageForm.suggested_routes
                          .map((r) => ({
                            id: r.id.trim(),
                            name: r.name.trim(),
                            days: Number(r.days),
                            description: r.description.trim(),
                            stops: r.stopsText.split(',').map((s) => s.trim()).filter(Boolean),
                            emoji: r.emoji.trim() || undefined,
                          }))
                          .filter((r) => r.id && r.name && Number.isInteger(r.days) && r.days > 0 && r.description && r.stops.length > 0),
                      };
                      if (!payload.title || payload.suggested_routes.length === 0) {
                        toast({ title: 'Add title and at least one valid suggested route.', variant: 'destructive' });
                        return;
                      }
                      setTripPlannerPageSaving(true);
                      api.patch('/api/admin/settings', { trip_planner_page: payload })
                        .then((r) => {
                          const next = (r.data?.trip_planner_page ?? payload) as TripPlannerPageConfig;
                          setTripPlannerPageForm(normalizeTripPlannerPage(next));
                          toast({ title: 'Trip planner settings saved.' });
                        })
                        .catch((err) => toast({ title: err.response?.data?.message || 'Failed to save trip planner settings.', variant: 'destructive' }))
                        .finally(() => setTripPlannerPageSaving(false));
                    }}
                    className="bg-accent-500 hover:bg-accent-600"
                  >
                    {tripPlannerPageSaving ? 'Saving…' : 'Save trip planner settings'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={tripPlannerPageSaving}
                    onClick={() => {
                      setTripPlannerPageSaving(true);
                      api.patch('/api/admin/settings', { trip_planner_page: null })
                        .then((r) => {
                          const next = (r.data?.trip_planner_page ?? EMPTY_TRIP_PLANNER_PAGE()) as TripPlannerPageConfig;
                          setTripPlannerPageForm(normalizeTripPlannerPage(next));
                          toast({ title: 'Trip planner page reset to defaults.' });
                        })
                        .catch(() => toast({ title: 'Failed to reset trip planner settings.', variant: 'destructive' }))
                        .finally(() => setTripPlannerPageSaving(false));
                    }}
                  >
                    Reset to defaults
                  </Button>
                </div>
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

          <Card className="border-primary-200">
            <CardHeader className="border-b border-primary-100 bg-primary-50/50">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-accent-500" />
                <h2 className="font-semibold text-primary-800">Email templates</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Override subject and body for each transactional email. Leave fields blank to use the built-in default. Use placeholders such as{' '}
                <code className="text-xs">{'{{otp}}'}</code>, <code className="text-xs">{'{{temporaryPassword}}'}</code>,{' '}
                <code className="text-xs">{'{{listingTitle}}'}</code>, <code className="text-xs">{'{{guestName}}'}</code>,{' '}
                <code className="text-xs">{'{{checkIn}}'}</code>, <code className="text-xs">{'{{checkOut}}'}</code>, <code className="text-xs">{'{{amountNpr}}'}</code> where relevant.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-primary-800">Template</label>
                <select
                  value={emailTemplateKey}
                  onChange={(e) => setEmailTemplateKey(e.target.value)}
                  className="w-full max-w-md rounded-md border border-primary-200 bg-background px-3 py-2 text-sm"
                >
                  {ADMIN_EMAIL_TEMPLATE_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {k.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-primary-800">Subject (optional override)</label>
                <input
                  type="text"
                  value={emailTemplateSubject}
                  onChange={(e) => setEmailTemplateSubject(e.target.value)}
                  className="w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm"
                  placeholder="Leave blank for default subject"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-primary-800">Inner HTML (optional)</label>
                <Textarea
                  value={emailTemplateInnerHtml}
                  onChange={(e) => setEmailTemplateInnerHtml(e.target.value)}
                  rows={8}
                  className="font-mono text-xs"
                  placeholder="HTML fragment inside the branded email layout…"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-primary-800">Plain text body (optional)</label>
                <Textarea
                  value={emailTemplateBodyText}
                  onChange={(e) => setEmailTemplateBodyText(e.target.value)}
                  rows={6}
                  className="font-mono text-xs"
                  placeholder="Plain text version…"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="bg-accent-500 hover:bg-accent-600"
                  disabled={emailTemplatesSaving}
                  onClick={() => {
                    const subj = emailTemplateSubject.trim();
                    const inner = emailTemplateInnerHtml.trim();
                    const txt = emailTemplateBodyText.trim();
                    const entry =
                      subj || inner || txt
                        ? { ...(subj ? { subject: subj } : {}), ...(inner ? { innerHtml: inner } : {}), ...(txt ? { bodyText: txt } : {}) }
                        : null;
                    const nextMap = { ...emailTemplatesMap };
                    if (entry && Object.keys(entry).length > 0) nextMap[emailTemplateKey] = entry;
                    else delete nextMap[emailTemplateKey];
                    setEmailTemplatesSaving(true);
                    api
                      .patch('/api/admin/settings', { email_template_overrides: nextMap })
                      .then((res) => {
                        const raw = res.data?.email_template_overrides;
                        setEmailTemplatesMap(
                          raw && typeof raw === 'object' && !Array.isArray(raw)
                            ? (raw as Record<string, { subject?: string; innerHtml?: string; bodyText?: string }>)
                            : nextMap
                        );
                        toast({ title: 'Email template saved.' });
                      })
                      .catch(() => toast({ title: 'Failed to save template.', variant: 'destructive' }))
                      .finally(() => setEmailTemplatesSaving(false));
                  }}
                >
                  {emailTemplatesSaving ? 'Saving…' : 'Save this template'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={emailTemplatesSaving}
                  onClick={() => {
                    const nextMap = { ...emailTemplatesMap };
                    delete nextMap[emailTemplateKey];
                    setEmailTemplateSubject('');
                    setEmailTemplateInnerHtml('');
                    setEmailTemplateBodyText('');
                    setEmailTemplatesSaving(true);
                    api
                      .patch('/api/admin/settings', { email_template_overrides: Object.keys(nextMap).length ? nextMap : {} })
                      .then((res) => {
                        const raw = res.data?.email_template_overrides;
                        setEmailTemplatesMap(
                          raw && typeof raw === 'object' && !Array.isArray(raw)
                            ? (raw as Record<string, { subject?: string; innerHtml?: string; bodyText?: string }>)
                            : {}
                        );
                        toast({ title: 'Override cleared for this template.' });
                      })
                      .catch(() => toast({ title: 'Failed to clear template.', variant: 'destructive' }))
                      .finally(() => setEmailTemplatesSaving(false));
                  }}
                >
                  Clear override
                </Button>
              </div>
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
            <div className="relative" ref={logCalendarRef}>
              <button
                type="button"
                onClick={() => setLogCalendarOpen((v) => !v)}
                className="flex items-center gap-3 rounded border border-primary-200 bg-background px-3 py-2 text-sm hover:bg-primary-50/50 transition-colors"
                aria-expanded={logCalendarOpen}
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">From</span>
                  <span className="text-foreground">
                    {logDateFrom ? new Date(logDateFrom + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">To</span>
                  <span className="text-foreground">
                    {logDateTo ? new Date(logDateTo + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </span>
                </div>
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </button>
              {logCalendarOpen && (
                <div className="absolute right-0 z-[100] mt-1 bg-card border border-primary-200 rounded-xl shadow-xl p-3 calendar-popup">
                  <DateRangePicker
                    checkIn={logDateFrom}
                    checkOut={logDateTo}
                    onCheckInChange={(v) => { setLogDateFrom(v); setLogsFiltersApplied(false); }}
                    onCheckOutChange={(v) => {
                      setLogDateTo(v);
                      setLogsFiltersApplied(false);
                      if (v) setLogCalendarOpen(false);
                    }}
                  />
                </div>
              )}
            </div>
            <Button size="sm" className="bg-accent-500 hover:bg-accent-600" disabled={!logDateFrom || !logDateTo} onClick={() => setLogsFiltersApplied(true)}>
              Apply filters
            </Button>
            {!logsFiltersApplied && (
              <span className="text-sm text-amber-600">Set date range and click Apply filters to load data (reduces database load).</span>
            )}
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
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">Search</span>
                    <input type="text" value={logSearch} onChange={(e) => { setLogSearch(e.target.value); setLogPage(1); }} placeholder="Recipient, subject or body…" className="w-44 rounded border border-primary-200 px-2 py-1 text-sm" />
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
                {!logsFiltersApplied ? (
                  <div className="p-8 text-center text-muted-foreground">Set date range and click Apply filters to load data.</div>
                ) : (
                <>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-primary-200 bg-primary-50/50 sticky top-0 z-10 bg-primary-50 shadow-sm"><th className="text-left p-2">Time</th><th className="text-left p-2">Channel</th><th className="text-left p-2">Recipient</th><th className="text-left p-2">Event</th><th className="text-left p-2">Status</th><th className="text-left p-2">Response</th></tr></thead>
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
                </>
                )}
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
                {!logsFiltersApplied ? (
                  <div className="p-8 text-center text-muted-foreground">Set date range and click Apply filters to load data.</div>
                ) : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-primary-200 bg-primary-50/50 sticky top-0 z-10 bg-primary-50 shadow-sm"><th className="text-left p-2">Time</th><th className="text-left p-2 w-32">User (mobile, name)</th><th className="text-left p-2">Session</th><th className="text-left p-2">Event</th><th className="text-left p-2">Page</th><th className="text-left p-2">Payload</th></tr></thead>
                  <tbody>
                    {journeyLogRows.map((r) => (
                      <tr key={r.id} className="border-b border-primary-100 cursor-pointer hover:bg-primary-50/80" onClick={() => setSelectedJourneySessionId(r.session_id)}>
                        <td className="p-2 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                        <td className="p-2 w-32 break-words whitespace-normal text-xs">{(r.user_phone || r.user_name) ? [r.user_phone, r.user_name].filter(Boolean).join(' — ') : '—'}</td>
                        <td className="p-2 font-mono text-xs">{r.session_id.slice(0, 12)}…</td>
                        <td className="p-2">{r.event_type}</td>
                        <td className="p-2">{r.page_or_route ?? '—'}</td>
                        <td className="p-2 max-w-xs truncate" title={r.payload ?? ''}>{r.payload ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                )}
                {logsFiltersApplied && (
                <div className="flex items-center justify-between border-t border-primary-200 px-4 py-2">
                  <span className="text-sm text-muted-foreground">Page {logPage} of {Math.max(1, Math.ceil(journeyLogTotal / 25))}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={logPage <= 1} onClick={() => setLogPage((p) => p - 1)}>Previous</Button>
                    <Button variant="outline" size="sm" disabled={logPage >= Math.ceil(journeyLogTotal / 25)} onClick={() => setLogPage((p) => p + 1)}>Next</Button>
                  </div>
                </div>
                )}
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
                <p className="text-sm text-muted-foreground">Total: {apiLogTotal} — Click a row for details (request/response payload)</p>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                {!logsFiltersApplied ? (
                  <div className="p-8 text-center text-muted-foreground">Set date range and click Apply filters to load data.</div>
                ) : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-primary-200 bg-primary-50/50 sticky top-0 z-10 bg-primary-50 shadow-sm"><th className="text-left p-2">Time</th><th className="text-left p-2">Method</th><th className="text-left p-2">Path</th><th className="text-left p-2 w-32">User (mobile, name)</th><th className="text-left p-2">Status</th><th className="text-left p-2">Time (ms)</th><th className="text-left p-2 max-w-[120px]">Request</th><th className="text-left p-2 max-w-[120px]">Response</th></tr></thead>
                  <tbody>
                    {apiLogRows.map((r) => (
                      <tr key={r.id} className="border-b border-primary-100 cursor-pointer hover:bg-primary-50/80" onClick={() => setSelectedApiLog(r)}>
                        <td className="p-2 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                        <td className="p-2">{r.method}</td>
                        <td className="p-2 font-mono text-xs">{r.path}</td>
                        <td className="p-2 w-32 break-words whitespace-normal text-xs">{(r.user_phone || r.user_name) ? [r.user_phone, r.user_name].filter(Boolean).join(' — ') : '—'}</td>
                        <td className="p-2"><span className={r.response_status >= 400 ? 'text-red-600' : 'text-green-600'}>{r.response_status}</span></td>
                        <td className="p-2">{r.response_time_ms}</td>
                        <td className="p-2 max-w-[120px] truncate text-xs" title={r.request_body_preview ?? r.request_body ?? ''}>{r.request_body_preview ?? r.request_body ?? '—'}</td>
                        <td className="p-2 max-w-[120px] truncate text-xs" title={r.response_body_preview ?? r.response_body ?? ''}>{r.response_body_preview ?? r.response_body ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                )}
                {logsFiltersApplied && (
                <div className="flex items-center justify-between border-t border-primary-200 px-4 py-2">
                  <span className="text-sm text-muted-foreground">Page {logPage} of {Math.max(1, Math.ceil(apiLogTotal / 25))}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={logPage <= 1} onClick={() => setLogPage((p) => p - 1)}>Previous</Button>
                    <Button variant="outline" size="sm" disabled={logPage >= Math.ceil(apiLogTotal / 25)} onClick={() => setLogPage((p) => p + 1)}>Next</Button>
                  </div>
                </div>
                )}
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
                {!logsFiltersApplied ? (
                  <div className="p-8 text-center text-muted-foreground">Set date range and click Apply filters to load data.</div>
                ) : (
                <>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-primary-200 bg-primary-50/50 sticky top-0 z-10 bg-primary-50 shadow-sm"><th className="text-left p-2">Time</th><th className="text-left p-2">Source</th><th className="text-left p-2">Level</th><th className="text-left p-2">Message</th><th className="text-left p-2">Path</th></tr></thead>
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
                </>
                )}
              </CardContent>
            </Card>
          )}

          {logsSubTab === 'analytics' && (
            <>
              <Card className="border-primary-200 bg-primary-50/30">
                <CardContent className="pt-4 pb-4">
                  <h3 className="font-medium text-primary-800 mb-2">What do these charts mean?</h3>
                  <p className="text-sm text-muted-foreground">
                    <strong>Email/SMS by day</strong> — How many emails and SMS we sent (e.g. booking confirmations, OTPs). Use this to see if notifications are going out. &bull;{' '}
                    <strong>User journey by day</strong> — How often users viewed pages or clicked things. Helps spot popular flows. &bull;{' '}
                    <strong>API responses by day</strong> — Green (2xx) = success; yellow (4xx) = client issues; red (5xx) = server issues. &bull;{' '}
                    <strong>Errors by day</strong> — Where errors came from (website, API, or database). Helps prioritise fixes.
                  </p>
                </CardContent>
              </Card>
              {!logsFiltersApplied ? (
                <Card className="border-primary-200"><CardContent className="py-12 text-center text-muted-foreground">Set date range and click Apply filters to load analytics.</CardContent></Card>
              ) : !analyticsData ? (
                <Card className="border-primary-200"><CardContent className="py-12 text-center text-muted-foreground">No data for the selected date range.</CardContent></Card>
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
            <>
              <Card className="border-primary-200 bg-primary-50/30">
                <CardContent className="pt-4 pb-4">
                  <h3 className="font-medium text-primary-800 mb-2">What do these show?</h3>
                  <p className="text-sm text-muted-foreground">
                    <strong>Page view heat map</strong> — Which pages or screens were opened most often (e.g. /search, /listings/5). Use this to see what users look at. &bull;{' '}
                    <strong>Click events</strong> — Where on the page users clicked (useful to see which buttons or areas get used). Filter by path to inspect one page.
                  </p>
                </CardContent>
              </Card>
              {!logsFiltersApplied ? (
                <Card className="border-primary-200"><CardContent className="py-12 text-center text-muted-foreground">Set date range and click Apply filters to load heat map data.</CardContent></Card>
              ) : (
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
                    <thead><tr className="border-b border-primary-200 bg-primary-50/50 sticky top-0 z-10 bg-primary-50 shadow-sm"><th className="text-left p-2">Path</th><th className="text-right p-2">Views</th></tr></thead>
                    <tbody>
                      {heatmapPageViews.map((r, i) => (
                        <tr key={i} className="border-b border-primary-100 cursor-pointer hover:bg-primary-50/80" onClick={() => setSelectedHeatmapPath(selectedHeatmapPath === r.path ? null : r.path)}>
                          <td className="p-2 font-mono text-xs">{r.path}</td>
                          <td className="p-2 text-right font-medium">{(r.views ?? 0).toLocaleString()}</td>
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
                    <thead><tr className="border-b border-primary-200 bg-primary-50/50 sticky top-0 z-10 bg-primary-50 shadow-sm"><th className="text-left p-2">Time</th><th className="text-left p-2">Page</th><th className="text-left p-2">Payload (x, y, tag)</th></tr></thead>
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
            </>
          )}
        </div>
      )}

      {/* Log detail dialogs */}
      <Dialog.Root open={!!emailSmsDetail} onOpenChange={(open) => { if (!open) { setSelectedEmailSmsId(null); setEmailSmsDetail(null); } }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content aria-describedby={undefined} className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-primary-200 bg-background shadow-lg overflow-hidden flex flex-col">
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
          <Dialog.Content aria-describedby={undefined} className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-primary-200 bg-background shadow-lg overflow-hidden flex flex-col">
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
          <Dialog.Content aria-describedby={undefined} className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-primary-200 bg-background p-6 shadow-lg overflow-y-auto">
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
                  <div><dt className="text-muted-foreground">User (mobile, name)</dt><dd className="break-words">{(selectedApiLog.user_phone || selectedApiLog.user_name) ? [selectedApiLog.user_phone, selectedApiLog.user_name].filter(Boolean).join(' — ') : (selectedApiLog.user_id ?? '—')}</dd></div>
                  <div><dt className="text-muted-foreground">Response status</dt><dd><span className={selectedApiLog.response_status >= 400 ? 'text-red-600' : 'text-green-600'}>{selectedApiLog.response_status}</span></dd></div>
                  <div><dt className="text-muted-foreground">Response time</dt><dd>{selectedApiLog.response_time_ms} ms</dd></div>
                </dl>
                {(selectedApiLog.request_body != null && selectedApiLog.request_body !== '') && (
                  <div className="mt-4">
                    <div className="font-medium text-muted-foreground mb-1">Request payload</div>
                    <pre className="rounded bg-primary-50 p-3 text-xs whitespace-pre-wrap break-words max-h-40 overflow-y-auto">{selectedApiLog.request_body}</pre>
                  </div>
                )}
                {(selectedApiLog.response_body != null && selectedApiLog.response_body !== '') && (
                  <div className="mt-4">
                    <div className="font-medium text-muted-foreground mb-1">Response</div>
                    <pre className="rounded bg-primary-50 p-3 text-xs whitespace-pre-wrap break-words max-h-40 overflow-y-auto">{selectedApiLog.response_body}</pre>
                  </div>
                )}
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={!!selectedErrorLog} onOpenChange={(open) => !open && setSelectedErrorLog(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content aria-describedby={undefined} className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-primary-200 bg-background shadow-lg overflow-hidden flex flex-col">
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

      {/* Booking details & invoice dialog */}
      <Dialog.Root open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content aria-describedby={undefined} className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg max-h-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-primary-200 bg-background p-6 shadow-lg overflow-y-auto">
            {selectedBooking && (() => {
              const subtotal = selectedBooking.subtotal_npr != null ? Number(selectedBooking.subtotal_npr) : null;
              const total = selectedBooking.total_amount != null ? Number(selectedBooking.total_amount) : null;
              const amenityLines = parseAmenityChargesJson(selectedBooking.amenity_charges_json);
              const feeDelta = bookingFeeDelta(subtotal, amenityLines, total);
              const hasInvoice =
                subtotal != null ||
                total != null ||
                amenityLines.length > 0 ||
                feeDelta.serviceChargeNpr != null ||
                feeDelta.discountNpr != null;
              const downloadInvoicePdf = () => {
                const doc = new jsPDF();
                doc.setFontSize(18);
                doc.text('Booking Invoice / Price Quotation', 20, 20);
                doc.setFontSize(11);
                let y = 36;
                doc.text(`Booking ID: ${selectedBooking.id}`, 20, y); y += 7;
                doc.text(`Listing: ${selectedBooking.listing_title}`, 20, y); y += 7;
                doc.text(`Guest: ${selectedBooking.guest_name} (${selectedBooking.guest_email})`, 20, y); y += 7;
                doc.text(`Check-in: ${formatDateOnly(selectedBooking.check_in)}`, 20, y); y += 7;
                doc.text(`Check-out: ${formatDateOnly(selectedBooking.check_out)}`, 20, y); y += 7;
                doc.text(`Guests: ${selectedBooking.guests}`, 20, y); y += 7;
                doc.text(`Online payment: ${formatBookingPaymentMethod(selectedBooking.payment_provider)}`, 20, y); y += 7;
                doc.text(`Created: ${formatDateOnly(selectedBooking.created_at)}`, 20, y); y += 10;
                if (subtotal != null) {
                  doc.text(`Accommodation subtotal: NPR ${subtotal.toLocaleString()}`, 20, y); y += 7;
                }
                amenityLines.forEach((line) => {
                  doc.text(`${line.name} (×${line.quantity}): NPR ${line.total.toLocaleString()}`, 20, y); y += 6;
                });
                if (feeDelta.preFeeTotalNpr > 0 && (subtotal != null || amenityLines.length > 0)) {
                  doc.text(`Subtotal (accommodation + add-ons): NPR ${feeDelta.preFeeTotalNpr.toLocaleString()}`, 20, y); y += 7;
                }
                if (feeDelta.serviceChargeNpr != null) {
                  doc.text(`Service charge (booking fee): NPR ${feeDelta.serviceChargeNpr.toLocaleString()}`, 20, y); y += 7;
                }
                if (feeDelta.discountNpr != null) {
                  doc.text(`Discount: NPR ${feeDelta.discountNpr.toLocaleString()}`, 20, y); y += 7;
                }
                if (total != null) {
                  y += 4;
                  doc.setFont('helvetica', 'bold');
                  doc.text(`Total (guest pays): NPR ${total.toLocaleString()}`, 20, y);
                  doc.setFont('helvetica', 'normal');
                }
                doc.save(`booking-invoice-${selectedBooking.id}.pdf`);
                toast({ title: 'Invoice downloaded.' });
              };
              return (
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
                    <div><dt className="font-medium text-muted-foreground">Online payment</dt><dd className="text-primary-800">{formatBookingPaymentMethod(selectedBooking.payment_provider)}</dd></div>
                    <div><dt className="font-medium text-muted-foreground">Created</dt><dd className="text-primary-800">{formatDateOnly(selectedBooking.created_at)}</dd></div>
                    {selectedBooking.offline_payment_proof_url && (
                      <div>
                        <dt className="font-medium text-muted-foreground">Offline payment slip</dt>
                        <dd>
                          <OfflineProofPreview url={selectedBooking.offline_payment_proof_url} />
                        </dd>
                      </div>
                    )}
                    {selectedBooking.offline_payment_remarks && (
                      <div><dt className="font-medium text-muted-foreground">Offline remarks</dt><dd className="text-primary-800 whitespace-pre-wrap">{selectedBooking.offline_payment_remarks}</dd></div>
                    )}
                  </dl>
                  {selectedBooking.status === 'pending' && (
                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-sm space-y-3">
                      <p className="font-semibold text-primary-800">Offline reservation — confirm payment</p>
                      <p className="text-muted-foreground">Upload a payment confirmation slip, add optional remarks, then mark the booking as paid.</p>
                      <div>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="block w-full text-xs"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            const fd = new FormData();
                            fd.append('image', f);
                            try {
                              const res = await api.post<{ url: string }>('/api/admin/notifications/upload-image', fd, {
                                headers: { 'Content-Type': 'multipart/form-data' },
                              });
                              setOfflineProofUrl(res.data.url);
                              toast({ title: 'Slip uploaded.' });
                            } catch {
                              toast({ title: 'Upload failed.', variant: 'destructive' });
                            }
                            e.target.value = '';
                          }}
                        />
                        {offlineProofUrl ? (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground break-all">Preview</p>
                            <OfflineProofPreview url={offlineProofUrl} />
                          </div>
                        ) : null}
                      </div>
                      <Textarea
                        value={offlineRemarks}
                        onChange={(e) => setOfflineRemarks(e.target.value)}
                        placeholder="Remarks (e.g. bank reference, amount received)"
                        rows={3}
                        className="border-primary-200"
                      />
                      <Button
                        type="button"
                        className="bg-accent-500 hover:bg-accent-600"
                        disabled={offlineApproving || !offlineProofUrl.trim()}
                        onClick={() => {
                          if (!selectedBooking) return;
                          setOfflineApproving(true);
                          api
                            .post<{ message: string }>(`/api/admin/bookings/${selectedBooking.id}/approve-offline-payment`, {
                              proof_url: offlineProofUrl.trim(),
                              remarks: offlineRemarks.trim() || null,
                            })
                            .then(() => {
                              toast({ title: 'Booking marked as paid.' });
                              setSelectedBooking({ ...selectedBooking, status: 'paid', offline_payment_proof_url: offlineProofUrl.trim(), offline_payment_remarks: offlineRemarks.trim() || null });
                              const params = new URLSearchParams();
                              if (adminBookingsStatus) params.set('status', adminBookingsStatus);
                              api.get<{ bookings: AdminBooking[]; total: number }>(`/api/admin/bookings?${params}`).then((r) => {
                                setAdminBookings(r.data.bookings || []);
                                setAdminBookingsTotal(r.data.total ?? 0);
                              }).catch(() => {});
                            })
                            .catch((err) => toast({ title: err.response?.data?.message || 'Failed to confirm', variant: 'destructive' }))
                            .finally(() => setOfflineApproving(false));
                        }}
                      >
                        {offlineApproving ? 'Saving…' : 'Confirm offline payment'}
                      </Button>
                    </div>
                  )}
                  {hasInvoice && (
                    <div className="mt-4 rounded-lg border border-primary-200 bg-primary-50/50 p-3">
                      <h4 className="font-semibold text-primary-800 mb-2">Invoice / Price quotation</h4>
                      <dl className="space-y-1 text-sm">
                        {subtotal != null && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Accommodation subtotal</dt>
                            <dd>NPR {subtotal.toLocaleString()}</dd>
                          </div>
                        )}
                        {amenityLines.map((line, i) => (
                          <div key={i} className="flex justify-between">
                            <dt className="text-muted-foreground">{line.name} (×{line.quantity})</dt>
                            <dd>NPR {line.total.toLocaleString()}</dd>
                          </div>
                        ))}
                        {(subtotal != null || amenityLines.length > 0) && feeDelta.preFeeTotalNpr > 0 && (
                          <div className="flex justify-between border-t border-primary-200/80 pt-1 mt-1 text-primary-800">
                            <dt className="font-medium">Subtotal (stay + add-ons)</dt>
                            <dd className="font-medium">NPR {feeDelta.preFeeTotalNpr.toLocaleString()}</dd>
                          </div>
                        )}
                        {feeDelta.serviceChargeNpr != null && (
                          <div className="flex justify-between text-primary-800">
                            <dt className="text-muted-foreground">Service charge (booking fee)</dt>
                            <dd>+ NPR {feeDelta.serviceChargeNpr.toLocaleString()}</dd>
                          </div>
                        )}
                        {feeDelta.discountNpr != null && (
                          <div className="flex justify-between text-primary-800">
                            <dt className="text-muted-foreground">Discount</dt>
                            <dd>− NPR {feeDelta.discountNpr.toLocaleString()}</dd>
                          </div>
                        )}
                        {total != null && (
                          <div className="flex justify-between font-semibold text-primary-800 mt-2 pt-2 border-t border-primary-200">
                            <dt>Total (guest pays)</dt>
                            <dd>NPR {total.toLocaleString()}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2 justify-end">
                    {hasInvoice && (
                      <Button variant="outline" size="sm" onClick={downloadInvoicePdf}>
                        <Download className="mr-1.5 h-4 w-4" />
                        Download PDF
                      </Button>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/listings/${selectedBooking.listing_id}`} state={{ from: 'admin' }} onClick={() => setSelectedBooking(null)}>View listing</Link>
                    </Button>
                  </div>
                </>
              );
            })()}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Transaction receipt dialog */}
      <Dialog.Root open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content aria-describedby={undefined} className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-primary-200 bg-background p-6 shadow-lg">
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
                doc.text(`Payment method: ${formatBookingPaymentMethod(p.payment_provider)}`, 20, y); y += 8;
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
                    <div><dt className="font-medium text-muted-foreground">Payment method</dt><dd className="text-primary-800">{formatBookingPaymentMethod(p.payment_provider)}</dd></div>
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
