import sax from 'https://esm.sh/sax@1.4.1';
import { XmlField, ProcessingStats, Filter, CustomColumn, Calculation, MergeColumn } from '../types';
import { ANALYSIS_ITEM_LIMIT } from '../constants';

// Helper to escape CSV values
const escapeCsv = (value: string): string => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

// Helper to parse numbers from strings like "120.50 CZK"
const parseNumericValue = (val: string): number => {
  if (!val) return NaN;
  // Remove everything except digits, dots, and minus sign
  // Also handle cases like "1.200,50" vs "1,200.50" if necessary, but for XML feeds usually dot is decimal
  const cleaned = val.replace(/[^\d.-]/g, '');
  return parseFloat(cleaned);
};

const checkFilter = (itemValue: string, filter: Filter): boolean => {
  const val = (itemValue || '').toLowerCase();
  const filterVal = (filter.value || '').toLowerCase();

  switch (filter.condition) {
    case 'contains':
      return val.includes(filterVal);
    case 'equals':
      return val === filterVal;
    case 'gt': {
      const numItem = parseNumericValue(val);
      const numFilter = parseFloat(filterVal);
      return !isNaN(numItem) && !isNaN(numFilter) && numItem > numFilter;
    }
    case 'lt': {
      const numItem = parseNumericValue(val);
      const numFilter = parseFloat(filterVal);
      return !isNaN(numItem) && !isNaN(numFilter) && numItem < numFilter;
    }
    default:
      return true;
  }
};

/**
 * Creates a stream from a URL or File object
 */
const getStream = async (source: File | string): Promise<ReadableStream<Uint8Array>> => {
  if (source instanceof File) {
    return source.stream();
  } else {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Failed to fetch URL: ${response.statusText}`);
    if (!response.body) throw new Error('ReadableStream not supported in this browser.');
    return response.body;
  }
};

/**
 * PHASE 1: Analyze the XML to find available fields (schema)
 */
export const analyzeXmlSchema = async (
  source: File | string,
  onProgress: (bytesRead: number) => void,
  hint?: string
): Promise<{ fields: XmlField[]; rootItemTag: string }> => {
  const stream = await getStream(source);
  const reader = stream.getReader();
  const parser = sax.parser(true, { trim: true, normalize: true });

  // Stats for heuristic detection
  const depthCounts: Record<number, Record<string, number>> = {};
  
  // Data collection
  const collectedFields = new Map<string, { count: number, example: string }>();
  let pathStack: string[] = [];
  let bytesRead = 0;
  
  // Hint logic
  const normalizedHint = hint ? hint.trim() : null;
  const hintMatches: { tagName: string, parentName: string, hasChildren: boolean }[] = [];
  
  // To avoid analyzing the whole 500MB file, we stop after finding enough items
  let maxTagRepetition = 0;
  // Track if a specific tag currently open has children
  const tagHasChildrenMap = new Map<number, boolean>(); // depth -> hasChildren

  return new Promise((resolve, reject) => {
    parser.onerror = (e) => {
      if (maxTagRepetition >= ANALYSIS_ITEM_LIMIT) return;
      console.warn("XML Analysis Warning:", e);
    };

    parser.onopentag = (node) => {
      // Mark parent as having children
      if (pathStack.length > 0) {
        tagHasChildrenMap.set(pathStack.length, true);
      }
      
      pathStack.push(node.name);
      tagHasChildrenMap.set(pathStack.length, false); // Reset for current tag

      const depth = pathStack.length;
      const tagName = node.name;

      // Track frequency
      if (!depthCounts[depth]) depthCounts[depth] = {};
      depthCounts[depth][tagName] = (depthCounts[depth][tagName] || 0) + 1;
      
      if (depthCounts[depth][tagName] > maxTagRepetition) {
        maxTagRepetition = depthCounts[depth][tagName];
      }
    };

    parser.onclosetag = (tagName) => {
      const depth = pathStack.length;
      const hasChildren = tagHasChildrenMap.get(depth) || false;

      // Capture hint information when closing the tag (so we know if it had children)
      if (normalizedHint && (tagName === normalizedHint || tagName.endsWith(`:${normalizedHint}`))) {
         const parentName = pathStack.length > 1 ? pathStack[pathStack.length - 2] : '';
         hintMatches.push({ tagName, parentName, hasChildren });
      }

      pathStack.pop();
      if (maxTagRepetition >= ANALYSIS_ITEM_LIMIT) {
        reader.cancel();
        finishAnalysis();
      }
    };

    const handleText = (text: string) => {
      if (!text || !text.trim()) return;
      
      const fullPath = pathStack.join(' > ');
      if (!collectedFields.has(fullPath)) {
        collectedFields.set(fullPath, { count: 1, example: text.slice(0, 100) });
      } else {
        const field = collectedFields.get(fullPath)!;
        field.count++;
      }
    };

    parser.ontext = handleText;
    parser.oncdata = handleText;

    const finishAnalysis = () => {
      let candidateTag = '';

      // 1. Hint-based detection
      if (hintMatches.length > 0) {
        // We look at the first few matches to decide
        // If the hint tag usually has children, it's likely the Root Item (e.g. SHOPITEM)
        // If the hint tag usually has NO children, it's likely a Field (e.g. ITEM_ID), so we use its parent
        
        const hasChildrenCount = hintMatches.filter(m => m.hasChildren).length;
        const noChildrenCount = hintMatches.length - hasChildrenCount;

        if (hasChildrenCount >= noChildrenCount) {
             // It's likely the wrapper
             candidateTag = hintMatches[0].tagName;
        } else {
             // It's likely a field, use the parent
             candidateTag = hintMatches[0].parentName;
        }
      }

      // 2. Fallback to Heuristic detection if no hint or hint failed
      if (!candidateTag) {
        const depth2 = depthCounts[2] || {};
        const depth2Candidates = Object.entries(depth2).sort((a, b) => b[1] - a[1]);
        
        const depth3 = depthCounts[3] || {};
        const depth3Candidates = Object.entries(depth3).sort((a, b) => b[1] - a[1]);

        if (depth2Candidates.length > 0 && depth2Candidates[0][1] > 1) {
          candidateTag = depth2Candidates[0][0];
        } else if (depth3Candidates.length > 0 && depth3Candidates[0][1] > 1) {
          candidateTag = depth3Candidates[0][0];
        } else {
          candidateTag = depth2Candidates[0]?.[0] || depth3Candidates[0]?.[0] || '';
        }
      }

      if (!candidateTag) {
        resolve({ fields: [], rootItemTag: '' });
        return;
      }

      // 3. Extract fields relative to the chosen Root Item
      const finalFields: XmlField[] = [];
      
      for (const [fullPath, data] of collectedFields.entries()) {
        const parts = fullPath.split(' > ');
        // Find the LAST occurrence of the candidate tag in the path (closest to the leaf)
        // This handles cases where root tag might appear higher up too, though unlikely
        const tagIndex = parts.lastIndexOf(candidateTag);
        
        if (tagIndex !== -1 && tagIndex < parts.length - 1) {
          const relativePath = parts.slice(tagIndex + 1).join(' > ');
          finalFields.push({
            path: relativePath,
            example: data.example,
            count: data.count
          });
        }
      }

      resolve({
        fields: finalFields.sort((a, b) => a.path.localeCompare(b.path)),
        rootItemTag: candidateTag
      });
    };

    const processChunk = async () => {
      try {
        const { done, value } = await reader.read();
        
        if (done) {
          finishAnalysis();
          return;
        }

        bytesRead += value.byteLength;
        onProgress(bytesRead);
        
        const chunkStr = new TextDecoder().decode(value, { stream: true });
        parser.write(chunkStr);
        
        if (maxTagRepetition < ANALYSIS_ITEM_LIMIT) {
           processChunk();
        }
      } catch (err) {
        if (maxTagRepetition > 0) {
            finishAnalysis();
        } else {
            reject(err);
        }
      }
    };

    processChunk();
  });
};

/**
 * PHASE 2: Process the full XML and export CSV
 */
export const processXmlToCsv = async (
  source: File | string,
  rootItemTag: string,
  selectedPaths: string[],
  deduplicate: boolean,
  columnAliases: Record<string, string>,
  filters: Filter[],
  customColumns: CustomColumn[],
  calculations: Calculation[],
  mergeColumns: MergeColumn[],
  onProgress: (stats: ProcessingStats) => void
): Promise<Blob> => {
  const stream = await getStream(source);
  const reader = stream.getReader();
  const parser = sax.parser(true, { trim: true, normalize: true });
  
  const csvChunks: string[] = [];
  const seenRows = new Set<string>();

  // Header Construction
  // 1. Standard Fields
  const standardHeaders = selectedPaths.map(path => {
    const alias = columnAliases[path] && columnAliases[path].trim() !== '' 
      ? columnAliases[path] 
      : path;
    return escapeCsv(alias);
  });
  
  // 2. Custom Column Headers
  const customHeaders = customColumns.map(c => escapeCsv(c.header));
  
  // 3. Calculation Headers
  const calcHeaders = calculations.map(c => escapeCsv(c.resultHeader));

  // 4. Merge Headers
  const mergeHeaders = mergeColumns.map(m => escapeCsv(m.header));
  
  const fullHeader = [...standardHeaders, ...customHeaders, ...calcHeaders, ...mergeHeaders].join(',') + '\n';
  csvChunks.push(fullHeader);

  let pathStack: string[] = [];
  let currentItem: Record<string, string> = {};
  let isInsideItem = false;
  
  let stats: ProcessingStats = {
    totalBytes: source instanceof File ? source.size : 0,
    processedBytes: 0,
    itemsFound: 0,
    startTime: Date.now()
  };

  // Pre-calculate which paths we need to capture (selection + filter + calculation operands + merge operands)
  const pathsNeeded = new Set<string>(selectedPaths);
  filters.forEach(f => pathsNeeded.add(f.path));
  calculations.forEach(c => {
    pathsNeeded.add(c.operand1);
    pathsNeeded.add(c.operand2);
  });
  mergeColumns.forEach(m => {
    pathsNeeded.add(m.operand1);
    pathsNeeded.add(m.operand2);
  });

  return new Promise((resolve, reject) => {
    parser.onerror = (e) => {
        console.warn("Processing Warning:", e);
    };

    parser.onopentag = (node) => {
      pathStack.push(node.name);
      if (node.name === rootItemTag) {
        isInsideItem = true;
        currentItem = {};
      }
    };

    parser.onclosetag = (tagName) => {
      pathStack.pop();
      if (tagName === rootItemTag) {
        
        // 1. Apply Filters
        let satisfiesFilters = true;
        for (const filter of filters) {
          const itemValue = currentItem[filter.path] || '';
          if (!checkFilter(itemValue, filter)) {
            satisfiesFilters = false;
            break;
          }
        }

        if (satisfiesFilters) {
          // 2. Build Row Data (Standard Fields)
          const rowValues = selectedPaths.map(path => escapeCsv(currentItem[path] || ''));
          
          // 3. Append Custom Columns
          customColumns.forEach(c => {
            rowValues.push(escapeCsv(c.value));
          });

          // 4. Perform Calculations
          calculations.forEach(c => {
            let val1 = parseNumericValue(currentItem[c.operand1]);
            let val2 = parseNumericValue(currentItem[c.operand2]);

            // Handle percentage logic: if flagged, divide by 100
            if (c.isPercentageOp1) val1 = val1 / 100;
            if (c.isPercentageOp2) val2 = val2 / 100;

            let result = 0;
            
            if (isNaN(val1) || isNaN(val2)) {
               // If operands aren't numbers, result is likely invalid or empty
               rowValues.push('');
            } else {
               switch (c.operator) {
                 case '+': result = val1 + val2; break;
                 case '-': result = val1 - val2; break;
                 case '*': result = val1 * val2; break;
                 case '/': result = val2 !== 0 ? val1 / val2 : 0; break;
               }
               // Keep up to 4 decimal places if distinct from integer, otherwise integer
               rowValues.push(String(Number(result.toFixed(4)))); 
            }
          });

          // 5. Perform Merges
          mergeColumns.forEach(m => {
             const val1 = currentItem[m.operand1] || '';
             const val2 = currentItem[m.operand2] || '';
             // Merge with a space separator
             rowValues.push(escapeCsv(`${val1} ${val2}`));
          });

          const rowString = rowValues.join(',');
          
          let shouldAdd = true;
          if (deduplicate) {
              if (seenRows.has(rowString)) {
                  shouldAdd = false;
              } else {
                  seenRows.add(rowString);
              }
          }

          if (shouldAdd) {
              csvChunks.push(rowString + '\n');
              stats.itemsFound++;
          }
        }
        
        isInsideItem = false;
      }
    };

    const handleData = (text: string) => {
      if (isInsideItem && text) {
        const itemIndex = pathStack.lastIndexOf(rootItemTag);
        if (itemIndex !== -1) {
            const relativePath = pathStack.slice(itemIndex + 1).join(' > ');
            if (pathsNeeded.has(relativePath)) {
                currentItem[relativePath] = (currentItem[relativePath] || '') + text;
            }
        }
      }
    };

    parser.ontext = handleData;
    parser.oncdata = handleData;

    const processChunk = async () => {
      try {
        const { done, value } = await reader.read();
        
        if (done) {
          const blob = new Blob(csvChunks, { type: 'text/csv;charset=utf-8;' });
          resolve(blob);
          return;
        }

        stats.processedBytes += value.byteLength;
        onProgress({ ...stats });

        const chunkStr = new TextDecoder().decode(value, { stream: true });
        parser.write(chunkStr);

        processChunk();
      } catch (err) {
        reject(err);
      }
    };

    processChunk();
  });
};