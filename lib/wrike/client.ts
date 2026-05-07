/**
 * Wrike REST client — PRD §4.2.6.
 *
 * Hides the Wrike API behind an interface so the app can run with or without
 * a token. If WRIKE_TOKEN is unset (or set to "stub"), a deterministic stub
 * is returned that emits a couple of fake projects so the UI is exercisable
 * end-to-end.
 *
 * Wrike API ref: https://developers.wrike.com/api/v4/folders-projects
 */

export interface WrikeTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  ownerName: string | null;
  startedAt: string | null;
  url: string;
}

export interface IWrikeClient {
  /** Fetch the metadata of a single project/folder by Wrike ID. */
  getProject(id: string): Promise<WrikeTask | null>;
  /** List a folder's child tasks. Used by scheduled sync. */
  listFolder(folderId: string): Promise<WrikeTask[]>;
}

class StubWrikeClient implements IWrikeClient {
  async getProject(id: string): Promise<WrikeTask | null> {
    return {
      id,
      title: `Imported project ${id.slice(0, 6)}`,
      description:
        "Stub project imported from Wrike. Set WRIKE_TOKEN to enable real imports.",
      status: "Active",
      ownerName: "Wrike Import",
      startedAt: new Date().toISOString(),
      url: `https://www.wrike.com/open.htm?id=${id}`,
    };
  }
  async listFolder(folderId: string): Promise<WrikeTask[]> {
    return [
      {
        id: `${folderId}-1`,
        title: "Stub: Marketing collateral generator",
        description: "Auto-generates branded one-pagers from deal data.",
        status: "Active",
        ownerName: "J. Wells",
        startedAt: new Date().toISOString(),
        url: `https://www.wrike.com/folder/${folderId}-1`,
      },
      {
        id: `${folderId}-2`,
        title: "Stub: Underwriting comp aggregator",
        description: "Pulls comps across submarkets from Artemis read tables.",
        status: "In Progress",
        ownerName: "C. Tran",
        startedAt: new Date().toISOString(),
        url: `https://www.wrike.com/folder/${folderId}-2`,
      },
    ];
  }
}

class RealWrikeClient implements IWrikeClient {
  private base: string;
  private token: string;

  constructor(token: string, base: string) {
    this.token = token;
    this.base = base.replace(/\/$/, "");
  }

  private async fetch<T>(path: string): Promise<T> {
    const res = await fetch(`${this.base}${path}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Wrike ${res.status}: ${await res.text()}`);
    }
    return (await res.json()) as T;
  }

  async getProject(id: string): Promise<WrikeTask | null> {
    type Resp = {
      data: Array<{
        id: string;
        title: string;
        description?: string;
        status?: string;
        permalink?: string;
        createdDate?: string;
      }>;
    };
    const r = await this.fetch<Resp>(`/folders/${id}?fields=[description]`);
    const folder = r.data[0];
    if (!folder) return null;
    return {
      id: folder.id,
      title: folder.title,
      description: folder.description ?? null,
      status: folder.status ?? "Active",
      ownerName: null,
      startedAt: folder.createdDate ?? null,
      url:
        folder.permalink ??
        `https://www.wrike.com/open.htm?id=${folder.id}`,
    };
  }

  async listFolder(folderId: string): Promise<WrikeTask[]> {
    type Resp = {
      data: Array<{
        id: string;
        title: string;
        description?: string;
        status?: string;
        permalink?: string;
        createdDate?: string;
      }>;
    };
    const r = await this.fetch<Resp>(
      `/folders/${folderId}/tasks?fields=[description]`
    );
    return r.data.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description ?? null,
      status: t.status ?? "Active",
      ownerName: null,
      startedAt: t.createdDate ?? null,
      url: t.permalink ?? `https://www.wrike.com/open.htm?id=${t.id}`,
    }));
  }
}

let cached: IWrikeClient | null = null;

export function getWrikeClient(): IWrikeClient {
  if (cached) return cached;
  const token = process.env.WRIKE_TOKEN;
  const base = process.env.WRIKE_BASE_URL ?? "https://www.wrike.com/api/v4";
  cached = token && token !== "stub" ? new RealWrikeClient(token, base) : new StubWrikeClient();
  return cached;
}
