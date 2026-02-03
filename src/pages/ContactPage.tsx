import { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Send, ImagePlus } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

const CONTACT_EMAIL = 'admin@himalayanfoxtechnology.com.np';
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB

type CmsSection = { id: number; section_key: string; title: string | null; content: string | null; display_place: string; sort_order: number };
type CmsSectionListItem = { section_key: string; content: string | null };

const defaultContactInfo = {
  address: 'Thamel, Kathmandu, Nepal',
  phone: '+977 1-4123456',
  email: 'info@nepalihomestays.com',
};

export default function ContactPage() {
  const [section, setSection] = useState<CmsSection | null>(null);
  const [contactInfo, setContactInfo] = useState(defaultContactInfo);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    api
      .get<CmsSection>('/api/cms/sections/contact')
      .then((res) => setSection(res.data))
      .catch(() => setSection(null));
  }, []);

  useEffect(() => {
    api
      .get<{ sections: CmsSectionListItem[] }>('/api/cms/sections?place=footer')
      .then((res) => {
        const sections = res.data?.sections ?? [];
        const byKey = (key: string) => sections.find((s) => s.section_key === key)?.content?.trim();
        setContactInfo({
          address: byKey('address') || defaultContactInfo.address,
          phone: byKey('contact_phone') || defaultContactInfo.phone,
          email: byKey('contact_email') || defaultContactInfo.email,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const f = e.target.files?.[0];
    if (!f) {
      setFile(null);
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setFileError('Image must be 1 MB or smaller.');
      setFile(null);
      e.target.value = '';
      return;
    }
    const ok = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(f.type);
    if (!ok) {
      setFileError('Please upload a JPEG, PNG, GIF, or WebP image.');
      setFile(null);
      e.target.value = '';
      return;
    }
    setFile(f);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      setMessage({ type: 'error', text: 'Please fill in name, email, subject, and message.' });
      return;
    }
    setSubmitting(true);
    const body = new FormData();
    body.append('name', form.name.trim());
    body.append('email', form.email.trim());
    body.append('subject', form.subject.trim());
    body.append('message', form.message.trim());
    if (file) body.append('image', file);

    const headers: Record<string, string> = {};
    if (api.defaults.headers?.common) {
      Object.assign(headers, api.defaults.headers.common);
      delete (headers as Record<string, unknown>)['Content-Type'];
    }
    api
      .post('/api/contact', body, { headers })
      .then((res) => {
        setMessage({ type: 'success', text: res.data?.message || 'Your message has been sent.' });
        setForm({ name: '', email: '', subject: '', message: '' });
        setFile(null);
        setFileError(null);
        const input = document.getElementById('contact-image') as HTMLInputElement;
        if (input) input.value = '';
      })
      .catch((err) => {
        const msg = err.response?.data?.message || 'Failed to send. Please try again or email us directly.';
        setMessage({ type: 'error', text: msg });
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <h1 className="font-display text-3xl font-bold text-primary-800 mb-8">Contact</h1>

      {/* Contact form */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-12">
        <div>
          <label htmlFor="contact-name" className="block text-sm font-medium text-foreground mb-1">
            Name *
          </label>
          <input
            id="contact-name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-sm font-medium text-foreground mb-1">
            Email *
          </label>
          <input
            id="contact-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="contact-subject" className="block text-sm font-medium text-foreground mb-1">
            Subject *
          </label>
          <input
            id="contact-subject"
            type="text"
            required
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            placeholder="What is this about?"
          />
        </div>
        <div>
          <label htmlFor="contact-message" className="block text-sm font-medium text-foreground mb-1">
            Message *
          </label>
          <textarea
            id="contact-message"
            required
            rows={5}
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            placeholder="Your message..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Image (optional, max 1 MB)
          </label>
          <div className="flex items-center gap-2">
            <input
              id="contact-image"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={onFileChange}
              className="block w-full text-sm text-muted-foreground file:mr-2 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-accent-foreground file:text-sm"
            />
            <ImagePlus className="w-5 h-5 text-muted-foreground shrink-0" />
          </div>
          {file && <p className="mt-1 text-sm text-muted-foreground">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
          {fileError && <p className="mt-1 text-sm text-destructive">{fileError}</p>}
        </div>
        {message && (
          <div
            className={`rounded-lg px-3 py-2 text-sm ${
              message.type === 'success'
                ? 'bg-green-500/10 text-green-800 border border-green-500/30'
                : 'bg-destructive/10 text-destructive border border-destructive/30'
            }`}
          >
            {message.text}
          </div>
        )}
        <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
          <Send className="w-4 h-4 mr-2" />
          {submitting ? 'Sending…' : 'Send message'}
        </Button>
      </form>

      {/* Contact information below the form */}
      <div className="border-t border-border pt-8">
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <div className="space-y-6">
            {section?.content && (
              <div className="text-foreground whitespace-pre-wrap prose prose-primary max-w-none">{section.content}</div>
            )}
            <div className="flex flex-col gap-4 text-muted-foreground">
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
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-accent shrink-0" />
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">
                  {CONTACT_EMAIL}
                </a>
              </div>
            </div>
            {!section?.content && !loading && (
              <p className="text-muted-foreground text-sm">
                You can also reach us at the addresses above. Messages sent through the form are emailed to {CONTACT_EMAIL}.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
