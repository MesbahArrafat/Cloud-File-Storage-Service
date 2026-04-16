import { useState } from 'react';
import { Copy, Check, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { File } from '../../types';
import { useGenerateShareLink } from '../../hooks/useFiles';
import { filesApi } from '../../api/files';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

const schema = z.object({
  shared_with_email: z.string().email('Invalid email'),
  can_download: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export function ShareModal({ file, onClose }: { file: File; onClose: () => void }) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sharingUser, setSharingUser] = useState(false);
  const { mutate: generateLink, isPending } = useGenerateShareLink();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { shared_with_email: '', can_download: true },
  });

  const handleGenerate = () => {
    generateLink(file.id, {
      onSuccess: (data) => setShareUrl(data.share_url),
    });
  };

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link copied!');
    }
  };

  const onShareWithUser: SubmitHandler<FormData> = async (data) => {
    setSharingUser(true);
    try {
      await filesApi.addPermission(file.id, { shared_with_email: data.shared_with_email, can_view: true, can_download: data.can_download });
      toast.success(`Shared with ${data.shared_with_email}`);
    } catch {
      toast.error('Failed to share with user.');
    } finally {
      setSharingUser(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={`Share "${file.filename}"`} size="md">
      <div className="space-y-6">
        {/* Public link */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Public link</h3>
          {!shareUrl ? (
            <Button onClick={handleGenerate} loading={isPending} variant="secondary" className="w-full">
              Generate shareable link
            </Button>
          ) : (
            <div className="flex gap-2">
              <input value={shareUrl} readOnly className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50" />
              <Button variant="secondary" onClick={handleCopy} size="md">
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>

        {/* Share with user */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Share with specific user</h3>
          <form onSubmit={handleSubmit(onShareWithUser)} className="space-y-3">
            <Input label="Email address" type="email" placeholder="user@example.com" {...register('shared_with_email')} error={errors.shared_with_email?.message as string | undefined} />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" {...register('can_download')} className="rounded border-gray-300 text-primary-600" />
              Allow download
            </label>
            <Button type="submit" loading={sharingUser} className="w-full">
              <UserPlus className="h-4 w-4" /> Share
            </Button>
          </form>
        </div>
      </div>
    </Modal>
  );
}
