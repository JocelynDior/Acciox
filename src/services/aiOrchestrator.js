const PROXY_URL = 'https://accioxserver.onrender.com/chat';
const MODEL = 'llama-3.3-70b-versatile';
const SYSTEM_PROMPT =
  "Acciox AI, an expert accountant and financial analyst. Always respond in structured JSON format.";

/**
 * Calls Groq via the proxy server.
 * @param {Array} messages - Array of { role, content } objects.
 * @returns {Promise<Object>} Parsed JSON result.
 */
async function callGroq(messages) {
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages }),
  });

  if (!response.ok) throw new Error('Groq proxy error: ' + response.status);
  const data = await response.json();

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Invalid response from Groq proxy');

  try {
    return JSON.parse(content);
  } catch {
    return content;
  }
}

async function callGemini() {
  return null;
}

function compareResults(groqResult, geminiResult) {
  if (geminiResult === null || geminiResult === undefined) {
    return { ...groqResult, confidence: 'single-model', needsReview: false };
  }

  const match = JSON.stringify(groqResult) === JSON.stringify(geminiResult);
  if (match) {
    return { ...groqResult, confidence: 'high', needsReview: false };
  }

  return {
    groq: groqResult,
    gemini: geminiResult,
    confidence: 'low',
    needsReview: true,
  };
}

async function categorizeTransaction(transaction) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: "Categorize this transaction into a category like 'Office Supplies', 'Travel', 'Meals', 'Software', etc. Return JSON with fields 'category' and 'confidence' (a number 0-1). Transaction: " + JSON.stringify(transaction),
    },
  ];

  const groqResult = await callGroq(messages);
  const geminiResult = await callGemini(messages);
  const final = compareResults(groqResult, geminiResult);

  if (final.needsReview) {
    return {
      category: final.groq?.category || 'Uncategorized',
      confidence: 'low',
      needsReview: true,
    };
  }

  return {
    category: final.category || 'Uncategorized',
    confidence: final.confidence || 'single-model',
    needsReview: false,
  };
}

async function analyzeExpense(expense) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: "Analyze this staff expense claim for legitimacy. Return JSON with fields 'isLegitimate' (boolean) and 'reason' (string). Expense: " + JSON.stringify(expense),
    },
  ];

  const groqResult = await callGroq(messages);
  const geminiResult = await callGemini(messages);
  const final = compareResults(groqResult, geminiResult);

  if (final.needsReview) {
    return {
      isLegitimate: final.groq?.isLegitimate ?? false,
      reason: final.groq?.reason || 'Conflict between AI models',
      confidence: 'low',
      needsReview: true,
    };
  }

  return {
    isLegitimate: final.isLegitimate ?? false,
    reason: final.reason || '',
    confidence: final.confidence || 'single-model',
    needsReview: false,
  };
}

async function generateInsight(companyData) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: "Generate a concise financial insight summary based on this company data. Return JSON with field 'insightSummary' (string). Company data: " + JSON.stringify(companyData),
    },
  ];

  const groqResult = await callGroq(messages);
  const geminiResult = await callGemini(messages);
  const final = compareResults(groqResult, geminiResult);

  if (final.needsReview) {
    return {
      insightSummary: final.groq?.insightSummary || 'Insight unavailable',
      confidence: 'low',
      needsReview: true,
    };
  }

  return {
    insightSummary: final.insightSummary || 'No insight available',
    confidence: final.confidence || 'single-model',
    needsReview: false,
  };
}

async function answerQuery(question, companyContext) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: "Answer the following question about company finances using the provided context. Context: " + JSON.stringify(companyContext) + "\nQuestion: " + question + "\nReturn JSON with field 'answer' (string).",
    },
  ];

  const groqResult = await callGroq(messages);
  const geminiResult = await callGemini(messages);
  const final = compareResults(groqResult, geminiResult);

  if (final.needsReview) {
    return {
      answer: final.groq?.answer || 'Unable to answer',
      confidence: 'low',
      needsReview: true,
    };
  }

  return {
    answer: final.answer || 'No answer available',
    confidence: final.confidence || 'single-model',
    needsReview: false,
  };
}

export {
  callGroq,
  callGemini,
  compareResults,
  categorizeTransaction,
  analyzeExpense,
  generateInsight,
  answerQuery,
};
