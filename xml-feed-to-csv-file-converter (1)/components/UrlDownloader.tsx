import React, { useState } from 'react';
import { Download, Globe, AlertCircle } from 'lucide-react';

export const UrlDownloader: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    if (!url) return;
    setIsLoading(true);

    try {
      // Attempt 1: Direct fetch (works if CORS is allowed)
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        // Try to guess filename from URL or default
        const fileName = url.split('/').pop()?.split('?')[0] || 'feed.xml';
        a.download = fileName.endsWith('.xml') ? fileName : `${fileName}.xml`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
        setIsLoading(false);
        return;
      } catch (e) {
        // Fallback intentionally
        console.log("CORS blocked direct download, switching to fallback");
      }

      // Attempt 2: Open in new tab (Fallback for CORS)
      window.open(url, '_blank');
      setIsLoading(false);
    } catch (error) {
      console.error('Download failed', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-2xl p-8 border border-white/10 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-[#F54A23]/10 p-3 rounded-full">
          <Globe className="text-[#F54A23]" size={24} />
        </div>
        <h3 className="text-xl font-bold text-[#083027]">Download from URL</h3>
      </div>
      
      <div className="space-y-4 flex-1">
        <div>
          <label className="block text-sm font-medium text-[#083027]/70 mb-1">
            Feed URL
          </label>
          <input 
            type="url" 
            placeholder="https://example.com/feed.xml"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full bg-[#E6F0EE] border border-[#083027]/10 rounded-lg px-4 py-3 text-[#083027] focus:ring-2 focus:ring-[#F54A23] focus:border-transparent outline-none transition-all placeholder-[#083027]/30"
          />
        </div>

        <button
          onClick={handleDownload}
          disabled={!url || isLoading}
          className="w-full bg-[#083027] hover:bg-[#0b4034] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            'Starting download...'
          ) : (
            <>
              <Download size={20} />
              Download to Computer
            </>
          )}
        </button>

        <div className="bg-[#F54A23]/5 rounded-lg p-4 flex gap-3 items-start mt-4">
          <AlertCircle className="text-[#F54A23] shrink-0 mt-0.5" size={16} />
          <p className="text-xs text-[#083027]/70 leading-relaxed">
            <strong>Note:</strong> Due to browser security (CORS), some links might open in a new tab instead of downloading automatically. If that happens, press <span className="font-mono bg-[#083027]/10 px-1 rounded">Ctrl + S</span> to save the file.
          </p>
        </div>
      </div>
    </div>
  );
};