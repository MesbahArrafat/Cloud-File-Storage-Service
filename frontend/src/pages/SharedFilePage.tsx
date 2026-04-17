import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Cloud, FileText } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';

interface SharedFileInfo {
  filename: string;
  size: number;
  mime_type: string;
  share_token: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SharedFilePage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [fileInfo, setFileInfo] = useState<SharedFileInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`/api/share/${token}/`)
      .then((res) => {
        if (!res.ok) throw new Error('File not found or link expired.');
        return res.json();
      })
      .then((data: SharedFileInfo) => {
        setFileInfo(data);
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleDownload = () => {
    window.location.href = `/api/share/${token}/?action=download`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center">
        <Cloud className="h-12 w-12 text-primary-600 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Shared File</h1>
        {error ? (
          <p className="text-sm text-red-500 mb-6">{error}</p>
        ) : fileInfo ? (
          <>
            <div className="flex items-center justify-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-gray-400" />
              <p className="text-base font-medium text-gray-800 truncate max-w-[280px]">{fileInfo.filename}</p>
            </div>
            <p className="text-sm text-gray-500 mb-6">{formatSize(fileInfo.size)}</p>
            <Button onClick={handleDownload} className="w-full">
              <Download className="h-4 w-4" /> Download file
            </Button>
          </>
        ) : (
          <p className="text-sm text-gray-500 mb-6">File not found or link has expired.</p>
        )}
      </div>
    </div>
  );
}
