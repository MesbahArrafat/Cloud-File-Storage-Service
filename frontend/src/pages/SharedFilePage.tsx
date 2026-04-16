import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Cloud } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';

export function SharedFilePage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(false);
  }, [token]);

  const handleDownload = () => {
    window.location.href = `/share/${token}/`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center">
        <Cloud className="h-12 w-12 text-primary-600 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Shared File</h1>
        <p className="text-sm text-gray-500 mb-6">Someone shared a file with you via CloudDrive.</p>
        <Button onClick={handleDownload} className="w-full">
          <Download className="h-4 w-4" /> Download file
        </Button>
      </div>
    </div>
  );
}
