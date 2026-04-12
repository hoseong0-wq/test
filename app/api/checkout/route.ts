import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const PRODUCT_IDS: Record<string, string> = {
  pro:   process.env.POLAR_PRO_PRODUCT_ID   ?? "",
  ultra: process.env.POLAR_ULTRA_PRODUCT_ID ?? "",
}

const POLAR_BASE = process.env.POLAR_SANDBOX === "true"
  ? "https://sandbox-api.polar.sh"
  : "https://api.polar.sh"

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json()

    const productId = PRODUCT_IDS[plan]
    if (!productId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const token = process.env.POLAR_ACCES_TOKEN
    if (!token) {
      return NextResponse.json({ error: "Missing Polar access token" }, { status: 500 })
    }

    // 로그인한 유저의 UUID와 이메일을 Polar에 전달
    // → 웹훅에서 customer.externalId(= Supabase UUID)로 바로 조회 가능
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const polarRes = await fetch(`${POLAR_BASE}/v1/checkouts/`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        products:             [productId],
        external_customer_id: user?.id    ?? undefined, // Supabase UUID → 웹훅 조회 키
        customer_email:       user?.email ?? undefined, // 체크아웃 이메일 자동 입력
      }),
    })

    const polarData = await polarRes.json()

    if (!polarRes.ok) {
      console.error("[checkout] Polar API error:", polarData)
      return NextResponse.json(
        { error: polarData?.detail ?? "Polar API error" },
        { status: polarRes.status }
      )
    }

    return NextResponse.json({ url: polarData.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    console.error("[checkout]", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
