// Daily metrics snapshot for the Hookr dashboard.
// Run by .github/workflows/snapshot.yml — appends one entry per day to data/history.json.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

const CONFIG = {
  BLOCKSCOUT: "https://robinhoodchain.blockscout.com",
  LAUNCHPAD:  "0xa043caBE645636899dDe91Cce4693C00a015e660",
  HOOKR:      "0x18E674231A58c239Dc7DaeDcffE15Ec3A24cff5c",
  DEAD:       "0x000000000000000000000000000000000000dEaD",
  ZERO:       "0x0000000000000000000000000000000000000000",
  DECIMALS:   18,
  COINGECKO_ID: "hookr-fun",
  OUT: "data/history.json",
};

const bs = p => CONFIG.BLOCKSCOUT + p;
async function j(url) {
  const r = await fetch(url, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}
const num = v => (v == null || isNaN(Number(v)) ? null : Number(v));

async function main() {
  const entry = { date: new Date().toISOString().slice(0, 10) };

  const tasks = {
    holders: async () => {
      const t = await j(bs(`/api/v2/tokens/${CONFIG.HOOKR}`));
      entry.holders = num(t.holders ?? t.holders_count);
    },
    counters: async () => {
      const c = await j(bs(`/api/v2/addresses/${CONFIG.LAUNCHPAD}/counters`));
      entry.txs = num(c.transactions_count);
      entry.transfers = num(c.token_transfers_count);
    },
    burned: async () => {
      const bal = a => j(bs(`/api?module=account&action=tokenbalance&contractaddress=${CONFIG.HOOKR}&address=${a}`));
      const parts = await Promise.allSettled([bal(CONFIG.DEAD), bal(CONFIG.ZERO)]);
      let total = 0n, got = false;
      for (const p of parts)
        if (p.status === "fulfilled" && p.value?.result != null) { total += BigInt(p.value.result); got = true; }
      if (!got) throw new Error("no burn balances");
      entry.burned = Number(total / 10n ** BigInt(CONFIG.DECIMALS - 2)) / 100;
    },
    ethBal: async () => {
      const a = await j(bs(`/api/v2/addresses/${CONFIG.LAUNCHPAD}`));
      entry.eth = a.coin_balance != null
        ? Number(BigInt(a.coin_balance) / 10n ** 12n) / 1e6 : null;
    },
    market: async () => {
      const d = await j(`https://api.coingecko.com/api/v3/simple/price?ids=${CONFIG.COINGECKO_ID}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true`);
      const m = d[CONFIG.COINGECKO_ID] || {};
      entry.price = num(m.usd);
      entry.mcap = num(m.usd_market_cap);
      entry.vol = num(m.usd_24h_vol);
    },
  };

  const results = await Promise.allSettled(Object.values(tasks).map(f => f()));
  const failures = results.filter(r => r.status === "rejected");
  failures.forEach(f => console.error("Snapshot source failed:", f.reason?.message ?? f.reason));
  if (failures.length === results.length) {
    console.error("Every source failed — keeping history unchanged.");
    process.exit(1);
  }

  mkdirSync("data", { recursive: true });
  let history = [];
  if (existsSync(CONFIG.OUT)) {
    try { history = JSON.parse(readFileSync(CONFIG.OUT, "utf8")); } catch { history = []; }
  }
  // Idempotent per day: re-running replaces today's entry.
  history = history.filter(e => e.date !== entry.date);
  history.push(entry);
  history.sort((a, b) => a.date.localeCompare(b.date));
  writeFileSync(CONFIG.OUT, JSON.stringify(history, null, 1) + "\n");
  console.log(`Wrote ${entry.date}:`, entry, `(${history.length} snapshots total)`);
}

main().catch(e => { console.error(e); process.exit(1); });
