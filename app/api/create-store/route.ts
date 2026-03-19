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
      return NextResponse.json({ success: false, error: "Master Server Authentication Failed." }, { status: 401 });
    }

    // 2. CHECK DATABASE
    const existingUsers: any = await new Promise((resolve, reject) => {
      models.methodCall('execute_kw', [db, uid, password, 'res.users', 'search', [[['login', '=', userEmail]]]], (error: any, value: any) => {
        if (error) reject(error);
        resolve(value);
      });
    });

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ success: false, error: "This email is already registered." }, { status: 400 });
    }

    // 3. ISOLATION: Create a Private Company
    const companyId = await new Promise((resolve, reject) => {
      models.methodCall('execute_kw', [db, uid, password, 'res.company', 'create', [{
        'name': storeName,
      }]], (error: any, value: any) => {
        if (error) reject(error);
        resolve(value);
      });
    });

    // 4. Create the Website (Forced Default Theme & Secure HTTPS Domain)
    const websiteId = await new Promise((resolve, reject) => {
      models.methodCall('execute_kw', [db, uid, password, 'website', 'create', [{
        'name': storeName,
        'domain': `https://${subDomain}.deducia.com`,
        'company_id': companyId,
        'theme_id': 1 // <--- Bypasses the configurator crash
      }]], (error: any, value: any) => {
        if (error) reject(error);
        resolve(value);
      });
    });

    // 5. PERMISSIONS (Wrapped in safety net so it never crashes Vercel)
    const getGroupId = async (moduleName: string, xmlId: string) => {
      try {
        const result: any = await new Promise((resolve, reject) => {
          models.methodCall('execute_kw', [db, uid, password, 'ir.model.data', 'search_read',
            [[['module', '=', moduleName], ['name', '=', xmlId]]],
            {'fields': ['res_id']}
          ], (error: any, value: any) => {
            if (error) reject(error);
            resolve(value);
          });
        });
        return result && result.length > 0 ? result[0].res_id : null;
      } catch (e) {
        return null;
      }
    };

    const groupUserId = await getGroupId('base', 'group_user');
    const groupWebsiteDesignerId = await getGroupId('website', 'group_website_designer');
    const groupIds = [groupUserId, groupWebsiteDesignerId].filter(Boolean);

    // 6. Create the User Account
    const newUserId = await new Promise((resolve, reject) => {
      models.methodCall('execute_kw', [db, uid, password, 'res.users', 'create', [{
        'name': `${storeName} Admin`,
        'login': userEmail,
        'password': userPassword,
        'company_id': companyId,
        'company_ids': [[6, 0, [companyId]]],
        'groups_id': [[6, 0, groupIds]]
      }]], (error: any, value: any) => {
        if (error) reject(error);
        resolve(value);
      });
    });

    // 7. Success Redirect (Sends user straight to their website frontend to start dragging and dropping)
    return NextResponse.json({ 
      success: true, 
      redirectUrl: `https://${subDomain}.deducia.com/web/login?redirect=/` 
    });

  } catch (error: any) {
    console.error("Deducia Bridge Error:", error);
    return NextResponse.json({ success: false, error: "Server Timeout. Please try again." }, { status: 500 });
  }
}