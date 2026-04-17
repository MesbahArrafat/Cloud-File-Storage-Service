import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateFolder } from '../../hooks/useFolders';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

const schema = z.object({ name: z.string().min(1, 'Name is required').max(255) });

type FormData = z.infer<typeof schema>;

export function CreateFolderModal({ parentId, onClose }: { parentId?: string | null; onClose: () => void }) {
  const { mutate: createFolder, isPending } = useCreateFolder();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit: SubmitHandler<FormData> = ({ name }) => {
    createFolder({ name, parent: parentId || null }, { onSuccess: onClose });
  };

  return (
    <Modal isOpen onClose={onClose} title="New folder" size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Folder name" placeholder="My folder" autoFocus {...register('name')} error={errors.name?.message as string | undefined} />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isPending}>Create</Button>
        </div>
      </form>
    </Modal>
  );
}
