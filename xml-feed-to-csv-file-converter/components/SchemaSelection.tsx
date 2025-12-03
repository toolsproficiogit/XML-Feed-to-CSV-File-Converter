import React, { useState } from 'react';
import { XmlField, Filter, CustomColumn, FilterCondition, Calculation, CalculationOperator, MergeColumn } from '../types';
import { Check, Columns, CopyX, ArrowRight, Plus, Trash2, Filter as FilterIcon, TableProperties, Calculator, Merge, Percent } from 'lucide-react';

interface Props {
  fields: XmlField[];
  selectedPaths: string[];
  onTogglePath: (path: string) => void;
  onConfirm: (deduplicate: boolean, aliases: Record<string, string>, filters: Filter[], customColumns: CustomColumn[], calculations: Calculation[], mergeColumns: MergeColumn[]) => void;
  onCancel: () => void;
}

export const SchemaSelection: React.FC<Props> = ({ 
  fields, 
  selectedPaths, 
  onTogglePath,
  onConfirm,
  onCancel
}) => {
  const [deduplicate, setDeduplicate] = useState(false);
  const [aliases, setAliases] = useState<Record<string, string>>({});
  
  // New States
  const [filters, setFilters] = useState<Filter[]>([]);
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [mergeColumns, setMergeColumns] = useState<MergeColumn[]>([]);

  // Temp states for new entries
  const [newFilterPath, setNewFilterPath] = useState('');
  const [newFilterCondition, setNewFilterCondition] = useState<FilterCondition>('contains');
  const [newFilterValue, setNewFilterValue] = useState('');
  
  const [newColHeader, setNewColHeader] = useState('');
  const [newColValue, setNewColValue] = useState('');

  const [newCalcHeader, setNewCalcHeader] = useState('');
  const [newCalcOp1, setNewCalcOp1] = useState('');
  const [newCalcIsPercentageOp1, setNewCalcIsPercentageOp1] = useState(false);
  const [newCalcOperator, setNewCalcOperator] = useState<CalculationOperator>('+');
  const [newCalcOp2, setNewCalcOp2] = useState('');
  const [newCalcIsPercentageOp2, setNewCalcIsPercentageOp2] = useState(false);

  const [newMergeHeader, setNewMergeHeader] = useState('');
  const [newMergeOp1, setNewMergeOp1] = useState('');
  const [newMergeOp2, setNewMergeOp2] = useState('');

  // Common preset for Google Shopping
  const recommendedPaths = ['g:id', 'g:title', 'g:description', 'g:price', 'g:link', 'g:image_link', 'g:availability'];

  const selectRecommended = () => {
    fields.forEach(f => {
      if (recommendedPaths.includes(f.path) && !selectedPaths.includes(f.path)) {
        onTogglePath(f.path);
      }
    });
  };

  const selectAll = () => {
     fields.forEach(f => {
       if (!selectedPaths.includes(f.path)) onTogglePath(f.path);
     });
  };

  const handleAliasChange = (path: string, value: string) => {
    setAliases(prev => ({
      ...prev,
      [path]: value
    }));
  };

  const addFilter = () => {
    if (!newFilterPath || !newFilterValue) return;
    const newFilter: Filter = {
      id: Math.random().toString(36).substr(2, 9),
      path: newFilterPath,
      condition: newFilterCondition,
      value: newFilterValue
    };
    setFilters([...filters, newFilter]);
    setNewFilterValue('');
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  const addCustomColumn = () => {
    if (!newColHeader || !newColValue) return;
    const newCol: CustomColumn = {
      id: Math.random().toString(36).substr(2, 9),
      header: newColHeader,
      value: newColValue
    };
    setCustomColumns([...customColumns, newCol]);
    setNewColHeader('');
    setNewColValue('');
  };

  const removeCustomColumn = (id: string) => {
    setCustomColumns(customColumns.filter(c => c.id !== id));
  };

  const addCalculation = () => {
    if (!newCalcHeader || !newCalcOp1 || !newCalcOp2) return;
    const newCalc: Calculation = {
      id: Math.random().toString(36).substr(2, 9),
      resultHeader: newCalcHeader,
      operand1: newCalcOp1,
      isPercentageOp1: newCalcIsPercentageOp1,
      operator: newCalcOperator,
      operand2: newCalcOp2,
      isPercentageOp2: newCalcIsPercentageOp2
    };
    setCalculations([...calculations, newCalc]);
    setNewCalcHeader('');
    setNewCalcIsPercentageOp1(false);
    setNewCalcIsPercentageOp2(false);
  };

  const removeCalculation = (id: string) => {
    setCalculations(calculations.filter(c => c.id !== id));
  };

  const addMergeColumn = () => {
    if (!newMergeHeader || !newMergeOp1 || !newMergeOp2) return;
    const newMerge: MergeColumn = {
      id: Math.random().toString(36).substr(2, 9),
      header: newMergeHeader,
      operand1: newMergeOp1,
      operand2: newMergeOp2
    };
    setMergeColumns([...mergeColumns, newMerge]);
    setNewMergeHeader('');
  };

  const removeMergeColumn = (id: string) => {
    setMergeColumns(mergeColumns.filter(m => m.id !== id));
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-xl shadow-2xl flex flex-col h-[90vh] md:h-auto border border-white/10">
      <div className="p-6 border-b border-[#083027]/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-xl font-bold text-[#F54A23] flex items-center gap-2">
             <Columns className="text-[#F54A23]" size={24} />
             Select columns for CSV
           </h2>
           <p className="text-sm text-[#083027]/60 mt-1">Found {fields.length} unique elements</p>
        </div>
        
        <div className="flex gap-2">
          <button onClick={selectRecommended} className="text-xs font-bold bg-[#F54A23]/10 text-[#F54A23] px-3 py-1.5 rounded hover:bg-[#F54A23]/20 transition-colors">
            Select Google Shopping defaults
          </button>
          <button onClick={selectAll} className="text-xs font-bold bg-[#E6F0EE] text-[#083027]/80 px-3 py-1.5 rounded hover:bg-[#dceae8] transition-colors">
            Select all
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-[#F2F7F6]">
        {/* Field Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {fields.map((field) => {
            const isSelected = selectedPaths.includes(field.path);
            return (
              <div 
                key={field.path} 
                className={`rounded-lg border transition-all duration-200 overflow-hidden ${
                  isSelected 
                    ? 'bg-white border-[#F54A23] shadow-md ring-1 ring-[#F54A23] scale-[1.01]' 
                    : 'bg-white border-transparent hover:border-[#F54A23]/30 shadow-sm hover:shadow-md'
                }`}
              >
                <div 
                  className="flex items-start p-3 cursor-pointer"
                  onClick={() => onTogglePath(field.path)}
                >
                  <div className="relative flex items-center h-5 mt-0.5 pointer-events-none">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-[#F54A23] border-[#083027]/20 rounded focus:ring-[#F54A23]"
                      checked={isSelected}
                      readOnly
                    />
                  </div>
                  <div className="ml-3 text-sm flex-1">
                    <span className={`font-medium block break-all ${isSelected ? 'text-[#083027]' : 'text-[#083027]/70'}`}>
                      {field.path}
                    </span>
                    {field.example && (
                      <span className="text-[#083027]/40 text-xs block mt-1 line-clamp-2 break-all">
                        Ex: {field.example}
                      </span>
                    )}
                  </div>
                </div>
                
                {isSelected && (
                   <div className="px-3 pb-3 pt-1 border-t border-[#083027]/5 bg-[#F54A23]/5">
                     <div className="flex items-center gap-2 mb-1">
                       <ArrowRight size={12} className="text-[#F54A23]" />
                       <label className="text-[10px] uppercase font-bold text-[#F54A23] tracking-wider">Export as</label>
                     </div>
                     <input 
                       type="text"
                       placeholder={field.path}
                       value={aliases[field.path] || ''}
                       onChange={(e) => handleAliasChange(field.path, e.target.value)}
                       onClick={(e) => e.stopPropagation()} 
                       className="w-full text-sm px-2 py-1.5 rounded border border-[#083027]/10 focus:border-[#F54A23] focus:ring-1 focus:ring-[#F54A23] outline-none text-[#083027] placeholder-[#083027]/30 bg-white"
                     />
                   </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Refine Data Section */}
        <h3 className="text-xl font-bold text-[#083027] mb-4 pb-2 border-b border-[#083027]/10">Refine Data</h3>
        
        {/* Changed grid layout to 2 columns to fit content better */}
        <div className="grid lg:grid-cols-2 gap-6">
          
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-[#083027]/5 p-5 flex flex-col h-full">
            <h4 className="text-lg font-bold text-[#083027] mb-4 flex items-center gap-2">
              <FilterIcon size={20} className="text-[#F54A23]" />
              Filter Data
            </h4>
            
            <div className="flex flex-col gap-3 mb-4 flex-1">
               {filters.map(filter => (
                 <div key={filter.id} className="flex items-center gap-2 text-sm bg-[#E6F0EE] p-2 rounded border border-[#083027]/10">
                   <span className="font-bold text-[#083027]">{filter.path}</span>
                   <span className="text-[#F54A23] font-mono text-xs uppercase px-1.5 py-0.5 bg-[#F54A23]/10 rounded">{filter.condition}</span>
                   <span className="text-[#083027]/80 truncate flex-1">"{filter.value}"</span>
                   <button onClick={() => removeFilter(filter.id)} className="text-[#083027]/40 hover:text-red-500">
                     <Trash2 size={16} />
                   </button>
                 </div>
               ))}
               {filters.length === 0 && (
                 <p className="text-sm text-[#083027]/40 italic">No filters active.</p>
               )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end border-t border-[#083027]/5 pt-4">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-[#083027]/60 uppercase mb-1 block">Element</label>
                <select 
                  className="w-full text-xs p-1.5 rounded border border-[#083027]/20 bg-white outline-none focus:border-[#F54A23] text-[#083027]"
                  value={newFilterPath}
                  onChange={(e) => setNewFilterPath(e.target.value)}
                >
                  <option value="">Select element...</option>
                  {fields.map(f => <option key={f.path} value={f.path}>{f.path}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#083027]/60 uppercase mb-1 block">Condition</label>
                <select 
                  className="w-full text-xs p-1.5 rounded border border-[#083027]/20 bg-white outline-none focus:border-[#F54A23] text-[#083027]"
                  value={newFilterCondition}
                  onChange={(e) => setNewFilterCondition(e.target.value as FilterCondition)}
                >
                  <option value="contains">Contains</option>
                  <option value="equals">Equals</option>
                  <option value="gt">Greater (&gt;)</option>
                  <option value="lt">Less (&lt;)</option>
                </select>
              </div>
              <div>
                 <label className="text-[10px] font-bold text-[#083027]/60 uppercase mb-1 block">Value</label>
                 <input 
                   type="text"
                   className="w-full text-xs p-1.5 rounded border border-[#083027]/20 outline-none focus:border-[#F54A23] text-[#083027] bg-white placeholder-[#083027]/30"
                   placeholder="Value..."
                   value={newFilterValue}
                   onChange={(e) => setNewFilterValue(e.target.value)}
                 />
              </div>
            </div>
            <button 
              onClick={addFilter}
              disabled={!newFilterPath || !newFilterValue}
              className="mt-3 w-full bg-[#083027] hover:bg-[#0b4034] disabled:opacity-50 text-white text-sm font-bold py-2 rounded transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add Filter
            </button>
          </div>

          {/* Calculations */}
          <div className="bg-white rounded-xl shadow-sm border border-[#083027]/5 p-5 flex flex-col h-full">
            <h4 className="text-lg font-bold text-[#083027] mb-4 flex items-center gap-2">
              <Calculator size={20} className="text-[#F54A23]" />
              Calculations (Math)
            </h4>

            <div className="flex flex-col gap-3 mb-4 flex-1">
               {calculations.map(calc => (
                 <div key={calc.id} className="flex items-center gap-2 text-sm bg-[#E6F0EE] p-2 rounded border border-[#083027]/10">
                   <span className="font-bold text-[#083027]">{calc.resultHeader}</span>
                   <span className="text-[#083027]/40 text-xs">=</span>
                   <span className="text-[#083027]/80 truncate flex-1 font-mono text-xs">
                     {calc.operand1} {calc.isPercentageOp1 && <span className="text-[#F54A23] font-bold">(%)</span>} {calc.operator} {calc.operand2} {calc.isPercentageOp2 && <span className="text-[#F54A23] font-bold">(%)</span>}
                   </span>
                   <button onClick={() => removeCalculation(calc.id)} className="text-[#083027]/40 hover:text-red-500">
                     <Trash2 size={16} />
                   </button>
                 </div>
               ))}
               {calculations.length === 0 && (
                 <p className="text-sm text-[#083027]/40 italic">No calculations added.</p>
               )}
            </div>

            <div className="space-y-1 border-t border-[#083027]/5 pt-4">
               <div>
                  <label className="text-[10px] font-bold text-[#083027]/60 uppercase mb-1 block">Result Column Name</label>
                  <input 
                    type="text"
                    className="w-full text-xs p-1.5 rounded border border-[#083027]/20 outline-none focus:border-[#F54A23] text-[#083027] bg-white placeholder-[#083027]/30"
                    placeholder="e.g. Total_Price"
                    value={newCalcHeader}
                    onChange={(e) => setNewCalcHeader(e.target.value)}
                  />
               </div>
               <div className="flex gap-2 items-center">
                  {/* Operand 1 */}
                  <div className="flex-1 flex gap-1 min-w-0">
                    <select 
                      className="flex-1 text-xs p-1 rounded border border-[#083027]/20 bg-white outline-none focus:border-[#F54A23] text-[#083027] min-w-0"
                      value={newCalcOp1}
                      onChange={(e) => setNewCalcOp1(e.target.value)}
                    >
                      <option value="">Operand 1</option>
                      {fields.map(f => <option key={f.path} value={f.path}>{f.path}</option>)}
                    </select>
                    <button 
                      onClick={() => setNewCalcIsPercentageOp1(!newCalcIsPercentageOp1)}
                      className={`w-6 flex items-center justify-center rounded border text-xs font-bold transition-colors shrink-0 ${newCalcIsPercentageOp1 ? 'bg-[#F54A23] text-white border-[#F54A23]' : 'bg-[#E6F0EE] text-[#083027]/40 border-[#083027]/10 hover:border-[#F54A23] hover:text-[#F54A23]'}`}
                      title="Treat as percentage (Divide by 100)"
                    >
                      %
                    </button>
                  </div>
                  
                  {/* Operator */}
                  <select 
                    className="w-16 text-sm p-1.5 pl-2 rounded border border-[#083027]/20 bg-white outline-none focus:border-[#F54A23] text-[#083027] font-bold shrink-0"
                    value={newCalcOperator}
                    onChange={(e) => setNewCalcOperator(e.target.value as CalculationOperator)}
                  >
                    <option value="+">+</option>
                    <option value="-">-</option>
                    <option value="*">*</option>
                    <option value="/">/</option>
                  </select>
                  
                  {/* Operand 2 */}
                  <div className="flex-1 flex gap-1 min-w-0">
                    <select 
                      className="flex-1 text-xs p-1 rounded border border-[#083027]/20 bg-white outline-none focus:border-[#F54A23] text-[#083027] min-w-0"
                      value={newCalcOp2}
                      onChange={(e) => setNewCalcOp2(e.target.value)}
                    >
                      <option value="">Operand 2</option>
                      {fields.map(f => <option key={f.path} value={f.path}>{f.path}</option>)}
                    </select>
                    <button 
                      onClick={() => setNewCalcIsPercentageOp2(!newCalcIsPercentageOp2)}
                      className={`w-6 flex items-center justify-center rounded border text-xs font-bold transition-colors shrink-0 ${newCalcIsPercentageOp2 ? 'bg-[#F54A23] text-white border-[#F54A23]' : 'bg-[#E6F0EE] text-[#083027]/40 border-[#083027]/10 hover:border-[#F54A23] hover:text-[#F54A23]'}`}
                      title="Treat as percentage (Divide by 100)"
                    >
                      %
                    </button>
                  </div>
               </div>
            </div>
            <button 
              onClick={addCalculation}
              disabled={!newCalcHeader || !newCalcOp1 || !newCalcOp2}
              className="mt-3 w-full bg-[#083027] hover:bg-[#0b4034] disabled:opacity-50 text-white text-sm font-bold py-2 rounded transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add Calculation
            </button>
          </div>

          {/* Merge Columns */}
          <div className="bg-white rounded-xl shadow-sm border border-[#083027]/5 p-5 flex flex-col h-full">
            <h4 className="text-lg font-bold text-[#083027] mb-4 flex items-center gap-2">
              <Merge size={20} className="text-[#F54A23]" />
              Merge Elements (Join)
            </h4>

            <div className="flex flex-col gap-3 mb-4 flex-1">
               {mergeColumns.map(m => (
                 <div key={m.id} className="flex items-center gap-2 text-sm bg-[#E6F0EE] p-2 rounded border border-[#083027]/10">
                   <span className="font-bold text-[#083027]">{m.header}</span>
                   <span className="text-[#083027]/40 text-xs px-1">=</span>
                   <span className="text-[#083027]/80 truncate flex-1 font-mono text-xs">
                     {m.operand1} + {m.operand2}
                   </span>
                   <button onClick={() => removeMergeColumn(m.id)} className="text-[#083027]/40 hover:text-red-500">
                     <Trash2 size={16} />
                   </button>
                 </div>
               ))}
               {mergeColumns.length === 0 && (
                 <p className="text-sm text-[#083027]/40 italic">No merges added.</p>
               )}
            </div>

            <div className="space-y-1 border-t border-[#083027]/5 pt-4">
               <div>
                  <label className="text-[10px] font-bold text-[#083027]/60 uppercase mb-1 block">New Header Name</label>
                  <input 
                    type="text"
                    className="w-full text-xs p-1.5 rounded border border-[#083027]/20 outline-none focus:border-[#F54A23] text-[#083027] bg-white placeholder-[#083027]/30"
                    placeholder="e.g. Title_Brand"
                    value={newMergeHeader}
                    onChange={(e) => setNewMergeHeader(e.target.value)}
                  />
               </div>
               <div className="flex gap-2 items-center">
                  <div className="flex-1 min-w-0">
                    <select 
                      className="w-full text-xs p-1.5 rounded border border-[#083027]/20 bg-white outline-none focus:border-[#F54A23] text-[#083027]"
                      value={newMergeOp1}
                      onChange={(e) => setNewMergeOp1(e.target.value)}
                    >
                      <option value="">Element 1</option>
                      {fields.map(f => <option key={f.path} value={f.path}>{f.path}</option>)}
                    </select>
                  </div>
                  <span className="text-[#083027]/40 font-bold shrink-0">+</span>
                  <div className="flex-1 min-w-0">
                    <select 
                      className="w-full text-xs p-1.5 rounded border border-[#083027]/20 bg-white outline-none focus:border-[#F54A23] text-[#083027]"
                      value={newMergeOp2}
                      onChange={(e) => setNewMergeOp2(e.target.value)}
                    >
                      <option value="">Element 2</option>
                      {fields.map(f => <option key={f.path} value={f.path}>{f.path}</option>)}
                    </select>
                  </div>
               </div>
            </div>
            <button 
              onClick={addMergeColumn}
              disabled={!newMergeHeader || !newMergeOp1 || !newMergeOp2}
              className="mt-3 w-full bg-[#083027] hover:bg-[#0b4034] disabled:opacity-50 text-white text-sm font-bold py-2 rounded transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add Merge
            </button>
          </div>

          {/* Custom Columns */}
          <div className="bg-white rounded-xl shadow-sm border border-[#083027]/5 p-5 flex flex-col h-full">
            <h4 className="text-lg font-bold text-[#083027] mb-4 flex items-center gap-2">
              <TableProperties size={20} className="text-[#F54A23]" />
              Add Custom Columns
            </h4>

            <div className="flex flex-col gap-3 mb-4 flex-1">
               {customColumns.map(col => (
                 <div key={col.id} className="flex items-center gap-2 text-sm bg-[#E6F0EE] p-2 rounded border border-[#083027]/10">
                   <span className="font-bold text-[#083027]">{col.header}</span>
                   <span className="text-[#083027]/40 text-xs px-1">=</span>
                   <span className="text-[#083027]/80 truncate flex-1">"{col.value}"</span>
                   <button onClick={() => removeCustomColumn(col.id)} className="text-[#083027]/40 hover:text-red-500">
                     <Trash2 size={16} />
                   </button>
                 </div>
               ))}
               {customColumns.length === 0 && (
                 <p className="text-sm text-[#083027]/40 italic">No custom columns added.</p>
               )}
            </div>

            <div className="grid grid-cols-2 gap-2 items-end border-t border-[#083027]/5 pt-4">
               <div>
                 <label className="text-[10px] font-bold text-[#083027]/60 uppercase mb-1 block">Header Name</label>
                 <input 
                   type="text"
                   className="w-full text-xs p-1.5 rounded border border-[#083027]/20 outline-none focus:border-[#F54A23] text-[#083027] bg-white placeholder-[#083027]/30"
                   placeholder="e.g. Source"
                   value={newColHeader}
                   onChange={(e) => setNewColHeader(e.target.value)}
                 />
              </div>
              <div>
                 <label className="text-[10px] font-bold text-[#083027]/60 uppercase mb-1 block">Static Value</label>
                 <input 
                   type="text"
                   className="w-full text-xs p-1.5 rounded border border-[#083027]/20 outline-none focus:border-[#F54A23] text-[#083027] bg-white placeholder-[#083027]/30"
                   placeholder="e.g. MyFeed"
                   value={newColValue}
                   onChange={(e) => setNewColValue(e.target.value)}
                 />
              </div>
            </div>
            <button 
              onClick={addCustomColumn}
              disabled={!newColHeader || !newColValue}
              className="mt-3 w-full bg-[#083027] hover:bg-[#0b4034] disabled:opacity-50 text-white text-sm font-bold py-2 rounded transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add Column
            </button>
          </div>

        </div>
      </div>

      <div className="p-6 border-t border-[#083027]/10 bg-white rounded-b-xl flex flex-col gap-4">
        
        <div className="flex items-center gap-3 bg-[#E6F0EE] p-3 rounded-lg border border-[#083027]/5">
            <div className="flex items-center h-5">
                <input
                    id="deduplicate"
                    type="checkbox"
                    className="w-5 h-5 text-[#F54A23] border-[#083027]/20 rounded focus:ring-[#F54A23]"
                    checked={deduplicate}
                    onChange={(e) => setDeduplicate(e.target.checked)}
                />
            </div>
            <label htmlFor="deduplicate" className="flex items-center gap-2 cursor-pointer select-none">
                <CopyX size={18} className="text-[#083027]/70" />
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#083027]">Remove duplicate rows</span>
                    <span className="text-xs text-[#083027]/60">Useful for creating lists of unique Brands, Categories, etc.</span>
                </div>
            </label>
        </div>

        <div className="flex justify-between items-center w-full">
            <button 
            onClick={onCancel}
            className="text-[#083027]/70 font-medium hover:text-[#083027] px-4 py-2"
            >
            Back
            </button>
            <div className="flex items-center gap-4">
            <span className="text-sm text-[#083027]/60">
                Selected: <span className="font-bold text-[#083027]">{selectedPaths.length + customColumns.length + calculations.length + mergeColumns.length}</span>
            </span>
            <button
                onClick={() => onConfirm(deduplicate, aliases, filters, customColumns, calculations, mergeColumns)}
                disabled={selectedPaths.length === 0}
                className="bg-[#F54A23] hover:bg-[#d43a15] disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-[#F54A23]/30 transition-all flex items-center gap-2"
            >
                <Check size={20} />
                Export to CSV
            </button>
            </div>
        </div>
      </div>
    </div>
  );
};