import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { corsHeaders } from "../_shared/cors.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-QUESTS] ${step}${detailsStr}`);
};

const PLAYER_CLASSES: Record<string, { name: string; description: string; questPreference: string }> = {
  Wanderer: {
    name: "Wanderer",
    description: "Jack of all trades",
    questPreference: "Balanced mix of all quest types",
  },
  Bard: {
    name: "Bard",
    description: "Social butterfly",
    questPreference: "Social interactions and creative expressions",
  },
  Ranger: {
    name: "Ranger",
    description: "Nature explorer",
    questPreference: "Outdoor exploration and nature-based tasks",
  },
  Rogue: {
    name: "Rogue",
    description: "Chaos agent",
    questPreference: "Unconventional and spontaneous challenges",
  },
  Scholar: {
    name: "Scholar",
    description: "Knowledge seeker",
    questPreference: "Learning and discovery quests",
  },
};

const QUEST_CONFIG = {
  difficulties: {
    easy: { xpBase: 50 },
    medium: { xpBase: 100 },
    hard: { xpBase: 200 },
  },
  dailyQuestCount: 3,
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

    const { playerClass, count } = await req.json();
    logStep("Request parsed", { playerClass, count });

    const classInfo = PLAYER_CLASSES[playerClass] || PLAYER_CLASSES.Wanderer;
    
    const systemPrompt = `You are a creative Dungeon Master for a real-life RPG app called Sidequest. Generate fun, safe, and achievable real-world quests.

Player Class: ${classInfo.name} (${classInfo.description})
Quest Preference: ${classInfo.questPreference}

IMPORTANT RULES:
- All quests must be completable in 15 minutes or less
- Quests must be safe and legal
- Quests should encourage real-world interaction, creativity, or exploration
- Match the player's class preference when possible
- Be creative and fun!

Generate ${count} quests with varying difficulties:
- Easy: Simple solo tasks (find something, take a photo, small action)
- Medium: Creative or slightly challenging tasks
- Hard: Social interactions or adventurous tasks

Return ONLY a JSON array with this exact structure:
[
  {
    "title": "Quest title (max 50 chars)",
    "description": "Clear instructions on what to do",
    "difficulty": "easy" | "medium" | "hard"
  }
]`;

    logStep("Calling OnSpace AI for quest generation");

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
            content: `Generate ${count} unique quests for today.`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      logStep("OnSpace AI error", { status: aiResponse.status, error: errorText });
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    logStep("AI response received", { contentLength: content.length });

    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      logStep("Invalid JSON in AI response", { content });
      throw new Error('Invalid JSON in AI response');
    }

    const quests = JSON.parse(jsonMatch[0]);
    
    // Add XP rewards based on difficulty
    const questsWithXP = quests.map((quest: any) => ({
      title: quest.title,
      description: quest.description,
      difficulty: quest.difficulty,
      xp_reward: QUEST_CONFIG.difficulties[quest.difficulty as keyof typeof QUEST_CONFIG.difficulties].xpBase,
    }));

    logStep("Quests generated successfully", { count: questsWithXP.length });
    
    return new Response(JSON.stringify(questsWithXP), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Error in generate-quests", { message: errorMessage });
    
    // Fallback quests if AI fails
    const fallbackQuests = [
      {
        title: 'Yellow Discovery',
        description: 'Find something yellow and take a photo of it',
        difficulty: 'easy',
        xp_reward: 50,
      },
      {
        title: 'Cloud Gazer',
        description: 'Take a photo of an interesting cloud formation',
        difficulty: 'easy',
        xp_reward: 50,
      },
      {
        title: 'Random Act of Kindness',
        description: 'Compliment a stranger and document it',
        difficulty: 'hard',
        xp_reward: 200,
      },
    ];

    return new Response(JSON.stringify(fallbackQuests.slice(0, 3)), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
