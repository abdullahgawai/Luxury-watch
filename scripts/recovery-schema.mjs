// Read-only schema evidence for the explicitly selected application tables.
// Preserve SQL exactly: normalizing it could hide changed literals or constraints.
export function recoverySchema(database,tables){
 if(!Array.isArray(tables)||!tables.length||tables.some(t=>typeof t!=='string'||!t)||new Set(tables).size!==tables.length)throw new Error('Unique application table names are required');
 const rows=database.prepare(`SELECT type,name,tbl_name,sql FROM sqlite_master WHERE tbl_name IN (${tables.map(()=>'?').join(',')}) ORDER BY type,name`).all(...tables);
 for(const name of tables)if(!rows.some(row=>row.type==='table'&&row.name===name))throw new Error(`Missing recovery table: ${name}`);
 return rows.map(row=>({...row}));
}
