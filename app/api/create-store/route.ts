import { NextResponse } from 'next/server';
const xmlrpc = require('xmlrpc');

export async function POST(req: Request) {
  try {
    const { storeName, subDomain, userEmail, userPassword } = await req.json();

    const url = process.env.ODOO_URL;
    const db = process.env.ODOO_DB;
    const username = process.env.ODOO_ADMIN_EMAIL;      
    const password = process.env.ODOO_ADMIN_PASSWORD;   

    if (!url || !db || !username || !password) {
      return NextResponse.json({ success: false, error: "Server Configuration Error" }, { status: 500 });
    }

    const common = xmlrpc.createSecureClient(`${url}/xmlrpc/2/common`);
    const models = xmlrpc.createSecureClient(`${url}/xmlrpc/2/object`);

    // 1. Master Authentication
    const uid = await new Promise((resolve, reject) => {
      common.methodCall('authenticate', [db, username, password, {}], (error: any, value: any) => {
        if (error) reject(error);
        resolve(value);
      });
    });

    if (!uid || typeof uid !== 'number') {
      return NextResponse.json({ success: false, error: "Master Server Authentication Failed. Check Vercel Password." }, { status: 401 });
    }

    // 2. CHECK DATABASE: Does the customer email already exist?
    const existingUsers: any = await new Promise((resolve, reject) => {
      models.methodCall('execute_kw', [db, uid, password, 'res.users', 'search', [[['login', '=', userEmail]]]], (error: any, value: any) => {
        if (error) reject(error);
        resolve(value);
      });
    });

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ success: false, error: "This email is already registered to a store." }, { status: 400 });
    }

    // 3. Create the Website Record (theme_id removed so the wizard triggers)
    const websiteId = await new Promise((resolve, reject) => {
      models.methodCall('execute_kw', [db, uid, password, 'website', 'create', [{
        'name': storeName,
        'domain': `${subDomain}.deducia.com`
      }]], (error: any, value: any) => {
        if (error) reject(error);
        resolve(value);
      });
    });

    // 4. Create the User Account for the Shop Owner
    const newUserId = await new Promise((resolve, reject) => {
      models.methodCall('execute_kw', [db, uid, password, 'res.users', 'create', [{
        'name': `${storeName} Admin`,
        'login': userEmail,
        'password': userPassword,
      }]], (error: any, value: any) => {
        if (error) reject(error);
        resolve(value);
      });
    });

    // 5. Success: Redirect straight to the website maker after login
    return NextResponse.json({ 
      success: true, 
      redirectUrl: `https://${subDomain}.deducia.com/web/login?redirect=/website/configurator` 
    });

  } catch (error: any) {
    console.error("Deducia Bridge Error:", error);
    return NextResponse.json({ success: false, error: "An unexpected error occurred." }, { status: 500 });
  }
}