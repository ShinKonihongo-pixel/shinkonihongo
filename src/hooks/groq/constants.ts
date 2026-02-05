// API and configuration constants for Groq integration

export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const MODEL = 'llama-3.3-70b-versatile';

// Topic descriptions for system prompt
export const TOPIC_PROMPTS: Record<string, string> = {
  free: 'Start with a simple greeting and ask what the user wants to talk about.',
  greetings: 'Practice greetings (挨拶). Start by greeting the user and practice various greeting expressions for different times of day and situations.',
  self_intro: 'Practice self-introduction (自己紹介). Ask about the user\'s name, job, hobbies, and where they live.',
  shopping: 'Practice shopping conversation (買い物). Role-play as a shop staff. Ask what they are looking for, discuss sizes, colors, and prices.',
  restaurant: 'Practice restaurant conversation (レストラン). Role-play as a waiter/waitress. Take orders, recommend dishes, and handle payment.',
  travel: 'Practice travel conversation (旅行). Discuss travel plans, ask about destinations, transportation, and sightseeing.',
  work: 'Practice work/business conversation (仕事). Discuss jobs, workplace situations, meetings, and professional topics.',
  hobbies: 'Practice talking about hobbies (趣味). Ask about interests, sports, music, movies, and free time activities.',
  weather: 'Practice weather conversation (天気). Discuss today\'s weather, seasons, and weather-related small talk.',
  directions: 'Practice asking/giving directions (道案内). Role-play asking for directions to stations, shops, or landmarks.',
};

// Level-specific configuration for response length and complexity
export const LEVEL_CONFIG: Record<string, { maxSentences: number; responseGuidance: string; vocabGuidance: string }> = {
  N5: {
    maxSentences: 2,
    responseGuidance: `【N5 BEGINNER RULES - CRITICAL】
- RESPONSE: Maximum 1-2 short sentences only!
- Use ONLY N5 vocabulary: です、ます、basic verbs (食べる、飲む、行く、見る、する)
- Grammar: です/ます form ONLY, simple て form, basic particles (は、が、を、に、で、へ)
- NO complex grammar: NO ～たり、NO ～ながら、NO conditionals、NO passive
- Keep it SIMPLE: Subject + Object + Verb structure
- Example good: [私|わたし]は[映画|えいが]が[好|す]きです。
- Example bad (too complex): [映画|えいが]を[見|み]ながら、ポップコーンを[食|た]べるのが[好|す]きです。`,
    vocabGuidance: 'Use ONLY basic N5 words: numbers, colors, family, time, basic actions, simple adjectives'
  },
  N4: {
    maxSentences: 3,
    responseGuidance: `【N4 ELEMENTARY RULES - CRITICAL】
- RESPONSE: Maximum 2-3 short sentences only!
- Use N4/N5 vocabulary only: daily life words, basic adjectives, common verbs
- Grammar: て form, た form, ～たい, ～ている, simple ～から (reason)
- NO complex grammar: NO ～ようにする、NO ～ことにする、NO ～かもしれない
- Keep sentences short and clear
- Example good: [昨日|きのう][映画|えいが]を[見|み]ました。とても[面白|おもしろ]かったです。
- Example bad (too long): [昨日|きのう][友達|ともだち]と[一緒|いっしょ]に[新|あたら]しいカフェに[行|い]って、[美味|おい]しいケーキを[食|た]べてから、[映画|えいが]を[見|み]ました。`,
    vocabGuidance: 'Use N4/N5 words: daily routines, shopping, weather, directions, basic emotions'
  },
  N3: {
    maxSentences: 4,
    responseGuidance: `【N3 INTERMEDIATE RULES】
- RESPONSE: 2-4 sentences, moderate complexity
- Use N3 vocabulary: opinions, comparisons, common expressions
- Grammar: ～ようにする、～ことにする、～たら、～ば、casual forms
- Can use some compound sentences`,
    vocabGuidance: 'Use everyday vocabulary appropriate for intermediate learners'
  },
  N2: {
    maxSentences: 5,
    responseGuidance: `【N2 UPPER-INTERMEDIATE RULES】
- RESPONSE: 3-5 sentences with natural flow
- Use varied vocabulary including idiomatic expressions
- Grammar: formal patterns, ～ものの、～にもかかわらず, etc.
- Natural conversation with explanations and opinions`,
    vocabGuidance: 'Use sophisticated vocabulary with nuance'
  },
  N1: {
    maxSentences: 6,
    responseGuidance: `【N1 ADVANCED RULES】
- RESPONSE: Natural length, sophisticated expression
- Use advanced vocabulary, idioms, and cultural references
- Grammar: all patterns including literary and formal styles
- Demonstrate native-like fluency`,
    vocabGuidance: 'Use full range of Japanese including literary and specialized terms'
  }
};
