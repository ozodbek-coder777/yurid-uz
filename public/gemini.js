// Predefined offline responses in Uzbek language for fallback
const offlineResponses = {
  "salom": "Assalomu alaykum! Qanday yordam bera olaman?",
  "avtohalokat": "Avtohalokat bo'yicha yordam kerakmi? Iltimos, politsiya kelganmi va hujjatlar bormi?",
  "ajrashish": "Ajrashish bo'yicha yordam kerakmi? Iltimos, bolalar va mulk masalalari bormi?",
  "default": "Kechirasiz, men hozircha bu savolga javob bera olmayman. Iltimos, advokat bilan bog'laning."
};

/**
 * Calls the Gemini API with the specified prompt.
 * Features 3 retries, a 30-second timeout, error logging, and offline Uzbek fallbacks.
 * @param {string} prompt The user's query
 * @returns {Promise<string>} The generated or fallback response text
 */
async function callGemini(prompt) {
  const normalizedPrompt = (prompt || "").toLowerCase().trim();
  const maxAttempts = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Gemini API ga ulanish urinishi ${attempt} (jami ${maxAttempts})...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn(`Urinish ${attempt} 30 soniyalik timeout sababli bekor qilindi.`);
      }, 30000); // 30 seconds timeout
      
      const apiKey = window.GEMINI_API_KEY || 'AIzaSyDICOB5U2BCMJlzpDzWnjXs0f5wg1-7iYY';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP status: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Gemini API muvaffaqiyatli javob qaytardi!");
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error("Gemini javob formati noto'g'ri.");
      }
    } catch (err) {
      console.error(`Urinish ${attempt} muvaffaqiyatsiz tugadi:`, err);
      lastError = err;
      if (attempt < maxAttempts) {
        console.log("1 soniyadan so'ng qayta urinib ko'riladi...");
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  // All API calls failed - fallback to offline predefined responses
  console.warn("Barcha tarmoq urinishlari muvaffaqiyatsiz bo'ldi. Offline rejim ishga tushmoqda.");
  
  if (normalizedPrompt.includes("salom")) {
    return offlineResponses["salom"];
  } else if (normalizedPrompt.includes("avtohalokat") || normalizedPrompt.includes("avari") || normalizedPrompt.includes("to'qnashuv") || normalizedPrompt.includes("paxsa") || normalizedPrompt.includes("mashina")) {
    return offlineResponses["avtohalokat"];
  } else if (normalizedPrompt.includes("ajrashish") || normalizedPrompt.includes("ajrim") || normalizedPrompt.includes("nikoh") || normalizedPrompt.includes("oila")) {
    return offlineResponses["ajrashish"];
  } else {
    return offlineResponses["default"];
  }
}

// Bind to window for global access
window.callGemini = callGemini;
