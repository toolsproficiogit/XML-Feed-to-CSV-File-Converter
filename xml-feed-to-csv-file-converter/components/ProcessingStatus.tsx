import React from 'react';
import { ProcessingStats } from '../types';
import { Loader2, FileDown, Clock, Database } from 'lucide-react';

interface Props {
  stats: ProcessingStats;
  isComplete: boolean;
  onDownload: () => void;
  onReset: () => void;
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const ProcessingStatus: React.FC<Props> = ({ stats, isComplete, onDownload, onReset }) => {
  const progress = stats.totalBytes > 0 
    ? Math.min(100, (stats.processedBytes / stats.totalBytes) * 100) 
    : 0; // If URL size unknown, we might show indeterminate or just item count
  
  const duration = ((Date.now() - stats.startTime) / 1000).toFixed(1);

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden border border-white/10">
      <div className="p-8 text-center border-b border-[#083027]/5">
        {isComplete ? (
          <div className="flex justify-center mb-6">
             <div className="bg-[#F54A23]/10 p-4 rounded-full text-[#F54A23]">
               <FileDown size={40} />
             </div>
          </div>
        ) : (
          <div className="flex justify-center mb-6">
             <div className="bg-[#F54A23]/10 p-4 rounded-full text-[#F54A23]">
                <Loader2 className="animate-spin" size={40} />
             </div>
          </div>
        )}
        <h2 className="text-2xl font-bold text-[#F54A23]">
          {isComplete ? 'Processing complete!' : 'Processing Feed...'}
        </h2>
        <p className="opacity-60 mt-2 text-[#083027]">
          {isComplete 
            ? 'Your CSV file is ready for download.' 
            : 'Please do not close this tab.'}
        </p>
      </div>

      <div className="p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm font-bold text-[#083027]/70 mb-2">
            <span>{isComplete ? '100%' : `${progress.toFixed(1)}%`}</span>
            <span>{formatBytes(stats.processedBytes)} {stats.totalBytes > 0 ? `/ ${formatBytes(stats.totalBytes)}` : ''}</span>
          </div>
          <div className="w-full bg-[#083027]/10 rounded-full h-4 overflow-hidden">
            <div 
              className="h-full transition-all duration-300 bg-[#F54A23]"
              style={{ width: `${isComplete ? 100 : progress}%` }}
            >
                {/* Indeterminate animation if size unknown */}
                {stats.totalBytes === 0 && !isComplete && (
                   <div className="w-full h-full animate-pulse bg-[#ff7f61]"></div>
                )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-[#F2F7F6] p-4 rounded-lg flex items-center gap-3 border border-[#083027]/5">
             <Database className="text-[#F54A23]" />
             <div>
               <p className="text-sm text-[#083027]/60">Products found</p>
               <p className="text-xl font-bold text-[#083027]">{stats.itemsFound.toLocaleString()}</p>
             </div>
          </div>
          <div className="bg-[#F2F7F6] p-4 rounded-lg flex items-center gap-3 border border-[#083027]/5">
             <Clock className="text-[#F54A23]" />
             <div>
               <p className="text-sm text-[#083027]/60">Processing time</p>
               <p className="text-xl font-bold text-[#083027]">{duration}s</p>
             </div>
          </div>
        </div>

        {/* Actions */}
        {isComplete && (
          <button 
            onClick={onDownload}
            className="w-full bg-[#F54A23] hover:bg-[#d43a15] text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-[#F54A23]/20 transition-transform hover:scale-[1.02] flex items-center justify-center gap-2 mb-4"
          >
            <FileDown size={24} />
            Download CSV file
          </button>
        )}

        <button 
          onClick={onReset}
          className="w-full text-[#083027]/60 hover:text-[#083027] font-medium py-2"
        >
          {isComplete ? 'Analyze another file' : 'Cancel'}
        </button>
      </div>
    </div>
  );
};