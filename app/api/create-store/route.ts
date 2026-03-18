import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { storeName, subDomain, userEmail, userPassword } = await request.json();
  
  const url = process.env.ODOO_URL;
  const db = process.env.ODOO_MASTER_DB;
  const adminEmail = process.env.ODOO_ADMIN_EMAIL;
  const adminPass = process.env.ODOO_ADMIN_PASSWORD;

  try {
    const authRes = await fetch(`${url}/jsonrpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        params: { service: "common", method: "login", args: [db, adminEmail, adminPass] }
      })
    });
    
    const { result: uid } = await authRes.json();
    if (!uid) throw new Error("Odoo Authentication Failed");

    await fetch(`${url}/jsonrpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        params: {
          service: "object",
          method: "execute_kw",
          args: [ db, uid, adminPass, "website", "create", [{
              name: storeName,
              domain: `${subDomain}.deducia.com`,
          }]]
        }
      })
    });

    return NextResponse.json({ 
      success: true, 
      redirectUrl: `https://${subDomain}.deducia.com/web/login` 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}