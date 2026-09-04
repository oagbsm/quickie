import type { SandboxAdminClient } from "./sandbox-guard.ts";

export type ManifestEntry = { table: string; id: string };

/** Exact primary keys only. This manifest deliberately has no status/provider filters. */
export class ScenarioManifest {
  readonly scenarioRunId: string;
  private readonly entries: ManifestEntry[] = [];

  constructor(scenarioRunId = crypto.randomUUID()) {
    this.scenarioRunId = scenarioRunId;
  }

  add(table: string, id: string): void {
    if (!table || !id) throw new Error("[sandbox] manifest entries require an exact table and primary key");
    if (!this.entries.some((entry) => entry.table === table && entry.id === id)) this.entries.push({ table, id });
  }

  all(): ManifestEntry[] { return [...this.entries]; }

  async cleanup(admin: SandboxAdminClient): Promise<{ deleted: ManifestEntry[]; retained: ManifestEntry[] }> {
    const deleted: ManifestEntry[] = [];
    const retained: ManifestEntry[] = [];
    const byTable = new Map<string, string[]>();
    for (const entry of this.entries) byTable.set(entry.table, [...(byTable.get(entry.table) || []), entry.id]);
    const order = [...byTable.keys()].reverse();
    for (const table of order) {
      const ids = byTable.get(table) || [];
      if (!ids.length) continue;
      const result = await admin.from(table).delete().in("id", ids).select("id");
      if (result.error) {
        retained.push(...ids.map((id) => ({ table, id })));
        console.warn(`[sandbox] retained ${table} manifest rows after cleanup failure: ${result.error.message}`);
        continue;
      }
      deleted.push(...ids.map((id) => ({ table, id })));
    }
    return { deleted, retained };
  }
}
