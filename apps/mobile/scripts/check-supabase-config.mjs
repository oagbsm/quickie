import fs from "node:fs";
import path from "node:path";

const rootEnv = path.resolve(process.cwd(), "../../.env.local");
const source = fs.readFileSync(rootEnv, "utf8");
const read = (name) => source.split(/\r?\n/).find((line) => line.trim().startsWith(`${name}=`))?.slice(name.length + 1).trim().replace(/^(['"])(.*)\1$/, "$2") || "";
const url = read("NEXT_PUBLIC_SUPABASE_URL");
const anonKey = read("NEXT_PUBLIC_SUPABASE_ANON_KEY");
console.log(JSON.stringify({ supabaseUrlConfigured: Boolean(url), supabaseHost: url ? new URL(url).host : "", anonKeyConfigured: Boolean(anonKey) }, null, 2));
