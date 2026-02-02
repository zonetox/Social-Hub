const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../supabase/actual_schema_dump.json');
const outputPath = path.join(__dirname, '../src/types/database.types.ts');

const mapPostgresTypeToTs = (pgType) => {
    if (!pgType) return 'string'; // Default fallback
    const normalizedType = pgType.toLowerCase();

    if (normalizedType.includes('int') || normalizedType.includes('numeric') || normalizedType.includes('float') || normalizedType.includes('double')) {
        return 'number';
    }
    if (normalizedType.includes('bool')) {
        return 'boolean';
    }
    if (normalizedType.includes('json')) {
        return 'Json';
    }
    if (normalizedType.startsWith('array') || normalizedType.endsWith('[]')) {
        return 'any[]'; // Best effort for arrays
    }
    // uuid, text, varchar, timestamp, date, inet, etc.
    return 'string';
};

try {
    const rawData = fs.readFileSync(schemaPath, 'utf8');
    const schema = JSON.parse(rawData);

    // Group columns by table
    const tables = {};

    if (schema.columns) {
        schema.columns.forEach(col => {
            if (!tables[col.table_name]) {
                tables[col.table_name] = {};
            }
            tables[col.table_name][col.column_name] = {
                type: mapPostgresTypeToTs(col.data_type),
                isNullable: col.is_nullable === 'YES'
            };
        });
    }

    // Generate TS content
    let tsContent = `
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
`;

    for (const [tableName, columns] of Object.entries(tables)) {
        tsContent += `      ${tableName}: {\n`;
        tsContent += `        Row: {\n`;
        for (const [colName, colDef] of Object.entries(columns)) {
            tsContent += `          ${colName}: ${colDef.type}${colDef.isNullable ? ' | null' : ''}\n`;
        }
        tsContent += `        }\n`;
        tsContent += `        Insert: {\n`;
        for (const [colName, colDef] of Object.entries(columns)) {
            // Assume default values make it optional for insert, or if it's nullable
            // Since we don't have full default info parsed perfectly for every case, we'll try our best
            // If isNullable is YES, it's optional. 
            // Ideally we'd check column_default too, but let's stick to nullable for now to be safe, 
            // or stricter: optional if nullable OR has default (not fully captured in simple nullable check)
            const isOptional = colDef.isNullable;
            tsContent += `          ${colName}${isOptional ? '?' : ''}: ${colDef.type}${colDef.isNullable ? ' | null' : ''}\n`;
        }
        tsContent += `        }\n`;
        tsContent += `        Update: {\n`;
        for (const [colName, colDef] of Object.entries(columns)) {
            tsContent += `          ${colName}?: ${colDef.type}${colDef.isNullable ? ' | null' : ''}\n`;
        }
        tsContent += `        }\n`;
        tsContent += `        Relationships: []\n`; // Placeholder for relationships if needed
        tsContent += `      }\n`;
    }

    tsContent += `    }\n`;
    tsContent += `    Views: {\n      [_ in never]: never\n    }\n`;
    tsContent += `    Functions: {\n      [_ in never]: never\n    }\n`;
    tsContent += `    Enums: {\n      [_ in never]: never\n    }\n`;
    tsContent += `    CompositeTypes: {\n      [_ in never]: never\n    }\n`;
    tsContent += `  }\n`;
    tsContent += `}\n`;

    fs.writeFileSync(outputPath, tsContent);
    console.log(`Successfully generated definitions for ${Object.keys(tables).length} tables.`);

} catch (err) {
    console.error('Error generating types:', err);
    process.exit(1);
}
