
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

async function testTriggerDirectly() {
    console.log('--- TESTING TRIGGER EXECUTION DIRECTLY ---');

    const testEmail = `direct-test-${Date.now()}@example.com`;
    const testId = crypto.randomUUID();

    console.log(`Creating user: ${testEmail}`);
    console.log(`User ID: ${testId}`);

    // Try to insert directly into auth.users using service role
    const { data, error } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: 'Test123!',
        email_confirm: true
    });

    if (error) {
        console.error('Error creating user:', error);
        return;
    }

    console.log('User created successfully:', data.user.id);

    // Wait for trigger
    await new Promise(r => setTimeout(r, 2000));

    // Check if records were created
    console.log('\nChecking created records...');

    const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

    console.log('public.users:', userData ? 'EXISTS' : 'MISSING');

    const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

    console.log('public.profiles:', profileData ? 'EXISTS' : 'MISSING');

    // Cleanup
    await supabase.auth.admin.deleteUser(data.user.id);
}

testTriggerDirectly();
