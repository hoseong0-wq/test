import { NextRequest, NextResponse } from "next/server"

const PRODUCT_IDS: Record<string, string> = {
  pro:   process.env.POLAR_PRO_PRODUCT_ID   ?? "",
  ultra: process.env.POLAR_ULTRA_PRODUCT_ID ?? "",
}

// polar_oat_ 토큰은 sandbox/production 모두 동일 포맷
// sandbox 환경이면 POLAR_SANDBOX=true 를 .env에 추가하세요
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

    const polarRes = await fetch(`${POLAR_BASE}/v1/checkouts/`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ products: [productId] }),
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
