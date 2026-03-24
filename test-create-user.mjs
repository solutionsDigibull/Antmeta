/**
 * Creates test auth users in Supabase for responsive testing
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://thnwxsbuewjsdqlettni.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRobnd4c2J1ZXdqc2RxbGV0dG5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDMzMTgwMywiZXhwIjoyMDg5OTA3ODAzfQ.tNHo_e0XRKoO-Lmi_CkpcP2g5bQLOrLzwqvRCTqbeRw";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createTestUser(email, password, role, name) {
  console.log(`Creating auth user: ${email} (${role})...`);

  // Check if user already exists by listing users
  const { data: existing } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });
  const found = existing?.users?.find(u => u.email === email);

  if (found) {
    console.log(`  → Already exists (${found.id}), updating password...`);
    const { error } = await supabase.auth.admin.updateUserById(found.id, {
      password,
      app_metadata: { role },
      user_metadata: { name },
    });
    if (error) console.error(`  ✗ Update error:`, error.message);
    else console.log(`  ✓ Updated`);
    return found.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role },
    user_metadata: { name },
  });

  if (error) {
    console.error(`  ✗ Error:`, error.message);
    return null;
  }

  console.log(`  ✓ Created: ${data.user.id}`);
  return data.user.id;
}

async function main() {
  // Create admin test user
  const adminId = await createTestUser(
    "test-admin@antmeta.in",
    "Admin@Test123!",
    "super_admin",
    "Test Admin"
  );

  // Create client test user
  const clientId = await createTestUser(
    "test-client@antmeta.in",
    "Client@Test123!",
    "client",
    "Test Client"
  );

  if (adminId) {
    // Ensure public.users record exists for admin
    const { error: uErr } = await supabase.from("users").upsert({
      id: adminId,
      email: "test-admin@antmeta.in",
      name: "Test Admin",
      role: "super_admin",
      account_type: "individual",
      status: "active",
    }, { onConflict: "id" });
    if (uErr) console.error("Admin users table error:", uErr.message);
    else console.log("✓ Admin public.users record synced");
  }

  if (clientId) {
    // Ensure public.users record exists for client
    const { error: uErr } = await supabase.from("users").upsert({
      id: clientId,
      email: "test-client@antmeta.in",
      name: "Test Client",
      role: "client",
      account_type: "individual",
      status: "active",
    }, { onConflict: "id" });
    if (uErr) console.error("Client users table error:", uErr.message);
    else console.log("✓ Client public.users record synced");

    // Create client record
    const { error: cErr } = await supabase.from("clients").upsert({
      user_id: clientId,
      client_id: "TEST001",
      kyc_status: "verified",
      plan_id: "00000000-0000-0000-0000-000000000101",
      aum: 420000,
      status: "active",
    }, { onConflict: "user_id" });
    if (cErr) console.error("Client clients table error:", cErr.message);
    else console.log("✓ Client clients record synced");
  }

  console.log("\n✅ Test users ready:");
  console.log("  Admin:  test-admin@antmeta.in  /  Admin@Test123!");
  console.log("  Client: test-client@antmeta.in  /  Client@Test123!");
}

main().catch(console.error);
