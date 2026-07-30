const PROXY_URL = 'https://acciox.vercel.app/chat';
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

  // Extract the assistant's reply
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Invalid response from Groq proxy');

  // Attempt to parse the JSON response; fallback to raw string if parsing fails
  try {
    return JSON.parse(content);
  } catch {
    return content;
  }
}

/**
 * Placeholder for future Gemini integration.
 * @returns {Promise<null>}
 */
async function callGemini() {
  return null;
}

/**
 * Compares results from two AI models for validation.
 * @param {Object|null} groqResult - Result from Groq.
 * @param {Object|null} geminiResult - Result from Gemini.
 * @returns {Object} Final result with confidence and needsReview flag.
 */
function compareResults(groqResult, geminiResult) {
  // If Gemini is not yet active, rely solely on Groq
  if (geminiResult === null || geminiResult === undefined) {
    return { ...groqResult, confidence: 'single-model', needsReview: false };
  }

  // Compare serialized results for equality
  const match = JSON.stringify(groqResult) === JSON.stringify(geminiResult);
  if (match) {
    return { ...groqResult, confidence: 'high', needsReview: false };
  }

  // Disagreement – flag for human review
  return {
    groq: groqResult,
    gemini: geminiResult,
    confidence: 'low',
    needsReview: true,
  };
}

/**
 * Categorizes a financial transaction.
 * @param {Object} transaction - The transaction to categorize.
 * @returns {Promise<{category: string, confidence: string, needsReview: boolean}>}
 */
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

/**
 * Analyzes a staff expense claim for legitimacy.
 * @param {Object} expense - The expense claim.
 * @returns {Promise<{isLegitimate: boolean, reason: string, confidence: string, needsReview: boolean}>}
 */
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

/**
 * Generates a financial insight summary from company data.
 * @param {Object} companyData - Data about the company.
 * @returns {Promise<{insightSummary: string, confidence: string, needsReview: boolean}>}
 */
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

/**
 * Answers a user question about company finances using provided context.
 * @param {string} question - User's question.
 * @param {Object} companyContext - Financial data for context.
 * @returns {Promise<{answer: string, confidence: string, needsReview: boolean}>}
 */
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
