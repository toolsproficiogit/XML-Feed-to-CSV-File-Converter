import React, { useState } from 'react';
import { AppState, XmlField, ProcessingStats, Filter, CustomColumn, Calculation, MergeColumn } from './types';
import { analyzeXmlSchema, processXmlToCsv } from './services/xmlParser';
import { InputSection } from './components/InputSection';
import { SchemaSelection } from './components/SchemaSelection';
import { ProcessingStatus } from './components/ProcessingStatus';
import { UrlDownloader } from './components/UrlDownloader';
import { FileSpreadsheet, Activity, ArrowDown } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('IDLE');
  const [source, setSource] = useState<File | string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Analysis Results
  const [fields, setFields] = useState<XmlField[]>([]);
  const [rootItemTag, setRootItemTag] = useState<string>('');
  const [hint, setHint] = useState<string>('');
  
  // Selection
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  
  // Processing
  const [stats, setStats] = useState<ProcessingStats>({ totalBytes: 0, processedBytes: 0, itemsFound: 0, startTime: 0 });
  const [csvBlob, setCsvBlob] = useState<Blob | null>(null);

  const reset = () => {
    setState('IDLE');
    setSource(null);
    setError(null);
    setFields([]);
    setSelectedPaths([]);
    setCsvBlob(null);
    setHint('');
  };

  const handleSourceSelect = async (newSource: File, newHint?: string) => {
    setSource(newSource);
    // If a hint is provided from input, save it
    if (newHint !== undefined) setHint(newHint);
    
    setState('ANALYZING');
    setError(null);

    try {
      const { fields, rootItemTag } = await analyzeXmlSchema(newSource, (bytes) => {
          // Analysis is fast, we don't really need to show progress here usually,
          // but we could.
      }, newHint !== undefined ? newHint : hint);

      if (fields.length === 0) {
        throw new Error('No product elements found. Please check the XML format or try using the "Element Name Hint" in Advanced Options.');
      }

      setFields(fields);
      setRootItemTag(rootItemTag);
      
      // Default to empty selection
      setSelectedPaths([]);

      setState('SELECTION');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error analyzing file.');
      setState('IDLE');
    }
  };

  const handleTogglePath = (path: string) => {
    setSelectedPaths(prev => 
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  const startProcessing = async (
    deduplicate: boolean, 
    aliases: Record<string, string>,
    filters: Filter[],
    customColumns: CustomColumn[],
    calculations: Calculation[],
    mergeColumns: MergeColumn[]
  ) => {
    if (!source || !rootItemTag) return;
    
    setState('PROCESSING');
    setStats({
      totalBytes: source instanceof File ? source.size : 0,
      processedBytes: 0,
      itemsFound: 0,
      startTime: Date.now()
    });

    try {
      const blob = await processXmlToCsv(
        source, 
        rootItemTag, 
        selectedPaths, 
        deduplicate,
        aliases,
        filters,
        customColumns,
        calculations,
        mergeColumns,
        (newStats) => setStats(newStats)
      );
      setCsvBlob(blob);
      setState('COMPLETED');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error processing file.');
      setState('ERROR');
    }
  };

  const downloadCsv = () => {
    if (!csvBlob) return;
    const url = URL.createObjectURL(csvBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#083027] pb-20">
      {/* Header */}
      <header className="border-b border-white/10 sticky top-0 z-10 bg-[#083027]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#F54A23] p-2 rounded-lg text-white shadow-sm shadow-[#F54A23]/20">
              <FileSpreadsheet size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-wide text-white">XML Feed to CSV File Converter</h1>
          </div>
          <div className="text-sm text-white/60 hidden sm:block font-medium">
            Maira Tools
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Error Banner */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 bg-red-500/10 border border-red-500/50 text-red-200 px-6 py-4 rounded-xl flex items-start gap-3 shadow-sm">
             <Activity className="shrink-0 mt-0.5 text-red-400" />
             <div>
               <p className="font-bold text-red-400">An error occurred</p>
               <p>{error}</p>
             </div>
          </div>
        )}

        {/* Step 1 & 2: Input */}
        {(state === 'IDLE' || state === 'ANALYZING') && (
          <div className={state === 'ANALYZING' ? 'opacity-50 pointer-events-none' : ''}>
             <div className="text-center mb-16 mt-4">
               <h2 className="text-4xl font-extrabold text-[#F54A23] mb-6">
                 XML Feed to CSV File Converter
               </h2>
               <p className="text-xl text-[#E6F0EE] max-w-3xl mx-auto leading-relaxed opacity-90">
                 Export your desired elements into CSV file.
               </p>
             </div>
             
             {state === 'ANALYZING' ? (
                <div className="max-w-md mx-auto text-center py-12">
                   <div className="animate-spin text-[#F54A23] mx-auto mb-6">
                      <Activity size={48} />
                   </div>
                   <p className="text-xl font-medium text-white">Analyzing feed structure...</p>
                </div>
             ) : (
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-stretch max-w-6xl mx-auto relative">
                  {/* Step 1 */}
                  <div className="relative group">
                     <div className="absolute -top-5 left-6 bg-[#F54A23] text-white px-4 py-2 rounded-full text-lg font-extrabold z-10 shadow-xl shadow-[#F54A23]/30 transition-transform group-hover:scale-105">
                       Step 1
                     </div>
                     <UrlDownloader />
                  </div>

                  {/* Arrow for desktop visualization */}
                  <div className="hidden lg:flex flex-col justify-center items-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                     <ArrowDown className="text-[#F54A23] -rotate-90 filter drop-shadow-xl" size={80} strokeWidth={2.5} />
                  </div>

                  {/* Step 2 */}
                  <div className="relative group">
                    <div className="absolute -top-5 left-6 bg-[#F54A23] text-white px-4 py-2 rounded-full text-lg font-extrabold z-10 shadow-xl shadow-[#F54A23]/30 transition-transform group-hover:scale-105">
                       Step 2
                     </div>
                    <InputSection onFileSelect={handleSourceSelect} />
                  </div>
                </div>
             )}
          </div>
        )}

        {/* Step 3: Selection */}
        {state === 'SELECTION' && (
          <SchemaSelection 
            fields={fields}
            selectedPaths={selectedPaths}
            onTogglePath={handleTogglePath}
            onConfirm={startProcessing}
            onCancel={reset}
          />
        )}

        {/* Step 4: Processing & Download */}
        {(state === 'PROCESSING' || state === 'COMPLETED') && (
          <ProcessingStatus 
            stats={stats}
            isComplete={state === 'COMPLETED'}
            onDownload={downloadCsv}
            onReset={reset}
          />
        )}
        
        {state === 'ERROR' && (
           <div className="text-center mt-8">
             <button onClick={reset} className="text-[#F54A23] font-medium hover:underline hover:text-[#d43a15]">
               Try again
             </button>
           </div>
        )}

      </main>
    </div>
  );
};

export default App;