import { runV2Core } from "../src/v2/core/index.ts";

const asOfDate = new Date().toISOString().slice(0, 10);
const symbols = ["AAPL", "MSFT", "NVDA"];

const res = await runV2Core(symbols, asOfDate, { mode: "READONLY", requireConfirmFirstEnter: true });

console.log("\n--- CORE OUTPUTS ---");
console.log(res.outputs);

console.log("\n--- CORE SLOTS ---");
console.log(res.slots);

console.log("\n--- CORE DECISIONS ---");
console.log(res.decisions);

console.log("\n--- CORE BRIEF ---");
console.log(res.brief);
