import * as XLSX from 'xlsx';
import type { Post, Resident, Schedule } from '../types';

export function parseExcelSchedule(
  arrayBuffer: ArrayBuffer,
  posts: Post[],
  residents: Resident[]
): Schedule {
  const schedule: Schedule = {};
  
  // Create mapping directories
  const nameToIdConfig = new Map<string, string>();
  residents.forEach(r => {
    nameToIdConfig.set(r.name.trim(), r.id);
    nameToIdConfig.set(r.name.split(' ')[0], r.id);
  });

  const getResidentId = (rawName: string) => {
    const cleanName = rawName.replace(/^"|"$/g, '').trim();
    return nameToIdConfig.get(cleanName) || nameToIdConfig.get(cleanName.split(' ')[0]) || cleanName;
  };

  const aliasMap: Record<string, string> = {
    'ח.נ גדול': 'ח.נ גדול 1',
    'ח.נ גדול ': 'ח.נ גדול 1',
    'א.י- ספורט': 'אשפוז יום ספורט',
    'א.י- כף יד': 'אשפוז יום כף יד',
    'א.י- כף רגל': 'אשפוז יום כף רגל',
    'בקשה חופש': 'חופש',
    'מילואים': 'חופש'
  };

  // OR rooms distribution - one resident per room
  const orRoomIds = ['p_or1', 'p_or2', 'p_or3'];

  const nameToPostConfig = new Map<string, string>();
  posts.forEach(p => {
    nameToPostConfig.set(p.name.trim(), p.id);
  });

  // Load workbook
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  // Iterate over every single sheet (Week 1, Week 2, etc.)
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    // Convert to strict 2D array of strings
    const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1, defval: '' });
    
    let currentColumnToDayMap: Record<number, number> = {};

    rows.forEach((cols) => {
      // Stringify everything just in case Excel gives numbers
      const strCols = cols.map(c => String(c));
      
      // Look for a row containing dates like "1.4", "2.4"
      const hasDates = strCols.some(col => col.trim().match(/^\d{1,2}\.\d{1,2}$/));
      if (hasDates) {
        currentColumnToDayMap = {}; // Reset for the new block in this sheet
        strCols.forEach((col, idx) => {
          const match = col.trim().match(/^(\d{1,2})\.\d{1,2}$/);
          if (match) {
            const dayNum = parseInt(match[1], 10);
            currentColumnToDayMap[idx] = dayNum;
            if (!schedule[dayNum]) {
              schedule[dayNum] = {};
            }
          }
        });
        return;
      }

      // Check for Post Row
      let rowTitle = strCols[0]?.trim();
      if (!rowTitle) return;

      if (aliasMap[rowTitle]) {
        rowTitle = aliasMap[rowTitle];
      }

      if (nameToPostConfig.has(rowTitle)) {
        const postId = nameToPostConfig.get(rowTitle)!;
        const isOrRoom = orRoomIds.includes(postId);
        
        for (let i = 1; i < strCols.length; i++) {
          const dayNum = currentColumnToDayMap[i];
          const cellValue = strCols[i]?.trim();
          
          if (dayNum && cellValue) {
            const names = cellValue.split(/[,\n/]/).map(n => n.trim()).filter(n => n.length > 0);
            
            if (names.length > 0) {
              if (isOrRoom && names.length > 1) {
                // Distribute: first name -> p_or1, second -> p_or2, third -> p_or3
                names.forEach((name, nameIdx) => {
                  const targetRoomId = orRoomIds[nameIdx];
                  if (!targetRoomId) return;
                  if (!schedule[dayNum][targetRoomId]) {
                    schedule[dayNum][targetRoomId] = [];
                  }
                  const resId = getResidentId(name);
                  if (!schedule[dayNum][targetRoomId].includes(resId)) {
                    schedule[dayNum][targetRoomId].push(resId);
                  }
                });
              } else {
                if (!schedule[dayNum][postId]) {
                  schedule[dayNum][postId] = [];
                }
                names.forEach(name => {
                   const resId = getResidentId(name);
                   if (!schedule[dayNum][postId].includes(resId)) {
                     schedule[dayNum][postId].push(resId);
                   }
                });
              }
            }
          }
        }
      }
    });
  });

  return schedule;
}
