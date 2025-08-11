import OpenAI from "openai";

const openAiApiKey = process.env.OPENAI_API_KEY || "";
let openaiClient = null;
if (openAiApiKey) {
  openaiClient = new OpenAI({ apiKey: openAiApiKey });
}

const SYSTEM_PROMPT = `Ты — вежливый русскоязычный SDR-агент по холодным звонкам.
Твоя цель — за 2-4 реплики выяснить потребности и предложить короткий созвон с менеджером.
Говори короткими фразами (1-2 предложения), без жаргона. Если клиент явно не заинтересован — поблагодари и вежливо завершай разговор.`;

function buildMessagesFromHistory(history) {
  const messages = [{ role: "system", content: SYSTEM_PROMPT }];
  for (const turn of history) {
    messages.push({ role: turn.role, content: turn.content });
  }
  return messages;
}

function ruleBasedFallback(userText) {
  const text = (userText || "").toLowerCase();
  if (text.includes("не интересно") || text.includes("неинтересно") || text.includes("не надо")) {
    return { text: "Понимаю, спасибо за время. Хорошего дня!", shouldHangup: true };
  }
  if (text.includes("почта") || text.includes("email") || text.includes("письмо")) {
    return { text: "Отправлю краткое письмо с описанием. Подскажите, пожалуйста, удобный e-mail?", shouldHangup: false };
  }
  return { text: "Скажите, пожалуйста, актуальна ли для вас оптимизация расходов и автоматизация в ближайший месяц?", shouldHangup: false };
}

export async function getAgentReply(callHistory, latestUserText) {
  if (!openaiClient) {
    return ruleBasedFallback(latestUserText);
  }

  const messages = buildMessagesFromHistory(callHistory);
  messages.push({ role: "user", content: latestUserText || "" });

  try {
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 120,
      messages,
    });
    const aiText = completion.choices?.[0]?.message?.content?.trim() || "";

    const lc = aiText.toLowerCase();
    const shouldHangup = lc.includes("хорошего дня") || lc.includes("до свидания") || lc.includes("до встречи") || lc.includes("завершаю");

    return { text: aiText || "Спасибо! Подскажите, пожалуйста, удобно ли будет на короткий звонок завтра?", shouldHangup };
  } catch (err) {
    console.error("OpenAI error", err?.message || err);
    return ruleBasedFallback(latestUserText);
  }
}