import type { Post, Resident, Schedule } from '../types';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, '')); // push last and clean quotes
  return result;
}

export function parseScheduleCSV(
  csvText: string, 
  posts: Post[], 
  residents: Resident[]
): Schedule {
  const schedule: Schedule = {};
  const lines = csvText.split('\n').filter(l => l.trim().length > 0);
  
  // Mapping of resident Name -> resident ID
  const nameToIdConfig = new Map<string, string>();
  residents.forEach(r => {
    // Add exact match
    nameToIdConfig.set(r.name.trim(), r.id);
    // Add first name match just in case
    nameToIdConfig.set(r.name.split(' ')[0], r.id);
  });

  const getResidentId = (rawName: string) => {
    const cleanName = rawName.replace(/^"|"$/g, '').trim();
    return nameToIdConfig.get(cleanName) || nameToIdConfig.get(cleanName.split(' ')[0]) || cleanName;
  };

  // Known hardcoded aliases based on the user's Google Sheet
  const aliasMap: Record<string, string> = {
    'ח.נ גדול': 'ח.נ גדול 1',
    'א.י- ספורט': 'אשפוז יום ספורט',
    'א.י- כף יד': 'אשפוז יום כף יד',
    'א.י- כף רגל': 'אשפוז יום כף רגל',
    'בקשה חופש': 'חופש',
    'מילואים': 'חופש' // Treat reserve duty as vacation (unavailable)
  };

  // OR room group: if a sheet row called 'ח.נ גדול' has multiple names,
  // distribute them one-per-room across p_or1, p_or2, p_or3 instead of stacking all in p_or1
  const orRoomIds = ['p_or1', 'p_or2', 'p_or3'];
  const orRoomName = 'ח.נ גדול 1'; // The alias target

  // Mapping of post Name -> post ID
  const nameToPostConfig = new Map<string, string>();
  posts.forEach(p => {
    nameToPostConfig.set(p.name.trim(), p.id);
  });

  let currentColumnToDayMap: Record<number, number> = {};

  for (const line of lines) {
    const cols = parseCSVLine(line);
    
    // 1. Check if this is a date row (finding things like "1.4", "2.4")
    const hasDates = cols.some(col => col.trim().match(/^\d{1,2}\.\d{1,2}$/));
    if (hasDates) {
      currentColumnToDayMap = {};
      cols.forEach((col, idx) => {
        const match = col.trim().match(/^(\d{1,2})\.\d{1,2}$/);
        if (match) {
          const dayNum = parseInt(match[1], 10);
          currentColumnToDayMap[idx] = dayNum;
          if (!schedule[dayNum]) {
            schedule[dayNum] = {};
          }
        }
      });
      continue; // Move to next row
    }

    // 2. Check if this is a Post row
    let rowTitle = cols[0]?.trim();
    if (!rowTitle) continue;
    
    // Check aliases
    if (aliasMap[rowTitle]) {
      rowTitle = aliasMap[rowTitle];
    }

    if (nameToPostConfig.has(rowTitle)) {
      const postId = nameToPostConfig.get(rowTitle)!;
      const isOrRoom = orRoomIds.includes(postId) || rowTitle === orRoomName;
      
      for (let i = 1; i < cols.length; i++) {
        const dayNum = currentColumnToDayMap[i];
        const cellValue = cols[i]?.trim();
        
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
  }

  return schedule;
}
