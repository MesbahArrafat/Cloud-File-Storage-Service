import { useState, useCallback } from 'react';
import { filesApi } from '../../api/files';
import { useQueryClient } from '@tanstack/react-query';
import { fileKeys } from '../../hooks/useFiles';
import toast from 'react-hot-toast';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

interface ChunkUploaderProps {
  folderId?: string | null;
  onComplete?: () => void;
}

export function ChunkUploader({ folderId, onComplete }: ChunkUploaderProps) {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const qc = useQueryClient();

  const upload = useCallback(async (file: File) => {
    setUploading(true);
    setProgress(0);
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    try {
      const session = await filesApi.initChunkUpload({ filename: file.name, total_chunks: totalChunks });
      for (let i = 0; i < totalChunks; i++) {
        const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        const fd = new FormData();
        fd.append('upload_id', session.upload_id);
        fd.append('chunk_index', String(i));
        fd.append('chunk', chunk);
        await filesApi.uploadChunk(fd);
        setProgress(Math.round(((i + 1) / totalChunks) * 100));
      }
      await filesApi.completeChunkUpload({ upload_id: session.upload_id, folder: folderId });
      qc.invalidateQueries({ queryKey: fileKeys.all });
      toast.success('File uploaded!');
      onComplete?.();
    } catch {
      toast.error('Chunked upload failed.');
    } finally {
      setUploading(false);
    }
  }, [folderId, onComplete, qc]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
  };

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Upload large file (chunked)</span>
        <input type="file" className="mt-1 block w-full text-sm text-gray-500" onChange={handleChange} disabled={uploading} />
      </label>
      {uploading && (
        <div>
          <div className="h-2 rounded-full bg-gray-200">
            <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-1">{progress}% uploaded</p>
        </div>
      )}
    </div>
  );
}
