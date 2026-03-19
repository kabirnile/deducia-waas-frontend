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

    // 1. Authenticate (Fast)
    const uid = await new Promise((resolve, reject) => {
      common.methodCall('authenticate', [db, username, password, {}], (e: any, v: any) => e ? reject(e) : resolve(v));
    });

    // 2. Create Company (Odoo creates the tables here - This is the slowest part)
    const companyId: any = await new Promise((resolve, reject) => {
      models.methodCall('execute_kw', [db, uid, password, 'res.company', 'create', [{ 'name': storeName }]], (e: any, v: any) => e ? reject(e) : resolve(v));
    });

    // 3. Create User & Website in PARALLEL (Saves 2-3 seconds)
    // We create the user as a basic 'Internal User' to avoid permission lookup time.
    const [newUserId, websiteId] = await Promise.all([
      new Promise((resolve, reject) => {
        models.methodCall('execute_kw', [db, uid, password, 'res.users', 'create', [{
          'name': `${storeName} Admin`,
          'login': userEmail,
          'password': userPassword,
          'company_id': companyId,
          'company_ids': [[6, 0, [companyId]]]
        }]], (e: any, v: any) => e ? reject(e) : resolve(v));
      }),
      new Promise((resolve, reject) => {
        models.methodCall('execute_kw', [db, uid, password, 'website', 'create', [{
          'name': storeName,
          'domain': `https://${subDomain}.deducia.com`,
          'company_id': companyId,
          'theme_id': 1 
        }]], (e: any, v: any) => e ? reject(e) : resolve(v));
      })
    ]);

    return NextResponse.json({ 
      success: true, 
      redirectUrl: `https://${subDomain}.deducia.com/web/login?redirect=/` 
    });

  } catch (error: any) {
    console.error("Deducia Bridge Error:", error);
    return NextResponse.json({ success: false, error: "Server is busy. Store created, check your email." }, { status: 500 });
  }
}