import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import dotenv from "dotenv";
import { getAgentReply } from "./aiAgent.js";

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// In-memory call state: { [callSid]: [{ role, content }] }
const callHistories = new Map();

function twimlResponse({ message, gatherNext = true, hangup = false }) {
  let xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
  xml += "<Response>";
  if (message) {
    xml += `<Say language=\"ru-RU\" voice=\"Polly-Tatyana\">${escapeXml(message)}</Say>`;
  }
  if (hangup) {
    xml += "<Hangup/>";
  } else if (gatherNext) {
    xml += `<Gather input=\"speech\" language=\"ru-RU\" speechTimeout=\"auto\" action=\"/gather\" method=\"POST\"></Gather>`;
  }
  xml += "</Response>";
  return xml;
}

function escapeXml(unsafe) {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

app.get("/healthz", (req, res) => {
  res.json({ ok: true });
});

app.post("/voice", async (req, res) => {
  const callSid = req.body.CallSid || `local-${Date.now()}`;
  callHistories.set(callSid, [
    { role: "system", content: "Начало звонка" },
  ]);

  const intro = "Здравствуйте! Меня зовут Анна, я звоню по поводу краткого улучшения ваших бизнес-процессов. Удобно ли поговорить минуту?";
  const xml = twimlResponse({ message: intro, gatherNext: true, hangup: false });

  res.set("Content-Type", "text/xml");
  res.send(xml);
});

app.post("/gather", async (req, res) => {
  const callSid = req.body.CallSid || `local-${Date.now()}`;
  const speech = req.body.SpeechResult || req.body.speechResult || "";

  const history = callHistories.get(callSid) || [];
  history.push({ role: "user", content: speech });

  const { text, shouldHangup } = await getAgentReply(history, speech);
  history.push({ role: "assistant", content: text });
  callHistories.set(callSid, history);

  const xml = twimlResponse({ message: text, gatherNext: !shouldHangup, hangup: shouldHangup });
  res.set("Content-Type", "text/xml");
  res.send(xml);
});

app.post("/status", (req, res) => {
  console.log("Status callback:", req.body.CallSid, req.body.CallStatus);
  res.sendStatus(204);
});

app.listen(port, () => {
  console.log(`Voice agent server listening on http://localhost:${port}`);
});