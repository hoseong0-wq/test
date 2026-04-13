import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { THUMBNAIL_SYSTEM_PROMPT } from "@/lib/prompts/thumbnail-system-prompt";
import { createClient } from "@/lib/supabase/server";

type AspectRatio = "16:9" | "9:16" | "1:1" | "4:3";
type ImageStyle = "Realistic" | "3D" | "Art" | "Anime";

const RATIO_DIMS: Record<AspectRatio, { width: number; height: number }> = {
  "16:9": { width: 1280, height: 720 },
  "9:16": { width: 720, height: 1280 },
  "1:1":  { width: 1024, height: 1024 },
  "4:3":  { width: 1024, height: 768 },
};

const STYLE_HINTS: Record<ImageStyle, string> = {
  Realistic: "photorealistic, ultra-detailed, 8K DSLR quality",
  "3D":      "3D rendered, Cinema 4D style, ray-traced lighting, subsurface scattering",
  Art:       "digital artwork, painterly brushwork, concept art, illustration style",
  Anime:     "anime style, manga-influenced, cel-shaded, vibrant flat colors",
};

interface ImagePart {
  mimeType: string;
  data: string; // base64, no data: prefix
}

async function enhancePrompt(
  userPrompt: string,
  imageParts: ImagePart[],
  style: ImageStyle
): Promise<string> {
  try {
    const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const styleHint = STYLE_HINTS[style];
    const fullPrompt = `${userPrompt}\n\nStyle: ${styleHint}`;

    const parts: object[] = [{ text: fullPrompt }];
    for (const img of imageParts.slice(0, 3)) {
      parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
    }

    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      config: { systemInstruction: THUMBNAIL_SYSTEM_PROMPT },
      contents: [{ role: "user", parts }],
    });
    return response.text?.trim() ?? userPrompt;
  } catch (err) {
    console.warn("[enhance-prompt] Gemini unavailable, using raw prompt:", err);
    return userPrompt;
  }
}

export async function POST(request: Request) {
  // ── Auth & credit check (blocking) ──────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: userRow, error: userFetchError } = await supabase
    .from("users")
    .select("credits")
    .eq("id", user.id)
    .single();

  if (userFetchError || !userRow) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if ((userRow.credits ?? 0) <= 0) {
    return NextResponse.json(
      { error: "Not enough credits. Upgrade your plan to get more credits." },
      { status: 402 }
    );
  }

  // ── Deduct 1 credit immediately ──────────────────────────────────────────
  const { error: deductError } = await supabase
    .from("users")
    .update({ credits: userRow.credits - 1 })
    .eq("id", user.id);

  if (deductError) {
    return NextResponse.json({ error: "Failed to deduct credit." }, { status: 500 });
  }

  try {
    const {
      prompt,
      attachments = [],
      ratio = "16:9",
      style = "Realistic",
    } = await request.json();

    if (!prompt?.trim()) {
      // Restore credit on bad request
      await supabase.from("users").update({ credits: userRow.credits }).eq("id", user.id);
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Stage 1 — Gemini enhances the raw description (+ style hint) into a rich image prompt
    const enhancedPrompt = await enhancePrompt(prompt, attachments, style as ImageStyle);

    // Stage 2 — Pollinations.ai (Flux) renders the image at the requested dimensions
    const { width, height } = RATIO_DIMS[ratio as AspectRatio] ?? RATIO_DIMS["16:9"];
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&model=flux&seed=${Date.now()}`;

    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      throw new Error(`Pollinations returned ${imageRes.status}`);
    }

    const arrayBuffer = await imageRes.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // Save to Supabase (best-effort — never blocks the response)
    try {
      const filename = `${user.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("keep_img")
        .upload(filename, Buffer.from(arrayBuffer), {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (!uploadError) {
        await supabase.from("thumbnail").insert({
          user_id: user.id,
          prompt,
          image_path: filename,
          title: prompt.slice(0, 100),
        });
      }
    } catch (saveError) {
      console.warn("[generate-image] Failed to save thumbnail:", saveError);
    }

    return NextResponse.json({
      imageData: base64,
      mimeType: "image/jpeg",
      enhancedPrompt, // visible in DevTools Network tab for verification
    });
  } catch (error) {
    // ── Restore credit on generation failure ──────────────────────────────
    console.error("[generate-image]", error);
    await supabase.from("users").update({ credits: userRow.credits }).eq("id", user.id);
    return NextResponse.json({ error: "Image generation failed" }, { status: 500 });
  }
}
