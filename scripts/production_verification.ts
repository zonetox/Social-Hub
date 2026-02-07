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

async function productionVerification() {
    console.log('='.repeat(60));
    console.log('PRODUCTION AUTH TRIGGER VERIFICATION');
    console.log('='.repeat(60));

    const testEmail = `prod-test-${Date.now()}@example.com`;
    let userId: string | null = null;

    try {
        // Test A: Create user with auth.admin.createUser()
        console.log('\n[TEST A] Creating user with auth.admin.createUser()...');
        console.log(`Email: ${testEmail}`);

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: testEmail,
            password: 'Test123!@#',
            email_confirm: true
        });

        if (authError) {
            console.error('❌ FAILED to create user:', authError.message);
            return;
        }

        userId = authData.user.id;
        console.log(`✅ User created: ${userId}`);

        // Wait for trigger
        console.log('\nWaiting 2s for trigger execution...');
        await new Promise(r => setTimeout(r, 2000));

        // Test B: Verify all records created
        console.log('\n[TEST B] Verifying records in public tables...\n');

        // Check users
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (userData) {
            console.log('✅ public.users: EXISTS');
            console.log(`   - email: ${userData.email}`);
            console.log(`   - username: ${userData.username}`);
        } else {
            console.log('❌ public.users: MISSING');
            if (userError) console.log(`   Error: ${userError.message}`);
        }

        // Check profiles
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (profileData) {
            console.log('✅ public.profiles: EXISTS');
            console.log(`   - display_name: ${profileData.display_name}`);
            console.log(`   - slug: ${profileData.slug}`);
        } else {
            console.log('❌ public.profiles: MISSING');
            if (profileError) console.log(`   Error: ${profileError.message}`);
        }

        // Check subscriptions
        const { data: subData, error: subError } = await supabase
            .from('user_subscriptions')
            .select('*, subscription_plans(name)')
            .eq('user_id', userId)
            .single();

        if (subData) {
            console.log('✅ public.user_subscriptions: EXISTS');
            console.log(`   - plan: ${(subData.subscription_plans as any)?.name}`);
            console.log(`   - status: ${subData.status}`);
        } else {
            console.log('❌ public.user_subscriptions: MISSING');
            if (subError) console.log(`   Error: ${subError.message}`);
        }

        // Check credits
        const { data: creditData, error: creditError } = await supabase
            .from('card_credits')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (creditData) {
            console.log('✅ public.card_credits: EXISTS');
            console.log(`   - amount: ${creditData.amount}`);
        } else {
            console.log('❌ public.card_credits: MISSING');
            if (creditError) console.log(`   Error: ${creditError.message}`);
        }

        // Final verdict
        const allExist = userData && profileData && subData && creditData;
        console.log('\n' + '='.repeat(60));
        if (allExist) {
            console.log('✅ VERIFICATION PASSED - All records created successfully!');
        } else {
            console.log('❌ VERIFICATION FAILED - Some records missing');
        }
        console.log('='.repeat(60));

    } catch (error: any) {
        console.error('\n❌ UNEXPECTED ERROR:', error.message);
    } finally {
        // Cleanup
        if (userId) {
            console.log(`\nCleaning up test user ${userId}...`);
            await supabase.auth.admin.deleteUser(userId);
            console.log('✅ Cleanup complete');
        }
    }
}

productionVerification();
