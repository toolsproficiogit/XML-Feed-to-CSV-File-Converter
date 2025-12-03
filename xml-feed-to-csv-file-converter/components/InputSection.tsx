import React, { useState } from 'react';
import { Upload, Settings, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  onFileSelect: (file: File, hint?: string) => void;
}

export const InputSection: React.FC<Props> = ({ onFileSelect }) => {
  const [dragActive, setDragActive] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hint, setHint] = useState('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0], hint);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0], hint);
    }
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-2xl p-8 border border-white/10 h-full flex flex-col justify-between">
      <div 
        className={`relative border-2 border-dashed rounded-xl p-8 lg:p-12 text-center transition-all duration-300 flex-1 flex flex-col items-center justify-center ${
          dragActive 
            ? 'border-[#F54A23] bg-[#F54A23]/5 scale-[1.02]' 
            : 'border-[#083027]/10 hover:border-[#F54A23]/50 hover:bg-[#F54A23]/5'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          accept=".xml" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleFileChange}
        />
        <div className="flex flex-col items-center pointer-events-none">
          <div className="bg-[#F54A23]/10 p-5 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
            <Upload className="text-[#F54A23]" size={40} />
          </div>
          <p className="text-xl font-bold text-[#F54A23] mb-2">Upload File from Computer</p>
          <p className="text-sm text-[#083027]/60">Supports large XML files (Google Shopping, etc.)</p>
        </div>
      </div>

      <div className="mt-6 border-t border-[#083027]/5 pt-4">
        <button 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-bold text-[#083027]/60 hover:text-[#F54A23] transition-colors mb-3"
        >
           <Settings size={16} />
           Advanced Options
           {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        
        {showAdvanced && (
           <div className="bg-[#E6F0EE] p-4 rounded-lg animate-in fade-in slide-in-from-top-2">
             <label className="block text-xs font-bold text-[#083027]/70 mb-1">
               Element Name Hint (Optional)
             </label>
             <input 
               type="text" 
               placeholder="e.g. SHOPITEM or ITEM_ID"
               value={hint}
               onChange={(e) => setHint(e.target.value)}
               className="w-full text-sm px-3 py-2 rounded border border-[#083027]/10 focus:border-[#F54A23] focus:ring-1 focus:ring-[#F54A23] outline-none text-[#083027] placeholder-[#083027]/40 bg-white"
             />
             <p className="text-[10px] text-[#083027]/50 mt-2 leading-relaxed">
               If automatic detection fails, enter the name of the <strong>product tag</strong> (e.g. <code>SHOPITEM</code>, <code>item</code>) OR a unique <strong>field name</strong> (e.g. <code>g:id</code>, <code>ITEM_ID</code>) to help the parser find the items.
             </p>
           </div>
        )}
      </div>
    </div>
  );
};