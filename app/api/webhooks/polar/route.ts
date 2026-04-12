import { NextRequest, NextResponse } from "next/server"
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks"
import { createClient } from "@supabase/supabase-js"

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>

async function resolveUserId(
  supabase: SupabaseAdmin,
  externalId: string | null | undefined,
  email: string | null | undefined
): Promise<string | null> {
  if (externalId) return externalId

  if (!email) return null
  console.warn("[polar-webhook] No externalId, falling back to email lookup:", email)
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (error || !data) return null
  const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  return found?.id ?? null
}

const PRO_PRODUCT_ID   = process.env.POLAR_PRO_PRODUCT_ID!
const ULTRA_PRODUCT_ID = process.env.POLAR_ULTRA_PRODUCT_ID!

const PLAN_CREDITS: Record<string, number> = {
  pro:   100,
  ultra: 300,
}

const UPGRADE_BONUS_CREDITS = 200

function productIdToPlan(productId: string): "pro" | "ultra" | null {
  if (productId === PRO_PRODUCT_ID)   return "pro"
  if (productId === ULTRA_PRODUCT_ID) return "ultra"
  return null
}

async function updateUserPlan(
  supabase: SupabaseAdmin,
  userId: string,
  newPlan: "free" | "pro" | "ultra",
  subscriptionStatus: "active" | "inactive"
) {
  const { data: userRow, error: userErr } = await supabase
    .from("users")
    .select("plan, credits")
    .eq("id", userId)
    .single()

  if (userErr || !userRow) {
    console.error("[polar-webhook] updateUserPlan — user row not found:", userId, userErr)
    return false
  }

  const oldPlan = (userRow.plan as string) ?? "free"
  const planRank: Record<string, number> = { free: 0, pro: 1, ultra: 2 }
  // pro→ultra 업그레이드만 차액 보너스 (free→유료는 order.paid에서 크레딧 처리)
  const isUpgrade = planRank[newPlan] > planRank[oldPlan] && oldPlan !== "free"

  const updatePayload: Record<string, unknown> = {
    plan:                newPlan,
    subscription_status: subscriptionStatus,
  }

  if (isUpgrade) {
    updatePayload.credits = (userRow.credits ?? 0) + UPGRADE_BONUS_CREDITS
    console.info(`[polar-webhook] updateUserPlan — upgrade ${oldPlan}→${newPlan}, +${UPGRADE_BONUS_CREDITS} credits`)
  } else {
    console.info(`[polar-webhook] updateUserPlan — ${oldPlan}→${newPlan} (${subscriptionStatus})`)
  }

  const { error } = await supabase.from("users").update(updatePayload).eq("id", userId)
  if (error) {
    console.error("[polar-webhook] updateUserPlan — update failed:", error)
    return false
  }
  return true
}

export const dynamic = "force-dynamic"

export async function GET() {
  return Response.json({
    ok: true,
    endpoint: "/api/webhooks/polar",
    env: {
      hasSecret:      !!process.env.POLAR_WEBHOOK_SECRET,
      hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      sandbox:        process.env.POLAR_SANDBOX,
      proId:          process.env.POLAR_PRO_PRODUCT_ID,
      ultraId:        process.env.POLAR_ULTRA_PRODUCT_ID,
    },
  })
}

export async function POST(req: NextRequest) {
  const secret = process.env.POLAR_WEBHOOK_SECRET
  if (!secret) {
    console.error("[polar-webhook] POLAR_WEBHOOK_SECRET is not set")
    return new NextResponse("Server misconfiguration", { status: 500 })
  }

  const rawBody = await req.text()
  const headers: Record<string, string> = {}
  req.headers.forEach((value, key) => { headers[key] = value })

  let event
  try {
    event = validateEvent(rawBody, headers, secret)
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      console.warn("[polar-webhook] Signature verification failed:", err.message)
      return new NextResponse("Invalid signature", { status: 403 })
    }
    console.error("[polar-webhook] Unexpected validation error:", err)
    return new NextResponse("Bad request", { status: 400 })
  }

  console.info("[polar-webhook] Received event:", event.type)

  const supabase = getSupabaseAdmin()

  try {
    // ── 1. order.paid — 결제 완료 → payments 기록 + 크레딧 충전 ─────────────
    if (event.type === "order.paid") {
      const order = event.data

      const productId = order.productId ?? order.product?.id ?? null
      const plan = productId ? productIdToPlan(productId) : null

      console.info("[polar-webhook] order.paid — productId:", productId, "→ plan:", plan)

      if (!plan) {
        console.warn("[polar-webhook] order.paid — unknown productId, skipping:", productId)
        return new NextResponse("OK", { status: 200 })
      }

      const userId = await resolveUserId(supabase, order.customer.externalId, order.customer.email)
      if (!userId) {
        console.error("[polar-webhook] order.paid — user not found:", order.customer.email)
        return new NextResponse("User not found", { status: 404 })
      }

      const { data: userRow, error: userErr } = await supabase
        .from("users")
        .select("credits")
        .eq("id", userId)
        .single()

      if (userErr || !userRow) {
        console.error("[polar-webhook] order.paid — users row not found:", userId, userErr)
        return new NextResponse("User not found", { status: 404 })
      }

      // 중복 처리 방지
      const { data: existing } = await supabase
        .from("payments")
        .select("id")
        .eq("polar_order_id", order.id)
        .maybeSingle()

      if (existing) {
        console.info("[polar-webhook] order.paid — duplicate, skipping:", order.id)
        return new NextResponse("OK", { status: 200 })
      }

      // payments 기록
      const { error: paymentErr } = await supabase.from("payments").insert({
        user_id:        userId,
        polar_order_id: order.id,
        plan,
        amount:         order.totalAmount,
        paid_at:        order.createdAt,
        status:         "paid",
      })
      if (paymentErr) {
        console.error("[polar-webhook] order.paid — payments insert failed:", paymentErr)
      }

      // 크레딧 충전
      const creditsToAdd = PLAN_CREDITS[plan]
      const { error: creditErr } = await supabase
        .from("users")
        .update({ credits: (userRow.credits ?? 0) + creditsToAdd })
        .eq("id", userId)

      if (creditErr) {
        console.error("[polar-webhook] order.paid — credits update failed:", creditErr)
        return new NextResponse("DB error", { status: 500 })
      }

      console.info(`[polar-webhook] order.paid — userId=${userId} +${creditsToAdd} credits (${plan})`)
      return new NextResponse("OK", { status: 200 })
    }

    // ── 2. subscription.active — 구독 활성화 → plan 갱신 ────────────────────
    if (event.type === "subscription.active") {
      const sub = event.data

      const plan = productIdToPlan(sub.productId)
      if (!plan) {
        console.warn("[polar-webhook] subscription.active — unknown productId:", sub.productId)
        return new NextResponse("OK", { status: 200 })
      }

      const userId = await resolveUserId(
        supabase,
        sub.customer.externalId,
        sub.customer.email
      )
      if (!userId) {
        console.error("[polar-webhook] subscription.active — user not found:", sub.customer.email)
        return new NextResponse("User not found", { status: 404 })
      }

      const ok = await updateUserPlan(supabase, userId, plan, "active")
      if (!ok) return new NextResponse("DB error", { status: 500 })

      console.info(`[polar-webhook] subscription.active — userId=${userId} plan=${plan}`)
      return new NextResponse("OK", { status: 200 })
    }

    // ── 3. subscription.canceled — 취소 예약 (기간 만료까지 접근권 유지) ───────
    if (event.type === "subscription.canceled") {
      const sub = event.data

      // cancelAtPeriodEnd=false → 플랜 업그레이드 등으로 인한 즉시 취소.
      // subscription.revoked / customer.state_changed 가 처리하므로 여기서는 무시.
      if (!sub.cancelAtPeriodEnd) {
        console.info("[polar-webhook] subscription.canceled — immediate cancel (not period-end), skipping")
        return new NextResponse("OK", { status: 200 })
      }

      const userId = await resolveUserId(
        supabase,
        sub.customer.externalId,
        sub.customer.email
      )
      if (!userId) {
        console.error("[polar-webhook] subscription.canceled — user not found:", sub.customer.email)
        return new NextResponse("User not found", { status: 404 })
      }

      const { error } = await supabase
        .from("users")
        .update({ subscription_status: "to_be_cancelled" })
        .eq("id", userId)

      if (error) {
        console.error("[polar-webhook] subscription.canceled — update failed:", error)
        return new NextResponse("DB error", { status: 500 })
      }

      console.info(`[polar-webhook] subscription.canceled — userId=${userId} → to_be_cancelled (ends: ${sub.endsAt})`)
      return new NextResponse("OK", { status: 200 })
    }

    // ── 4. subscription.revoked — 기간 만료, 접근권 완전 소멸 → plan=free ──────
    if (event.type === "subscription.revoked") {
      const sub = event.data

      const userId = await resolveUserId(
        supabase,
        sub.customer.externalId,
        sub.customer.email
      )
      if (!userId) {
        console.error("[polar-webhook] subscription.revoked — user not found:", sub.customer.email)
        return new NextResponse("User not found", { status: 404 })
      }

      const ok = await updateUserPlan(supabase, userId, "free", "inactive")
      if (!ok) return new NextResponse("DB error", { status: 500 })

      console.info(`[polar-webhook] subscription.revoked — userId=${userId} → free/inactive`)
      return new NextResponse("OK", { status: 200 })
    }

    // ── 5. subscription.past_due — 결제 실패, 재시도 중 ─────────────────────
    if (event.type === "subscription.past_due") {
      const sub = event.data

      const userId = await resolveUserId(
        supabase,
        sub.customer.externalId,
        sub.customer.email
      )
      if (!userId) {
        console.error("[polar-webhook] subscription.past_due — user not found:", sub.customer.email)
        return new NextResponse("User not found", { status: 404 })
      }

      const { error } = await supabase
        .from("users")
        .update({ subscription_status: "past_due" })
        .eq("id", userId)

      if (error) {
        console.error("[polar-webhook] subscription.past_due — update failed:", error)
        return new NextResponse("DB error", { status: 500 })
      }

      console.info(`[polar-webhook] subscription.past_due — userId=${userId} → past_due`)
      return new NextResponse("OK", { status: 200 })
    }

    // ── 6. subscription.uncanceled — 취소 철회 → 다시 active ─────────────────
    if (event.type === "subscription.uncanceled") {
      const sub = event.data

      const userId = await resolveUserId(
        supabase,
        sub.customer.externalId,
        sub.customer.email
      )
      if (!userId) {
        console.error("[polar-webhook] subscription.uncanceled — user not found:", sub.customer.email)
        return new NextResponse("User not found", { status: 404 })
      }

      const { error } = await supabase
        .from("users")
        .update({ subscription_status: "active" })
        .eq("id", userId)

      if (error) {
        console.error("[polar-webhook] subscription.uncanceled — update failed:", error)
        return new NextResponse("DB error", { status: 500 })
      }

      console.info(`[polar-webhook] subscription.uncanceled — userId=${userId} → active`)
      return new NextResponse("OK", { status: 200 })
    }

    // ── 7. customer.state_changed — 최종 안전망: plan 갱신 ──────────────────
    // subscription_status는 개별 이벤트 핸들러가 정확히 관리.
    // 여기서는 plan과 inactive 전환만 책임진다.
    // (to_be_cancelled / past_due 상태를 덮어쓰지 않도록 activeSubscriptions가 있을 때는 status를 건드리지 않음)
    if (event.type === "customer.state_changed") {
      const state  = event.data
      const stateAny = state as {
        externalId?: string | null
        email?: string | null
        activeSubscriptions: Array<{ productId: string }>
      }

      const userId = await resolveUserId(supabase, stateAny.externalId, stateAny.email)
      if (!userId) {
        console.error("[polar-webhook] customer.state_changed — user not found:", stateAny.email)
        return new NextResponse("User not found", { status: 404 })
      }

      // 활성 구독에서 플랜 판별 (ultra > pro > free)
      let newPlan: "free" | "pro" | "ultra" = "free"
      for (const s of stateAny.activeSubscriptions) {
        const p = productIdToPlan(s.productId)
        if (p === "ultra") { newPlan = "ultra"; break }
        if (p === "pro")   { newPlan = "pro" }
      }

      console.info("[polar-webhook] customer.state_changed — activeSubs count:",
        stateAny.activeSubscriptions.length, "→ newPlan:", newPlan)

      if (newPlan === "free") {
        // 활성 구독 없음 → plan=free, status=inactive 확정
        const ok = await updateUserPlan(supabase, userId, "free", "inactive")
        if (!ok) return new NextResponse("DB error", { status: 500 })
      } else {
        // 활성 구독이 있으면 plan만 갱신.
        // subscription_status는 subscription.canceled / subscription.uncanceled /
        // subscription.past_due 핸들러가 정확한 값을 이미 설정했으므로 건드리지 않는다.
        const { error } = await supabase
          .from("users")
          .update({ plan: newPlan })
          .eq("id", userId)
        if (error) {
          console.error("[polar-webhook] customer.state_changed — plan update failed:", error)
          return new NextResponse("DB error", { status: 500 })
        }
      }

      return new NextResponse("OK", { status: 200 })
    }

    return new NextResponse("OK", { status: 200 })
  } catch (err) {
    console.error("[polar-webhook] Handler error:", err)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
