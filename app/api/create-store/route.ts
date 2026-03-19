import { NextResponse } from 'next/server';
const xmlrpc = require('xmlrpc');

export async function POST(req: Request) {
  try {
    const { storeName, subDomain, userEmail } = await req.json();

    // 1. Setup XML-RPC Connection to your VPS
    const common = xmlrpc.createSecureClient(`${process.env.ODOO_URL}/xmlrpc/2/common`);
    
    // 2. Authenticate with Odoo
    const uid = await new Promise((resolve, reject) => {
      common.methodCall('authenticate', [
        process.env.ODOO_DB,
        process.env.ODOO_ADMIN_USER,
        process.env.ODOO_ADMIN_PASS,
        {}
      ], (error: any, value: any) => {
        if (error) reject(error);
        resolve(value);
      });
    });

    if (!uid) {
      return NextResponse.json({ success: false, error: "Authentication Failed" }, { status: 401 });
    }

    // 3. Create the Website Record in Odoo
    const models = xmlrpc.createSecureClient(`${process.env.ODOO_URL}/xmlrpc/2/object`);
    
    const websiteId = await new Promise((resolve, reject) => {
      models.methodCall('execute_kw', [
        process.env.ODOO_DB,
        uid,
        process.env.ODOO_ADMIN_PASS,
        'website',
        'create',
        [{
          'name': storeName,
          'domain': `${subDomain}.deducia.com`,
          'theme_id': 1, // Default theme
        }]
      ], (error: any, value: any) => {
        if (error) reject(error);
        resolve(value);
      });
    });

    return NextResponse.json({ 
      success: true, 
      redirectUrl: `https://${subDomain}.deducia.com/web/signup` 
    });

  } catch (error: any) {
    console.error("Deployment Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}