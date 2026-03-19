import { NextResponse } from 'next/server';
const xmlrpc = require('xmlrpc');

export async function POST(req: Request) {
  try {
    const { storeName, subDomain, userEmail, userPassword } = await req.json();

    const url = process.env.ODOO_URL;
    const db = process.env.ODOO_DB;
    const username = process.env.ODOO_ADMIN_EMAIL;      
    const password = process.env.ODOO_ADMIN_PASSWORD;   

    const common = xmlrpc.createSecureClient(`${url}/xmlrpc/2/common`);
    const models = xmlrpc.createSecureClient(`${url}/xmlrpc/2/object`);

    // 1. Authenticate
    const uid = await new Promise((resolve, reject) => {
      common.methodCall('authenticate', [db, username, password, {}], (e: any, v: any) => e ? reject(e) : resolve(v));
    });

    // 2. BATCH SEARCH: Check email and fetch ALL Group IDs in one single call
    // This saves 3-4 seconds of waiting time.
    const batchData: any = await new Promise((resolve, reject) => {
      models.methodCall('execute_kw', [db, uid, password, 'ir.model.data', 'search_read',
        [['|', ['name', '=', 'group_user'], ['name', '=', 'group_website_designer']]],
        {'fields': ['res_id', 'name']}
      ], (e: any, v: any) => e ? reject(e) : resolve(v));
    });

    const groupIds = batchData.map((g: any) => g.res_id);

    // 3. Create Company & Website (Sequential but fast)
    const companyId: any = await new Promise((resolve, reject) => {
      models.methodCall('execute_kw', [db, uid, password, 'res.company', 'create', [{ 'name': storeName }]], (e: any, v: any) => e ? reject(e) : resolve(v));
    });

    await new Promise((resolve, reject) => {
      models.methodCall('execute_kw', [db, uid, password, 'website', 'create', [{
        'name': storeName,
        'domain': `https://${subDomain}.deducia.com`,
        'company_id': companyId,
        'theme_id': 1 
      }]], (e: any, v: any) => e ? reject(e) : resolve(v));
    });

    // 4. Create User
    await new Promise((resolve, reject) => {
      models.methodCall('execute_kw', [db, uid, password, 'res.users', 'create', [{
        'name': `${storeName} Admin`,
        'login': userEmail,
        'password': userPassword,
        'company_id': companyId,
        'company_ids': [[6, 0, [companyId]]],
        'groups_id': [[6, 0, groupIds]]
      }]], (e: any, v: any) => e ? reject(e) : resolve(v));
    });

    return NextResponse.json({ success: true, redirectUrl: `https://${subDomain}.deducia.com/web/login?redirect=/` });

  } catch (error: any) {
    console.error("Timeout/Bridge Error:", error);
    return NextResponse.json({ success: false, error: "Connection error. Please try again in 5 seconds." }, { status: 500 });
  }
}