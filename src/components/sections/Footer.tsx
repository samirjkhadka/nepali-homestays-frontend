import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  Send,
  Home,
  Handshake,
  X,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { assets } from '@/lib/design-tokens';

const footerLinks = {
  company: [
    { key: 'footer.aboutUs', href: '/about' },
    { key: 'footer.ourTeam', href: '/team' },
    { key: 'footer.careers', href: '/careers' },
    { key: 'footer.press', href: '/press' },
  ],
  explore: [
    { key: 'footer.allHomestays', href: '/search' },
    { key: 'footer.travelPackages', href: '/packages' },
    { key: 'footer.destinations', href: '/destinations' },
    { key: 'footer.experiences', href: '/experiences' },
  ],
  support: [
    { key: 'footer.helpCenter', href: '/help' },
    { key: 'footer.safety', href: '/safety' },
    { key: 'footer.cancellation', href: '/cancellation' },
    { key: 'footer.faqs', href: '/faqs' },
  ],
  legal: [
    { key: 'footer.privacy', href: '/privacy' },
    { key: 'footer.terms', href: '/terms' },
    { key: 'footer.cookies', href: '/cookies' },
  ],
};

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Youtube, href: '#', label: 'YouTube' },
  { icon: Twitter, href: '#', label: 'Twitter' },
];

const partnerFormDefaults = {
  name: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state_province: '',
  country: 'Nepal',
  postal_code: '',
  notes: '',
};

type CmsSection = { section_key: string; content: string | null };

const defaultContact = {
  address: 'Thamel, Kathmandu, Nepal',
  phone: '+977 1-4123456',
  email: 'info@nepalihomestays.com',
};

export default function Footer() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [partnerForm, setPartnerForm] = useState(partnerFormDefaults);
  const [partnerSubmitting, setPartnerSubmitting] = useState(false);
  const [partnerMessage, setPartnerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [contactInfo, setContactInfo] = useState(defaultContact);
  const [visitorCount, setVisitorCount] = useState<number>(0);

  useEffect(() => {
    api
      .get<{ sections: CmsSection[] }>('/api/cms/sections?place=footer')
      .then((res) => {
        const sections = res.data?.sections ?? [];
        const byKey = (key: string) => sections.find((s) => s.section_key === key)?.content?.trim();
        setContactInfo({
          address: byKey('address') || defaultContact.address,
          phone: byKey('contact_phone') || defaultContact.phone,
          email: byKey('contact_email') || defaultContact.email,
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    api
      .get<{ count: number }>('/api/stats/visitors')
      .then((res) => setVisitorCount(res.data?.count ?? 0))
      .catch(() => setVisitorCount(0));
  }, []);

  const handleListYourHomestay = () => {
    if (user?.role === 'host') {
      navigate('/host/listings/new');
    } else {
      navigate('/signup');
    }
  };

  const handlePartnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPartnerMessage(null);
    setPartnerSubmitting(true);
    api
      .post('/api/partner', {
        name: partnerForm.name.trim(),
        contact_name: partnerForm.contact_name.trim() || undefined,
        contact_email: partnerForm.contact_email.trim() || undefined,
        contact_phone: partnerForm.contact_phone.trim() || undefined,
        address_line1: partnerForm.address_line1.trim(),
        address_line2: partnerForm.address_line2.trim() || undefined,
        city: partnerForm.city.trim(),
        state_province: partnerForm.state_province.trim() || undefined,
        country: partnerForm.country.trim(),
        postal_code: partnerForm.postal_code.trim() || undefined,
        notes: partnerForm.notes.trim() || undefined,
      })
      .then(() => {
        setPartnerMessage({ type: 'success', text: 'Thank you for your interest. We will get back to you soon.' });
        setPartnerForm(partnerFormDefaults);
        setTimeout(() => {
          setPartnerOpen(false);
          setPartnerMessage(null);
        }, 2000);
      })
      .catch((err) => {
        setPartnerMessage({
          type: 'error',
          text: err.response?.data?.message || 'Something went wrong. Please try again.',
        });
      })
      .finally(() => setPartnerSubmitting(false));
  };

  return (
    <footer className="bg-foreground text-background">
      <div className="prayer-flag-strip h-1" aria-hidden />

      {/* Newsletter Section */}
      <div className="border-b border-background/10">
        <div className="section-container py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div>
              <h3 className="font-display text-2xl font-bold mb-2">{t('footer.newsletter')}</h3>
              <p className="text-background/70">{t('footer.newsletterDesc')}</p>
            </div>
            <div className="flex w-full md:w-auto gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-80 rounded-xl border border-background/20 bg-background/10 px-4 py-3 text-background placeholder:text-background/50 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <Button className="rounded-xl bg-accent px-6 py-3 text-accent-foreground hover:bg-accent/90">
                <Send className="mr-2 h-4 w-4" />
                {t('footer.subscribe')}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* CTA: List your Homestay + Be our partner */}
      <div className="border-b border-background/10">
        <div className="section-container py-8">
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              onClick={handleListYourHomestay}
              className="rounded-xl bg-accent px-8 py-3 text-base font-semibold text-accent-foreground shadow-lg hover:bg-accent/90"
            >
              <Home className="mr-2 h-5 w-5" />
              {user?.role === 'host' ? t('footer.addListing') : t('footer.listHomestay')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setPartnerOpen(true)}
              className="rounded-xl border-2 border-background/30 bg-transparent px-8 py-3 text-base font-semibold text-background hover:bg-background/10"
            >
              <Handshake className="mr-2 h-5 w-5" />
              {t('footer.bePartner')}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="section-container py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <div className="mb-6 flex items-center gap-3">
              <img src={assets.logo} alt="" className="h-12 w-auto rounded-md bg-white/10 p-1" />
              <span className="font-display text-2xl font-semibold">Nepali Homestays</span>
            </div>
            <p className="mb-6 leading-relaxed text-background/80">
              Experience the warmth of Nepali hospitality. We connect travelers with authentic homestay
              experiences across Nepal&apos;s beautiful landscapes.
            </p>
            <div className="space-y-3 text-background/70">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 shrink-0 text-accent" />
                <span>{contactInfo.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 shrink-0 text-accent" />
                <span>{contactInfo.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 shrink-0 text-accent" />
                <a href={`mailto:${contactInfo.email}`} className="text-accent hover:underline">
                  {contactInfo.email}
                </a>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-display text-lg font-semibold">{t('footer.company')}</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.key}>
                  <Link to={link.href} className="text-background/80 transition-colors hover:text-accent">
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-display text-lg font-semibold">{t('footer.explore')}</h4>
            <ul className="space-y-3">
              {footerLinks.explore.map((link) => (
                <li key={link.key}>
                  <Link to={link.href} className="text-background/70 transition-colors hover:text-accent">
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-display text-lg font-semibold">{t('footer.support')}</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.key}>
                  <Link to={link.href} className="text-background/70 transition-colors hover:text-accent">
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-display text-lg font-semibold">{t('footer.legal')}</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.key}>
                  <Link to={link.href} className="text-background/70 transition-colors hover:text-accent">
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-background/10">
        <div className="section-container py-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <p className="text-sm text-background/70">© 2026 Nepali Homestays. All rights reserved.</p>
              <p
                className="flex items-center gap-1.5 text-sm text-background/60"
                title="Total home page visits"
                data-visitor-count
              >
                <Eye className="h-4 w-4" aria-hidden />
                <span className="font-semibold tabular-nums">{visitorCount.toLocaleString()}</span>
                <span>visitors</span>
              </p>
              <span className="text-sm text-background/70">
                Made with <span className="text-destructive">&#9829;</span> in Nepal &#127475;&#127476;
              </span>
            </div>
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="tap-target flex h-10 w-10 items-center justify-center rounded-full bg-background/10 transition-colors hover:bg-accent hover:text-accent-foreground"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Be our partner modal */}
      <Dialog.Root open={partnerOpen} onOpenChange={setPartnerOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-xl font-semibold text-primary-800 flex items-center gap-2">
                <Handshake className="w-5 h-5 text-accent-500" />
                Be our partner
              </Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" className="p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Register as a corporate partner. We will review your request and get in touch. Complete address is required.
            </p>
            <form onSubmit={handlePartnerSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-800 mb-1">Company / Organization name *</label>
                <input
                  type="text"
                  required
                  value={partnerForm.name}
                  onChange={(e) => setPartnerForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Company name"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-800 mb-1">Contact name</label>
                  <input
                    type="text"
                    value={partnerForm.contact_name}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, contact_name: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-800 mb-1">Contact email</label>
                  <input
                    type="email"
                    value={partnerForm.contact_email}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, contact_email: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-800 mb-1">Contact phone</label>
                <input
                  type="tel"
                  value={partnerForm.contact_phone}
                  onChange={(e) => setPartnerForm((f) => ({ ...f, contact_phone: e.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="+977 98xxxxxx"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-800 mb-1">Address line 1 *</label>
                <input
                  type="text"
                  required
                  value={partnerForm.address_line1}
                  onChange={(e) => setPartnerForm((f) => ({ ...f, address_line1: e.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Street, building"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-800 mb-1">Address line 2</label>
                <input
                  type="text"
                  value={partnerForm.address_line2}
                  onChange={(e) => setPartnerForm((f) => ({ ...f, address_line2: e.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Suite, floor (optional)"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-800 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={partnerForm.city}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-800 mb-1">State / Province</label>
                  <input
                    type="text"
                    value={partnerForm.state_province}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, state_province: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="State or Province"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-800 mb-1">Country *</label>
                  <input
                    type="text"
                    required
                    value={partnerForm.country}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, country: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Country"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-800 mb-1">Postal code</label>
                  <input
                    type="text"
                    value={partnerForm.postal_code}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, postal_code: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Postal code"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-800 mb-1">Notes / Message</label>
                <textarea
                  value={partnerForm.notes}
                  onChange={(e) => setPartnerForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Tell us about your organization and how you'd like to partner."
                />
              </div>
              {partnerMessage && (
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    partnerMessage.type === 'success'
                      ? 'bg-green-500/10 text-green-800 border border-green-500/30'
                      : 'bg-destructive/10 text-destructive border border-destructive/30'
                  }`}
                >
                  {partnerMessage.text}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Dialog.Close asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </Dialog.Close>
                <Button type="submit" className="bg-accent-500 hover:bg-accent-600" disabled={partnerSubmitting}>
                  {partnerSubmitting ? 'Submitting…' : 'Submit'}
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </footer>
  );
}
