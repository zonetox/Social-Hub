
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

async function inspectPlans() {
    console.log('--- DB INSPECTION ---');
    const { data: plans, error } = await supabase.from('subscription_plans').select('*');
    if (error) {
        console.error('Error fetching plans:', error);
    } else {
        console.log('Available Plans:', JSON.stringify(plans, null, 2));
    }
}

inspectPlans();
