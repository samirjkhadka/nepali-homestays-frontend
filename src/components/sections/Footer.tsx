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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { assets } from '@/lib/design-tokens';

const footerLinks = {
  company: [
    { key: 'footer.aboutUs', href: '/about' },
    { key: 'footer.ourTeam', href: '/cms/our-team' },
    { key: 'footer.careers', href: '/cms/careers' },
    { key: 'footer.press', href: '/cms/press' },
  ],
  explore: [
    { key: 'footer.allHomestays', href: '/search' },
    { key: 'footer.travelPackages', href: '/search' },
    { key: 'footer.destinations', href: '/search' },
    { key: 'footer.experiences', href: '/search' },
  ],
  support: [
    { key: 'footer.helpCenter', href: '/cms/help' },
    { key: 'footer.safety', href: '/cms/safety' },
    { key: 'footer.cancellation', href: '/cms/cancellation' },
    { key: 'footer.faqs', href: '/cms/faqs' },
  ],
  legal: [
    { key: 'footer.privacy', href: '/cms/privacy' },
    { key: 'footer.terms', href: '/cms/terms' },
    { key: 'footer.cookies', href: '/cms/cookies' },
  ],
};

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Youtube, href: '#', label: 'YouTube' },
  { icon: Twitter, href: '#', label: 'Twitter' },
];

const sectionContainerClass = 'container mx-auto px-4';

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
    <footer className="bg-muted/50 text-foreground border-t border-border">
      {/* Newsletter Section */}
      <div className="border-b border-border">
        <div className={`${sectionContainerClass} py-12`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div>
              <h3 className="font-display text-2xl font-bold mb-2">
                {t('footer.newsletter')}
              </h3>
              <p className="text-muted-foreground">
                {t('footer.newsletterDesc')}
              </p>
            </div>
            <div className="flex w-full md:w-auto gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-80 px-4 py-3 bg-background rounded-xl border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <Button className="px-6 py-3 bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl">
                <Send className="w-4 h-4 mr-2" />
                {t('footer.subscribe')}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* CTA: List your Homestay + Be our partner */}
      <div className="border-b border-border bg-muted/30">
        <div className={`${sectionContainerClass} py-8`}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={handleListYourHomestay}
              className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl px-8 py-3 text-base font-semibold shadow-lg"
            >
              <Home className="w-5 h-5 mr-2" />
              {user?.role === 'host' ? t('footer.addListing') : t('footer.listHomestay')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setPartnerOpen(true)}
              className="rounded-xl px-8 py-3 text-base font-semibold border-2 border-primary text-primary hover:bg-primary/10"
            >
              <Handshake className="w-5 h-5 mr-2" />
              {t('footer.bePartner')}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className={`${sectionContainerClass} py-16`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img src={assets.logo} alt="" className="h-12 w-auto" />
              <span className="font-display text-2xl font-semibold">
                Nepali Homestays
              </span>
            </div>
            <p className="text-muted-foreground mb-6">
              Experience the warmth of Nepali hospitality. We connect travelers with authentic
              homestay experiences across Nepal&apos;s beautiful landscapes.
            </p>

            {/* Contact Info (from CMS: address, contact_phone, contact_email) */}
            <div className="space-y-3 text-muted-foreground">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-accent shrink-0" />
                <span>{contactInfo.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-accent shrink-0" />
                <span>{contactInfo.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-accent shrink-0" />
                <a href={`mailto:${contactInfo.email}`} className="text-accent hover:underline">
                  {contactInfo.email}
                </a>
              </div>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-4">{t('footer.company')}</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.key}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-accent transition-colors"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-lg mb-4">{t('footer.explore')}</h4>
            <ul className="space-y-3">
              {footerLinks.explore.map((link) => (
                <li key={link.key}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-accent transition-colors"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-lg mb-4">{t('footer.support')}</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.key}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-accent transition-colors"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-lg mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.key}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-accent transition-colors"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className={`${sectionContainerClass} py-6`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              © 2026 Nepali Homestays. All rights reserved.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
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
