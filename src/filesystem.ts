import express, { NextFunction, Request, Response } from "express";
import ms from "ms";
import { fs } from "mz";
import path from "path";

export const CACHE_DONATIONS = "/tmp/cache/donations.png";
export const CACHE_PREVIEWS = "/tmp/cache/previews/";
export const CACHE_TITLES = "/tmp/cache/titles/";
// export const CACHE_DONATIONS = path.join(__dirname, "../cache/donations.png");
// export const CACHE_PREVIEWS = path.join(__dirname, "../cache/previews/");
// export const CACHE_TITLES = path.join(__dirname, "../cache/titles/");
export const CACHE_DONATIONS_MAXAGE = ms("1 day");
export const CACHE_PREVIEWS_MAXAGE = ms("5 minutes");
export const CACHE_TITLES_MAXAGE = ms("1 year");
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

export function cache(maxAgeMs: number) {
    return async function (req: Request, res: Response, next: NextFunction) {
        if (!res.headersSent) {
            res.set("Cache-Control", `public, max-age=${maxAgeMs / 1000}`);
        }
        next();
    };
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
    await ensureFolderExists(filePath);
    await fs.writeFile(filePath, file);
}
