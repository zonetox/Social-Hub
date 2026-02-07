
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

async function inspectSchema() {
    console.log('--- DB SCHEMA INSPECTION ---');

    // Check missing columns in users
    const { data: users, error: uErr } = await supabase.from('users').select('*').limit(1);
    if (!uErr && users && users.length > 0) {
        console.log('User Columns:', Object.keys(users[0]));
    } else {
        console.log('Could not fetch user columns (might be empty or RLS blocked)');
    }

    // Check profiles
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('*').limit(1);
    if (!pErr && profiles && profiles.length > 0) {
        console.log('Profile Columns:', Object.keys(profiles[0]));
    }
}

inspectSchema();
