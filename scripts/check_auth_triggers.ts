
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

async function checkAuthTriggers() {
    console.log('--- CHECKING AUTH.USERS TRIGGERS ---');

    // Check if trigger exists on auth.users
    const { data, error } = await supabase.rpc('exec_sql', {
        query: `
            SELECT 
                trigger_name,
                event_object_schema,
                event_object_table,
                action_timing,
                event_manipulation
            FROM information_schema.triggers
            WHERE event_object_schema = 'auth' AND event_object_table = 'users'
            ORDER BY trigger_name;
        `
    });

    if (error) {
        console.log('RPC not available. Checking via alternative method...');

        // Alternative: Check all triggers
        const { data: allTriggers } = await supabase.rpc('exec_sql', {
            query: `
                SELECT 
                    trigger_name,
                    event_object_schema || '.' || event_object_table as full_table_name
                FROM information_schema.triggers
                WHERE trigger_name = 'on_auth_user_created'
                ORDER BY event_object_schema, event_object_table;
            `
        });

        console.log('All on_auth_user_created triggers:', JSON.stringify(allTriggers, null, 2));
    } else {
        console.log('Auth.users triggers:', JSON.stringify(data, null, 2));
    }
}

checkAuthTriggers();
