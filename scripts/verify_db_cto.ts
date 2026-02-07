import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Manual env parsing to avoid dependency issues
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

if (!supabaseUrl || !serviceRoleKey) {
    console.error('FAIL: Missing credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function verifyCTORequirements() {
    console.log('--- CTO DATABASE AUDIT START ---');

    const testEmail = `cto-test-${Date.now()}@example.com`;
    const testPassword = 'Password123!';

    console.log(`1. Creating Test User: ${testEmail}`);

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        user_metadata: { full_name: 'CTO Audit Bot' },
        email_confirm: true
    });

    if (authError) {
        console.error('FAIL: Could not create auth user', authError);
        process.exit(1);
    }

    const userId = authData.user.id;
    console.log(`SUCCESS: Auth User created with ID ${userId}`);

    // Wait for trigger
    console.log('Waiting 3s for database trigger execution...');
    await new Promise(r => setTimeout(r, 3000));

    // Verify Tables
    const checks = [
        { table: 'users', query: supabase.from('users').select('*').eq('id', userId).maybeSingle() },
        { table: 'profiles', query: supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle() },
        { table: 'user_subscriptions', query: supabase.from('user_subscriptions').select('*').eq('user_id', userId).maybeSingle() },
        { table: 'card_credits', query: supabase.from('card_credits').select('*').eq('user_id', userId).maybeSingle() }
    ];

    console.log('\n2. Verifying Records:');
    let allPassed = true;

    for (const check of checks) {
        const { data, error } = await check.query;
        if (error) {
            console.error(`- ${check.table}: ERROR`, error.message);
            allPassed = false;
        } else if (!data) {
            console.error(`- ${check.table}: MISSING`);
            allPassed = false;
        } else {
            console.log(`- ${check.table}: PASS (Record exists)`);
            if (check.table === 'card_credits') {
                console.log(`  -> Credits: ${data.amount} (Required: 5)`);
                if (data.amount !== 5) allPassed = false;
            }
        }
    }

    // Cleanup
    console.log('\n3. Cleaning up test user...');
    await supabase.auth.admin.deleteUser(userId);

    console.log('\n--- AUDIT FINAL RESULT ---');
    if (allPassed) {
        console.log('ALL CTO DATABASE TRIGGERS: PASSED');
    } else {
        console.log('AUDIT: FAILED');
    }
}

verifyCTORequirements();
