import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { corsHeaders } from "../_shared/cors.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-QUEST] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const apiKey = Deno.env.get('ONSPACE_AI_API_KEY');
    const baseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');
    
    if (!apiKey || !baseUrl) {
      throw new Error("OnSpace AI credentials not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authorization header not provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email unavailable");
    logStep("User authenticated", { userId: user.id });

    const { questDescription, imageBase64 } = await req.json();
    logStep("Request parsed", { questDescLength: questDescription?.length, hasImage: !!imageBase64 });

    if (!questDescription || !imageBase64) {
      throw new Error("Missing questDescription or imageBase64");
    }

    const systemPrompt = `You are an AI judge for Sidequest, a real-life RPG app. 

Your job: Analyze the provided image and determine if it shows the user completed the quest.

Quest to verify: "${questDescription}"

Evaluation criteria:
- Does the image show genuine attempt at completing the quest?
- Is it creative or well-executed?
- Score 1-100 based on effort and creativity (be generous - 70+ for any real effort)

Return ONLY this JSON structure:
{
  "success": true/false,
  "score": 1-100,
  "comment": "A witty, encouraging comment (max 100 chars)"
}

Be lenient and encouraging. The goal is to reward genuine effort. If the image shows ANY reasonable attempt, mark success as true with a score of at least 70.`;

    logStep("Calling OnSpace AI for image verification");

    const aiResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Does this image show quest completion? Respond ONLY with the JSON format specified.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      logStep("OnSpace AI error", { status: aiResponse.status, error: errorText });
      throw new Error(`AI verification failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    logStep("AI response received", { contentLength: content.length });

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logStep("Invalid JSON in AI response", { content });
      throw new Error('Invalid JSON in AI response');
    }

    const result = JSON.parse(jsonMatch[0]);
    logStep("Verification result", result);
    
    return new Response(JSON.stringify({
      success: result.success,
      score: result.score,
      comment: result.comment,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Error in verify-quest", { message: errorMessage });
    return new Response(JSON.stringify({ 
      error: errorMessage,
      fallback: {
        success: true,
        score: 75,
        comment: 'AI verification unavailable. Quest completed on honor system! 🎯'
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
