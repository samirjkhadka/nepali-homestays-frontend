/**
 * Shapes shared across the admin console.
 *
 * Lifted out of AdminDashboard as sections are extracted: a section component
 * cannot import a type declared inside the file it is being pulled out of, and
 * copying them would let the two drift.
 */

export type Corporate = { id: number; name: string; status: string; contact_name: string | null; contact_email: string | null; contact_phone: string | null; billing_method: string | null; approval_required: boolean; max_nightly_rate: number | null; notes: string | null; created_at: string; updated_at: string };
export type ChargeableAmenity = { id: number; listing_id: number; name: string; price_npr: number; charge_type: 'per_night' | 'one_time' };
export type AdminBooking = {
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
export type Listing = { id: number; title: string; host_id: number; status: string; created_at: string; badge?: string | null };
export type ApprovedListing = { id: number; title: string; location: string; badge: string | null };
export type User = { id: number; name: string; email: string; phone: string | null; role: string; created_at?: string; blocked?: boolean; host_listing_id?: number | null; host_listing_title?: string | null };
