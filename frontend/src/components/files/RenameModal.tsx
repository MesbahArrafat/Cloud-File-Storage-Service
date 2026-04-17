import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { File } from '../../types';
import { useUpdateFile } from '../../hooks/useFiles';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

const schema = z.object({ filename: z.string().min(1, 'Name is required').max(255) });

type FormData = z.infer<typeof schema>;

export function RenameModal({ file, onClose }: { file: File; onClose: () => void }) {
  const { mutate: updateFile, isPending } = useUpdateFile();
  const { register, handleSubmit, formState: { errors }, setFocus } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { filename: file.filename },
  });

  useEffect(() => { setFocus('filename'); }, [setFocus]);

  const onSubmit: SubmitHandler<FormData> = ({ filename }) => {
    updateFile({ id: file.id, data: { filename } }, { onSuccess: onClose });
  };

  return (
    <Modal isOpen onClose={onClose} title="Rename file" size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="New name" {...register('filename')} error={errors.filename?.message as string | undefined} />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isPending}>Rename</Button>
        </div>
      </form>
    </Modal>
  );
}
