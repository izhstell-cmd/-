import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { parse } from "csv-parse";
import yargs from "yargs";
import twilio from "twilio";

dotenv.config();

const argv = yargs(process.argv.slice(2))
  .usage("$0 --from +10000000000 --csv contacts.csv --url https://<public>/voice [--rate 10]")
  .option("from", { type: "string", demandOption: true, describe: "Номер Twilio (E.164)" })
  .option("csv", { type: "string", demandOption: true, describe: "Путь к CSV с телефонами" })
  .option("url", { type: "string", demandOption: true, describe: "Публичный URL вебхука /voice" })
  .option("rate", { type: "number", default: 12, describe: "Звонков в минуту (по умолчанию ~12 = 1 каждые 5 сек)" })
  .option("status", { type: "string", default: "", describe: "URL для statusCallback (опционально)" })
  .help()
  .argv;

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
if (!accountSid || !authToken) {
  console.error("Требуются TWILIO_ACCOUNT_SID и TWILIO_AUTH_TOKEN в .env");
  process.exit(1);
}

const client = twilio(accountSid, authToken);

async function readContacts(csvPath) {
  return new Promise((resolve, reject) => {
    const records = [];
    fs.createReadStream(csvPath)
      .pipe(parse({ columns: true, trim: true }))
      .on("data", (row) => {
        if (row.phone) {
          records.push(row);
        }
      })
      .on("end", () => resolve(records))
      .on("error", reject);
  });
}

async function dialAll(contacts) {
  const intervalMs = Math.max(5000, Math.floor(60000 / Math.max(1, argv.rate)));
  let index = 0;
  for (const contact of contacts) {
    index += 1;
    const to = contact.phone.trim();
    const params = {
      to,
      from: argv.from,
      url: argv.url,
      machineDetection: "Enable",
    };
    if (argv.status) {
      params.statusCallback = argv.status;
      params.statusCallbackEvent = ["initiated", "ringing", "answered", "completed"];
      params.statusCallbackMethod = "POST";
    }

    try {
      const call = await client.calls.create(params);
      console.log(`#${index} -> ${to}: created CallSid=${call.sid}`);
    } catch (err) {
      console.error(`#${index} -> ${to}: error`, err?.message || err);
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

async function main() {
  const contacts = await readContacts(argv.csv);
  if (!contacts.length) {
    console.error("В CSV нет записей с полем 'phone'");
    process.exit(1);
  }
  console.log(`Найдено контактов: ${contacts.length}. Запускаю обзвон...`);
  await dialAll(contacts);
  console.log("Готово");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});