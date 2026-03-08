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

    const { electricity, gas, fuel, waste, water, industry } = await req.json();

    const systemPrompt = `You are an ESG benchmarking analyst. Given a company's energy consumption data, compare it against typical industry averages and provide a brief analysis.

Return your analysis using the benchmark_analysis tool. Be concise and actionable.

Industry averages (per year, medium-sized facility):
- Manufacturing: Electricity 500,000 kWh, Gas 50,000 m³, Fuel 10,000 L, Waste 5,000 kg, Water 20,000 m³
- Office/Services: Electricity 150,000 kWh, Gas 15,000 m³, Fuel 2,000 L, Waste 1,000 kg, Water 5,000 m³
- Retail: Electricity 250,000 kWh, Gas 20,000 m³, Fuel 5,000 L, Waste 3,000 kg, Water 10,000 m³
- Logistics: Electricity 200,000 kWh, Gas 10,000 m³, Fuel 30,000 L, Waste 2,000 kg, Water 8,000 m³`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Analyze this company's energy data against ${industry || 'Manufacturing'} industry averages:
- Electricity: ${electricity} kWh
- Gas: ${gas} m³
- Fuel: ${fuel} L
- Waste: ${waste} kg
- Water: ${water} m³

Provide percentile ranking, key observations, and recommendations.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "benchmark_analysis",
              description: "Return structured benchmarking analysis",
              parameters: {
                type: "object",
                properties: {
                  overall_rating: {
                    type: "string",
                    enum: ["excellent", "good", "average", "below_average", "poor"],
                    description: "Overall performance rating compared to industry",
                  },
                  percentile: {
                    type: "number",
                    description: "Estimated percentile ranking (0-100, higher is better/greener)",
                  },
                  summary: {
                    type: "string",
                    description: "2-3 sentence summary of performance",
                  },
                  recommendations: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 specific actionable recommendations",
                  },
                  metrics: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        status: { type: "string", enum: ["above_average", "average", "below_average"] },
                        note: { type: "string" },
                      },
                      required: ["name", "status", "note"],
                    },
                    description: "Per-metric comparison",
                  },
                },
                required: ["overall_rating", "percentile", "summary", "recommendations", "metrics"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "benchmark_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
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
      return new Response(JSON.stringify({ error: "AI benchmarking failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI could not generate benchmark" }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, ...analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("benchmark error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
