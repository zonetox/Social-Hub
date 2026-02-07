
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

async function checkTriggers() {
    console.log('--- CHECKING DATABASE TRIGGERS ---');

    // Query to list all triggers
    const { data, error } = await supabase.rpc('exec_sql', {
        query: `
            SELECT 
                trigger_name,
                event_object_table,
                action_statement
            FROM information_schema.triggers
            WHERE trigger_schema = 'public' OR event_object_schema = 'auth'
            ORDER BY event_object_table, trigger_name;
        `
    });

    if (error) {
        console.log('Cannot query triggers via RPC. Trying direct query...');

        // Alternative: Try to create a test user and see the actual error
        console.log('\n--- ATTEMPTING TEST USER CREATION ---');
        const testEmail = `debug-${Date.now()}@test.com`;
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: testEmail,
            password: 'Test123!',
            email_confirm: true
        });

        if (authError) {
            console.error('ERROR:', authError);
            console.error('Message:', authError.message);
            console.error('Status:', authError.status);
        } else {
            console.log('SUCCESS! User created:', authData.user.id);
            // Cleanup
            await supabase.auth.admin.deleteUser(authData.user.id);
        }
    } else {
        console.log('Triggers:', JSON.stringify(data, null, 2));
    }
}

checkTriggers();
