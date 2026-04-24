import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Send, ImagePlus, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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

  const contactCards = [
    { icon: MapPin, title: 'Address', lines: [contactInfo.address] },
    { icon: Phone, title: 'Phone', lines: [contactInfo.phone] },
    { icon: Mail, title: 'Email', lines: [contactInfo.email, CONTACT_EMAIL] },
    { icon: Clock, title: 'Response time', lines: ['We usually reply within 1–2 business days.'] },
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background pb-16">
      <section className="bg-gradient-to-b from-primary/5 to-background pb-10 pt-12">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">Get in touch</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Questions about homestays or your booking? We&apos;re here to help.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="section-container py-10">
        <div className="mb-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {contactCards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card p-6 text-center shadow-soft"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <c.icon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="font-display font-semibold text-foreground">{c.title}</h2>
              {c.lines.map((line) => (
                <p key={line} className="mt-1 text-sm text-muted-foreground">
                  {c.title === 'Email' && line.includes('@') ? (
                    <a href={`mailto:${line}`} className="text-primary hover:underline">
                      {line}
                    </a>
                  ) : (
                    line
                  )}
                </p>
              ))}
            </motion.div>
          ))}
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="font-display text-xl font-semibold text-foreground">Send a message</h2>
            <div className="space-y-2">
              <Label htmlFor="contact-name">Name *</Label>
              <Input
                id="contact-name"
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Your name"
                className="bg-muted/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email *</Label>
              <Input
                id="contact-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                className="bg-muted/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-subject">Subject *</Label>
              <Input
                id="contact-subject"
                type="text"
                required
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="What is this about?"
                className="bg-muted/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-message">Message *</Label>
              <Textarea
                id="contact-message"
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Your message…"
                className="bg-muted/40"
              />
            </div>
            <div>
              <Label className="text-foreground">Image (optional, max 1 MB)</Label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  id="contact-image"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={onFileChange}
                  className="block w-full text-sm text-muted-foreground file:mr-2 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:text-primary-foreground"
                />
                <ImagePlus className="h-5 w-5 shrink-0 text-muted-foreground" />
              </div>
              {file && <p className="mt-1 text-sm text-muted-foreground">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
              {fileError && <p className="mt-1 text-sm text-destructive">{fileError}</p>}
            </div>
            {message && (
              <div
                className={`rounded-lg border px-3 py-2 text-sm ${
                  message.type === 'success'
                    ? 'border-green-500/30 bg-green-500/10 text-foreground'
                    : 'border-destructive/30 bg-destructive/10 text-destructive'
                }`}
              >
                {message.text}
              </div>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              <Send className="mr-2 h-4 w-4" />
              {submitting ? 'Sending…' : 'Send message'}
            </Button>
          </form>

          <div className="space-y-6">
            {loading ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : (
              <>
                {section?.content && (
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                    <h2 className="font-display mb-3 text-lg font-semibold text-foreground">From us</h2>
                    <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">{section.content}</div>
                  </div>
                )}
                {!section?.content && !loading && (
                  <p className="text-sm text-muted-foreground">
                    Form messages are delivered to {CONTACT_EMAIL}. You can also use the contact details on the left.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
