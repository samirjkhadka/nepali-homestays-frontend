import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type RecipientRow = { email: string; phone: string; user_id: string };

export default function AdminSendNotifications() {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [channels, setChannels] = useState({ sms: false, email: false, push: false });
  const [mode, setMode] = useState<'individual' | 'bulk'>('individual');
  const [recipients, setRecipients] = useState<RecipientRow[]>([{ email: '', phone: '', user_id: '' }]);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return imageUrl || null;
    const form = new FormData();
    form.append('image', imageFile);
    const res = await api.post<{ url: string }>('/api/admin/notifications/upload-image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url ?? null;
  };

  const handleSendIndividual = async () => {
    const list = recipients
      .map((r) => ({
        email: r.email.trim() || undefined,
        phone: r.phone.trim() || undefined,
        user_id: r.user_id.trim() ? parseInt(r.user_id, 10) : undefined,
      }))
      .filter((r) => r.email || r.phone || (typeof r.user_id === 'number' && r.user_id > 0));
    if (list.length === 0) {
      toast({ title: 'Add at least one recipient (email, phone, or user ID)', variant: 'destructive' });
      return;
    }
    if (!title.trim() || !body.trim()) {
      toast({ title: 'Title and body are required', variant: 'destructive' });
      return;
    }
    if (!channels.sms && !channels.email && !channels.push) {
      toast({ title: 'Select at least one channel (SMS, Email, Push)', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      const url = await uploadImage();
      await api.post('/api/admin/notifications/send', {
        title: title.trim(),
        body: body.trim(),
        image_url: url || undefined,
        channels,
        recipients: list,
      });
      toast({ title: 'Notifications sent successfully' });
      setTitle('');
      setBody('');
      setImageUrl('');
      setImageFile(null);
      setRecipients([{ email: '', phone: '', user_id: '' }]);
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e && (e.response as { data?: { message?: string } })?.data?.message;
      const title = typeof msg === 'string' ? msg : 'Failed to send';
      toast({ title, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleSendBulk = async () => {
    if (!bulkFile) {
      toast({ title: 'Upload an Excel (.xlsx) file with columns: email, phone, user_id', variant: 'destructive' });
      return;
    }
    if (!title.trim() || !body.trim()) {
      toast({ title: 'Title and body are required', variant: 'destructive' });
      return;
    }
    if (!channels.sms && !channels.email && !channels.push) {
      toast({ title: 'Select at least one channel (SMS, Email, Push)', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      const url = await uploadImage();
      const form = new FormData();
      form.append('file', bulkFile);
      form.append('title', title.trim());
      form.append('body', body.trim());
      if (url || imageUrl.trim()) form.append('image_url', url || imageUrl.trim());
      form.append('channels_sms', String(channels.sms));
      form.append('channels_email', String(channels.email));
      form.append('channels_push', String(channels.push));
      await api.post('/api/admin/notifications/send-bulk', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast({ title: 'Bulk notifications sent successfully' });
      setTitle('');
      setBody('');
      setImageUrl('');
      setImageFile(null);
      setBulkFile(null);
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e && (e.response as { data?: { message?: string } })?.data?.message;
      const title = typeof msg === 'string' ? msg : 'Failed to send bulk';
      toast({ title, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const addRecipient = () => setRecipients((r) => [...r, { email: '', phone: '', user_id: '' }]);
  const removeRecipient = (i: number) => setRecipients((r) => r.filter((_, idx) => idx !== i));
  const updateRecipient = (i: number, field: keyof RecipientRow, value: string) => {
    setRecipients((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));
  };

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Admin
      </Link>
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-semibold text-foreground">Send Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Send SMS, Email, and/or Push notifications. Email and Push can include an image.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title" className="mt-1" />
          </div>
          <div>
            <Label>Body *</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message content" rows={4} className="mt-1" />
          </div>
          <div>
            <Label>Image (optional, for Email & Push)</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="file"
                accept="image/jpeg,image/png"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Or paste image URL"
              />
            </div>
          </div>
          <div>
            <Label>Channels</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={channels.sms} onChange={(e) => setChannels((c) => ({ ...c, sms: e.target.checked }))} />
                <span>SMS</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={channels.email} onChange={(e) => setChannels((c) => ({ ...c, email: e.target.checked }))} />
                <span>Email</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={channels.push} onChange={(e) => setChannels((c) => ({ ...c, push: e.target.checked }))} />
                <span>Push</span>
              </label>
            </div>
          </div>
          <div>
            <Label>Recipients</Label>
            <div className="flex gap-2 mt-1">
              <Button type="button" variant={mode === 'individual' ? 'default' : 'outline'} size="sm" onClick={() => setMode('individual')}>
                Individual
              </Button>
              <Button type="button" variant={mode === 'bulk' ? 'default' : 'outline'} size="sm" onClick={() => setMode('bulk')}>
                Bulk (xlsx)
              </Button>
            </div>
            {mode === 'individual' && (
              <div className="mt-3 space-y-2">
                {recipients.map((r, i) => (
                  <div key={i} className="flex gap-2 items-center flex-wrap">
                    <Input
                      placeholder="Email"
                      value={r.email}
                      onChange={(e) => updateRecipient(i, 'email', e.target.value)}
                      className="flex-1 min-w-[120px]"
                    />
                    <Input
                      placeholder="Phone"
                      value={r.phone}
                      onChange={(e) => updateRecipient(i, 'phone', e.target.value)}
                      className="flex-1 min-w-[100px]"
                    />
                    <Input
                      placeholder="User ID"
                      type="number"
                      value={r.user_id}
                      onChange={(e) => updateRecipient(i, 'user_id', e.target.value)}
                      className="w-24"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeRecipient(i)} disabled={recipients.length <= 1} aria-label="Remove">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addRecipient}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add recipient
                </Button>
              </div>
            )}
            {mode === 'bulk' && (
              <div className="mt-3">
                <Label className="text-muted-foreground text-xs block mb-1">Excel (.xlsx) with columns: email, phone, user_id</Label>
                <Input
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(e) => setBulkFile(e.target.files?.[0] ?? null)}
                />
                {bulkFile && <p className="text-sm text-muted-foreground mt-1">Selected: {bulkFile.name}</p>}
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              disabled={sending}
              onClick={mode === 'bulk' ? handleSendBulk : handleSendIndividual}
              className="bg-primary hover:bg-primary/90"
            >
              {sending ? 'Sending…' : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
