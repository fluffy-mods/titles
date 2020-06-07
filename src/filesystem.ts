import { fs } from "mz";
import express from "express";
import path from "path";
import ms from "ms";

export const CACHE_PREVIEWS = "/tmp/cache/previews/";
export const CACHE_TITLES = "/tmp/cache/titles/";
export const CACHE_PREVIEWS_MAXAGE = ms("5 minutes");
export const CACHE_TITLES_MAXAGE = ms("1 day");
// ensure these paths exist
export async function createCache(): Promise<void> {
  await ensureFolderExists(CACHE_PREVIEWS, true);
  await ensureFolderExists(CACHE_TITLES, true);
}

export async function ensureFolderExists(
  filePath: string,
  isDir = false
): Promise<void> {
  const folder = isDir ? filePath : path.dirname(filePath);
  await fs.mkdir(folder, { recursive: true });
}

export function previewPath(req: express.Request): string {
  let filename =
    (req.query.stream ?? "FluffierThanThou") +
    "." +
    req.locale +
    "." +
    req.timezone +
    ".png";
  return path.join(CACHE_PREVIEWS, filename.replace(/[^\w+-\.]/g, "_"));
}

export function bannerPath(title: string): string {
  return path.join(CACHE_TITLES, title + ".png");
}

export function titleCacheMiddleware() {
  return express.static(CACHE_TITLES, { maxAge: CACHE_TITLES_MAXAGE });
}

export async function isCached(
  filePath: string,
  maxAge = CACHE_PREVIEWS_MAXAGE
): Promise<boolean> {
  // try to hit cache
  try {
    const file = await fs.stat(filePath);
    if (Date.now() - file.mtimeMs < maxAge) {
      return true;
    }
  } catch (err) {}
  return false;
}

export async function cacheFile(filePath: string, file: Buffer) {
  ensureFolderExists(filePath).then((_) => fs.writeFile(filePath, file));
}
