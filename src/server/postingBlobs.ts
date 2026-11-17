export type BlobsContext = {
  siteID: string;
  token: string;
  apiURL?: string;
  edgeURL?: string;
  uncachedEdgeURL?: string;
};

export const blobsContext = (): BlobsContext | null => {
  const raw = (globalThis as { netlifyBlobsContext?: unknown }).netlifyBlobsContext ?? process.env.NETLIFY_BLOBS_CONTEXT;
  if (!raw) return null;
  let context: Partial<BlobsContext>;
  if (typeof raw === "object") context = raw as Partial<BlobsContext>;
  else if (typeof raw !== "string") return null;
  else {
    try {
      context = JSON.parse(Buffer.from(raw, "base64").toString("utf8")) as Partial<BlobsContext>;
    } catch {
      return null;
    }
  }
  return context.siteID && context.token ? (context as BlobsContext) : null;
};

export const blobsRemote = () => blobsContext() !== null;

export const blobEndpoint = (context: BlobsContext, store: string, key: string) =>
  new URL(`/api/v1/blobs/${context.siteID}/${store}/${key}`, context.apiURL || "https://api.netlify.com");

/** Returns null when the blob is missing or Blobs is not configured; `failure` names the thrown error. */
export const signBlob = async (store: string, key: string, method: "GET" | "PUT", failure: string) => {
  const context = blobsContext();
  if (!context) return null;
  const response = await fetch(blobEndpoint(context, store, key), {
    method,
    headers: { authorization: `Bearer ${context.token}`, accept: "application/json;type=signed-url" },
    signal: AbortSignal.timeout(8000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(failure);
  const body = (await response.json()) as { url?: string };
  if (!body.url) throw new Error(failure);
  return body.url;
};

/** Netlify deletes a blob on the API itself. DELETE does not return a signed URL. */
export const deleteBlob = async (store: string, key: string, signal?: AbortSignal) => {
  const context = blobsContext();
  if (!context) return null;
  return fetch(blobEndpoint(context, store, key), {
    method: "DELETE",
    headers: { authorization: `Bearer ${context.token}` },
    signal,
  });
};
