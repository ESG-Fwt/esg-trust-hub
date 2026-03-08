import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Convert file to base64 for vision model
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = file.type || "application/pdf";

    const systemPrompt = `You are an ESG energy data extraction specialist. Extract energy consumption data from the uploaded document (invoice, utility bill, report, etc.).

Return ONLY the structured data using the provided tool. Extract these fields:
- electricity: in kWh (kilowatt-hours)
- gas: in m³ (cubic meters of natural gas)
- fuel: in L (liters of fuel/diesel/petrol)
- waste: in kg (kilograms of waste)

If a field is not found in the document, set it to 0. Look for totals, consumption figures, usage amounts. Convert units if needed (e.g., MWh to kWh = multiply by 1000).`;

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
                text: "Extract all energy consumption data from this document. Use the extract_energy_data tool to return structured results.",
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_energy_data",
              description: "Return structured energy consumption data extracted from the document",
              parameters: {
                type: "object",
                properties: {
                  electricity: { type: "number", description: "Electricity consumption in kWh" },
                  gas: { type: "number", description: "Natural gas consumption in m³" },
                  fuel: { type: "number", description: "Fuel consumption in liters" },
                  waste: { type: "number", description: "Waste in kg" },
                  confidence: { type: "number", description: "Confidence score 0-1" },
                  notes: { type: "string", description: "Brief extraction notes" },
                },
                required: ["electricity", "gas", "fuel", "waste", "confidence"],
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
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI extraction failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI could not extract data from this document" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({
      success: true,
      data: {
        electricity: Math.max(0, Math.round(extracted.electricity * 100) / 100),
        gas: Math.max(0, Math.round(extracted.gas * 100) / 100),
        fuel: Math.max(0, Math.round(extracted.fuel * 100) / 100),
        waste: Math.max(0, Math.round(extracted.waste * 100) / 100),
      },
      confidence: extracted.confidence,
      notes: extracted.notes || "",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-energy error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
