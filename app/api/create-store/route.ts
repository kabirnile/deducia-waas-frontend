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

    // 2. CHECK DATABASE: Duplicate Email Prevention
    const existingUsers: any = await new Promise((resolve, reject) => {
      models.methodCall('execute_kw', [db, uid, password, 'res.users', 'search', [[['login', '=', userEmail]]]], (error: any, value: any) => {
        if (error) reject(error);
        resolve(value);
      });
    });

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ success: false, error: "This email is already registered to a store." }, { status: 400 });
    }

    // 3. ISOLATION: Create a Private Company for the User
    const companyId = await new Promise((resolve, reject) => {
      models.methodCall('execute_kw', [db, uid, password, 'res.company', 'create', [{
        'name': storeName,
      }]], (error: any, value: any) => {
        if (error) reject(error);
        resolve(value);
      });
    });

    // 4. Create the Website and Lock it to the new Company
    const websiteId = await new Promise((resolve, reject) => {
      models.methodCall('execute_kw', [db, uid, password, 'website', 'create', [{
        'name': storeName,
        'domain': `${subDomain}.deducia.com`,
        'company_id': companyId
      }]], (error: any, value: any) => {
        if (error) reject(error);
        resolve(value);
      });
    });

    // 5. PERMISSIONS: Helper function to get correct Odoo Group IDs
    const getGroupId = async (moduleName: string, xmlId: string) => {
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
    };

    // Fetch Internal User, Website Designer, and Sales Admin rights
    const groupUserId = await getGroupId('base', 'group_user');
    const groupWebsiteDesignerId = await getGroupId('website', 'group_website_designer');
    const groupSalesManagerId = await getGroupId('sales_team', 'group_sale_manager');
    const groupIds = [groupUserId, groupWebsiteDesignerId, groupSalesManagerId].filter(Boolean);

    // 6. Create the User, assign Permissions, and Lock to Company
    const newUserId = await new Promise((resolve, reject) => {
      models.methodCall('execute_kw', [db, uid, password, 'res.users', 'create', [{
        'name': `${storeName} Admin`,
        'login': userEmail,
        'password': userPassword,
        'company_id': companyId,
        'company_ids': [[6, 0, [companyId]]], // User can ONLY see this company
        'groups_id': [[6, 0, groupIds]] // Grants editing rights
      }]], (error: any, value: any) => {
        if (error) reject(error);
        resolve(value);
      });
    });

    // 7. Success Redirect to the Configurator Wizard
    return NextResponse.json({ 
      success: true, 
      redirectUrl: `https://${subDomain}.deducia.com/web/login?redirect=/website/configurator` 
    });

  } catch (error: any) {
    console.error("Deducia Bridge Error:", error);
    return NextResponse.json({ success: false, error: "An unexpected error occurred." }, { status: 500 });
  }
}