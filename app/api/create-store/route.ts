import { NextResponse } from 'next/server';
const xmlrpc = require('xmlrpc');

export async function POST(req: Request) {
  try {
    const { storeName, subDomain } = await req.json();

    // 2. Validate Environment Variables (Matching your Vercel screenshot!)
    const url = process.env.ODOO_URL;
    const db = process.env.ODOO_DB;
    const username = process.env.ODOO_ADMIN_EMAIL;      // <-- Updated
    const password = process.env.ODOO_ADMIN_PASSWORD;   // <-- Updated

    if (!url || !db || !username || !password) {
      console.error("CRITICAL: Missing Vercel Environment Variables", { url, db, hasUser: !!username, hasPass: !!password });
      return NextResponse.json({ success: false, error: "Server Configuration Error" }, { status: 500 });
    }

    // 3. Setup XML-RPC Clients
    const common = xmlrpc.createSecureClient(`${url}/xmlrpc/2/common`);
    const models = xmlrpc.createSecureClient(`${url}/xmlrpc/2/object`);

    // 4. STEP 1: Authenticate with the Odoo Master Server
    const uid = await new Promise((resolve, reject) => {
      common.methodCall('authenticate', [db, username, password, {}], (error: any, value: any) => {
        if (error) {
          console.error("Auth Error:", error);
          reject(error);
        }
        resolve(value);
      });
    });

    if (!uid || typeof uid !== 'number') {
      console.error("Authentication failed: UID is invalid");
      return NextResponse.json({ success: false, error: "Master Server Authentication Failed. Check Email/Password." }, { status: 401 });
    }

    // 5. STEP 2: Create the Website Record for the User
    const websiteId = await new Promise((resolve, reject) => {
      models.methodCall('execute_kw', [
        db,
        uid,
        password,
        'website',
        'create',
        [{
          'name': storeName,
          'domain': `${subDomain}.deducia.com`,
          'theme_id': 1, 
        }]
      ], (error: any, value: any) => {
        if (error) {
          console.error("Website Creation Error:", error);
          reject(error);
        }
        resolve(value);
      });
    });

    // 6. Success: Redirect user to their new subdomain login
    return NextResponse.json({ 
      success: true, 
      redirectUrl: `https://${subDomain}.deducia.com/web/login` 
    });

  } catch (error: any) {
    console.error("Deducia Bridge Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "An unexpected error occurred during store creation." 
    }, { status: 500 });
  }
}