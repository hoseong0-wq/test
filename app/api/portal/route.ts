import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const POLAR_BASE = process.env.POLAR_SANDBOX === "true"
  ? "https://sandbox-api.polar.sh"
  : "https://api.polar.sh"

export async function GET() {
  try {
    const token = process.env.POLAR_ACCES_TOKEN
    if (!token) {
      return NextResponse.json({ error: "Missing Polar access token" }, { status: 500 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Look up Polar customer by the Supabase UUID (external_customer_id)
    const customerRes = await fetch(
      `${POLAR_BASE}/v1/customers?external_customer_id=${user.id}&limit=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const customerData = await customerRes.json()

    if (!customerRes.ok || !customerData.items?.length) {
      return NextResponse.json({ error: "Polar customer not found" }, { status: 404 })
    }

    const customerId: string = customerData.items[0].id

    // Create an authenticated customer session → portal URL
    const sessionRes = await fetch(`${POLAR_BASE}/v1/customer-sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ customer_id: customerId }),
    })
    const sessionData = await sessionRes.json()

    if (!sessionRes.ok) {
      console.error("[portal] customer-sessions error:", sessionData)
      return NextResponse.json(
        { error: sessionData?.detail ?? "Failed to create portal session" },
        { status: sessionRes.status }
      )
    }

    return NextResponse.json({ url: sessionData.customer_portal_url })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    console.error("[portal]", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
