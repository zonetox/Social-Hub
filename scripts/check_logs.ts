import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length > 0) {
        env[key.trim()] = vals.join('=').trim();
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, serviceRoleKey!);

async function checkDebugLogs() {
    console.log('='.repeat(60));
    console.log('CHECKING DEBUG LOGS');
    console.log('='.repeat(60));

    const { data, error } = await supabase
        .from('debug_logs')
        .select('*')
        .order('id', { ascending: false })
        .limit(20);

    if (error) {
        console.error('❌ Error fetching logs:', error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log('⚠️ No logs found. Did the trigger run?');
        return;
    }

    console.log(`Found ${data.length} log entries:\n`);
    data.reverse().forEach(log => {
        console.log(`[${new Date(log.created_at).toISOString()}] ${log.message}`);
    });
}

checkDebugLogs();
