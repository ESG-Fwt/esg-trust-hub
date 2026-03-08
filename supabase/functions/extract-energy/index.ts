import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_FILE_SIZE = 4 * 1024 * 1024;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (file.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: "File too large. Maximum 4MB for AI extraction." }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = base64Encode(new Uint8Array(arrayBuffer));
    const mimeType = file.type || "image/png";

    const systemPrompt = `You are a strict, highly accurate data extraction auditor for an ESG compliance platform. You are provided with an image or document uploaded by an Italian SME.

Your Task: Extract energy consumption data for the billing period shown.

Strict Rules & Edge Cases:

1. WRONG DOCUMENT: If this document is clearly NOT a utility bill or energy invoice (e.g., it is a restaurant receipt, a selfie, a random letter, a non-energy document), do not guess. You MUST use the error_code "ERROR_INVALID_DOC".

2. UNREADABLE / BLURRY: If the document IS a utility bill or energy invoice, but the text is too blurry, cropped, obscured, or low-resolution to read the consumption numbers with high confidence, you MUST use the error_code "ERROR_UNREADABLE".

3. SUCCESS: If you can clearly read the energy consumption data, extract ALL available metrics:
   - electricity: in kWh (kilowatt-hours). Convert MWh to kWh (×1000).
   - gas: in m³ (cubic meters of natural gas). See ITALIAN GAS BILL RULES below.
   - fuel: in L (liters of fuel/diesel/petrol)
   - waste: in kg (kilograms of waste)
   - water: in m³ (cubic meters of water consumed)
   Set any field to 0 if it is not present in the document.

ITALIAN GAS BILL RULES (CRITICAL — follow these exactly for gas/natural gas bills):
- The ONLY value you must extract for gas is the billed gas VOLUME for the specific billing period.
- Look for labels such as: "Consumo Fatturato (Smc)", "Totale Smc", "Smc fatturati", "Metri cubi", "Consumo del periodo", "Consumo rilevato".
- NEVER add Euro (€) monetary amounts, taxes, quotas, or cost line items together. Money is NOT consumption.
- NEVER extract "Consumo Annuo", "Consumo Storico", or any annual/historical average. Only the consumption for the specific billing period shown on the invoice.
- The volume is typically in Smc (Standard cubic meters). 1 Smc = 1 m³. Return the value as m³.
- If the volume has decimals (e.g., "37,081125 Smc"), round DOWN to the nearest whole number (e.g., return 37).
- If multiple volume figures appear, choose the one labeled as the billed/invoiced consumption for the period, NOT estimates or annual projections.

Always use the extract_energy_data tool to return your result.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
              {
                type: "text",
                text: "Analyze this document. If it is NOT a utility bill or energy invoice, return error_code ERROR_INVALID_DOC. If it IS a bill but unreadable, return error_code ERROR_UNREADABLE. Otherwise extract energy data including water consumption. Use the extract_energy_data tool.",
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_energy_data",
              description: "Return structured energy consumption data or an error code if the document is invalid or unreadable",
              parameters: {
                type: "object",
                properties: {
                  status: {
                    type: "string",
                    enum: ["success", "error"],
                    description: "Whether extraction succeeded or failed",
                  },
                  error_code: {
                    type: "string",
                    enum: ["ERROR_INVALID_DOC", "ERROR_UNREADABLE"],
                    description: "Error code if status is error. null if success.",
                  },
                  electricity: { type: "number", description: "Electricity consumption in kWh. 0 if not found or if error." },
                  gas: { type: "number", description: "Natural gas consumption in m³. 0 if not found or if error." },
                  fuel: { type: "number", description: "Fuel consumption in liters. 0 if not found or if error." },
                   waste: { type: "number", description: "Waste in kg. 0 if not found or if error." },
                  water: { type: "number", description: "Water in m³. 0 if not found or if error." },
                  confidence: { type: "number", description: "Confidence score 0-1. 0 if error." },
                  notes: { type: "string", description: "Brief extraction notes or reason for error" },
                },
                required: ["status", "electricity", "gas", "fuel", "waste", "water", "confidence"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_energy_data" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI extraction failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI could not extract data from this document", error_code: "ERROR_UNREADABLE" }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    // Handle error statuses from the AI
    if (extracted.status === "error") {
      const errorCode = extracted.error_code || "ERROR_UNREADABLE";
      return new Response(JSON.stringify({
        success: false,
        error_code: errorCode,
        notes: extracted.notes || "",
      }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        electricity: Math.max(0, Math.round(extracted.electricity * 100) / 100),
        gas: Math.max(0, Math.round(extracted.gas * 100) / 100),
        fuel: Math.max(0, Math.round(extracted.fuel * 100) / 100),
        waste: Math.max(0, Math.round(extracted.waste * 100) / 100),
        water: Math.max(0, Math.round((extracted.water || 0) * 100) / 100),
      },
      confidence: extracted.confidence,
      notes: extracted.notes || "",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-energy error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
