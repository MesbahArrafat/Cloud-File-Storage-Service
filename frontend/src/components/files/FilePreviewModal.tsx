import type { File } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Download } from 'lucide-react';

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export function FilePreviewModal({ file, onClose }: { file: File; onClose: () => void }) {
  const isImage = IMAGE_MIMES.includes(file.mime_type);
  const isPDF = file.mime_type === 'application/pdf';

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = file.download_url;
    a.download = file.original_filename;
    a.click();
  };

  return (
    <Modal isOpen onClose={onClose} title={file.filename} size="lg">
      <div className="space-y-4">
        {isImage && (
          <div className="flex justify-center rounded-lg bg-gray-100 p-4 max-h-96 overflow-auto">
            <img src={file.preview_url} alt={file.filename} className="max-h-80 object-contain rounded" />
          </div>
        )}
        {isPDF && (
          <iframe src={file.preview_url} title={file.filename} className="w-full h-96 rounded-lg border" />
        )}
        <div className="flex justify-end">
          <Button onClick={handleDownload} variant="secondary">
            <Download className="h-4 w-4" /> Download
          </Button>
        </div>
      </div>
    </Modal>
  );
}
