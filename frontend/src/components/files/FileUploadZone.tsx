import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import { useUploadFile } from '../../hooks/useFiles';
import { Button } from '../ui/Button';

interface FileUploadZoneProps {
  folderId?: string | null;
  onClose?: () => void;
}

interface UploadItem {
  file: globalThis.File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
}

export function FileUploadZone({ folderId, onClose }: FileUploadZoneProps) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const { mutateAsync: upload } = useUploadFile();

  const onDrop = useCallback((accepted: globalThis.File[]) => {
    const newItems = accepted.map((f) => ({ file: f, progress: 0, status: 'pending' as const }));
    setItems((prev) => [...prev, ...newItems]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const uploadAll = async () => {
    for (let i = 0; i < items.length; i++) {
      if (items[i].status !== 'pending') continue;
      setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, status: 'uploading' } : item));
      try {
        const formData = new FormData();
        formData.append('file', items[i].file);
        if (folderId) formData.append('folder', folderId);
        await upload({
          formData,
          onProgress: (pct) => setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, progress: pct } : item)),
        });
        setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, status: 'done', progress: 100 } : item));
      } catch {
        setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, status: 'error' } : item));
      }
    }
  };

  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
          isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
        <p className="text-sm font-medium text-gray-700">
          {isDragActive ? 'Drop files here' : 'Drag & drop files or click to browse'}
        </p>
        <p className="text-xs text-gray-500 mt-1">Maximum file size: 100MB</p>
      </div>

      {items.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border bg-white p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{item.file.name}</p>
                <p className="text-xs text-gray-500">{formatSize(item.file.size)}</p>
                {item.status === 'uploading' && (
                  <div className="mt-1 h-1.5 rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-primary-500 transition-all"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {item.status === 'done' && <span className="text-xs text-green-600 font-medium">Done</span>}
                {item.status === 'error' && <span className="text-xs text-red-600 font-medium">Error</span>}
                {item.status === 'uploading' && <span className="text-xs text-primary-600">{item.progress}%</span>}
                {item.status !== 'uploading' && (
                  <button onClick={() => removeItem(i)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-3">
        {onClose && <Button variant="secondary" onClick={onClose}>Close</Button>}
        {items.some((i) => i.status === 'pending') && (
          <Button onClick={uploadAll}>Upload {items.filter((i) => i.status === 'pending').length} file(s)</Button>
        )}
      </div>
    </div>
  );
}
