require("dotenv").config({});
import express from "express";
import { mw as ipMiddleware } from "request-ip";
import {
    localeMiddleware,
    timezoneMiddleware,
    getLocalTime,
    getTimezoneAbbreviation,
} from "./locales";
import { loggerMiddleware } from "./logger";
import {
    isCached,
    previewPath,
    cacheFile,
    bannerPath,
    createCache,
    CACHE_DONATIONS,
    CACHE_DONATIONS_MAXAGE,
    CACHE_TITLES_MAXAGE,
    cache as cacheControl,
    CACHE_PREVIEWS_MAXAGE,
} from "./filesystem";
import {
    createTwitchPreviewImage,
    createTwitchScheduleImage,
    createBannerImage,
    createBannerWithBackground,
} from "./canvas";
import { getStreamDetails } from "./twitch";
import cors from "cors";
import { storeDonation, getDonations } from "./donations";
import bodyParser from "body-parser";
import { client } from "./database";
import {
    createWordCloud,
    renderWordCloud,
    WordCloudSettings,
} from "./wordcloud";
import ms from "ms";
import { unlink } from "mz/fs";

const STREAM_TIMES = ["tuesday 20:00", "thursday 20:00"];

const app = express();
const port = 3000;
const logger = loggerMiddleware();

app.use(cors({ origin: ["https://steamcommunity.com", "https://ludeon.com"] }));
app.use(ipMiddleware());
app.use(localeMiddleware());
app.use(timezoneMiddleware());

/**
 * handle donation webhook
 */
app.post(
    "/donation",
    logger,
    bodyParser.urlencoded({ extended: true }),
    async (req, res) => {
        const donation = JSON.parse(req.body.data);
        const result = await storeDonation(donation);
        res.status(result.status).send(result.message);

        // remove cached donations png to have it re-generated
        unlink(CACHE_DONATIONS);
    }
);

/**
 * get top donators word cloud
 */
app.get(
    "/donations.png",
    // logger,
    cacheControl(CACHE_DONATIONS_MAXAGE),
    async (req, res) => {
        try {
            const filePath = CACHE_DONATIONS;
            if (await isCached(filePath, CACHE_DONATIONS_MAXAGE)) {
                return res.sendFile(filePath);
            }
            const supporterOptions = {
                maxAge: ms("90 days"),
                limit: 500,
            };

            const supporters = await getDonations(supporterOptions);
            const total = supporters.reduce((acc, cur) => acc + cur.amount, 0);
            supporters.forEach((s) => {
                s.last_donation = new Date(s.last_donation);
                s.size = Math.max(Math.pow(s.amount / total, 1 / 3) * 100, 6);
                s.text = s.from;
            });
            const canvas = createBannerWithBackground("Supporters", {
                contentHeight: 200,
                contentInset: 40,
            });
            const maxAgeBrightness = 255;
            const minAgeBrightness = 55;
            const cloudSettings: Partial<WordCloudSettings> = {
                cloudOffset: {
                    x: 50,
                    y: 75,
                },
                cloudHeight: 215,
                cloudWidth: 540,
                minRotation: 0,
                maxRotation: 0,
                rotationSteps: 7,
                fontStyle: (word: any) => {
                    let brightness = Math.round(
                        lerp(
                            word.last_donation.getTime(),
                            Date.now() - supporterOptions.maxAge,
                            Date.now(),
                            minAgeBrightness,
                            maxAgeBrightness
                        )
                    );
                    return `rgb(${brightness}, ${brightness}, ${brightness})`;
                },
            };
            let sizeFactor = 0.9;
            let iteration = 0;
            let words = await createWordCloud(supporters, cloudSettings);
            while (words.length < supporters.length && iteration++ < 10) {
                supporters.forEach(
                    (s) => (s.size = Math.max(sizeFactor * s.size, 6))
                );
                words = await createWordCloud(supporters, cloudSettings);
            }
            console.log({
                supporters: supporters.length,
                words: words.length,
                maxSize: words.reduce(
                    (acc, cur) => Math.max(acc, cur.size!),
                    0
                ),
                iteration,
            });
            const wordcloud = await renderWordCloud(
                await canvas,
                await words,
                cloudSettings
            );

            const imageBuffer = wordcloud.toBuffer("image/png");
            cacheFile(filePath, imageBuffer);
            return res.type("png").send(imageBuffer);
        } catch (err) {
            console.log(err);
            res.status(500).send(
                "something went wrong. Please try again later, and contact karel.kroeze@gmail.com if the issue persists."
            );
        }
    }
);

function lerp(
    source: number,
    sourceMin: number,
    sourceMax: number,
    targetMin: number,
    targetMax: number
) {
    let val = (source - sourceMin) / (sourceMax - sourceMin);
    return targetMin + val * (targetMax - targetMin);
}

app.get(
    "/preview.png",
    logger,
    cacheControl(CACHE_PREVIEWS_MAXAGE),
    async (req, res) => {
        try {
            const streamer = (req.query.stream as string) ?? "fluffierthanthou";
            const filePath = previewPath(req);
            if (await isCached(filePath)) {
                return res.sendFile(filePath);
            }

            const streamDetails = await getStreamDetails(streamer);
            let imageBuffer: Buffer;
            if (streamDetails) {
                imageBuffer = await createTwitchPreviewImage(streamDetails);
            } else {
                let localizedTimes = STREAM_TIMES.map((time) =>
                    getLocalTime(time, req.timezone, req.locale)
                );
                let localizedTimezone = getTimezoneAbbreviation(
                    req.timezone,
                    req.locale
                );
                let text = [
                    "I live stream modding on twitch" +
                        (req.locale.startsWith("en")
                            ? ", come and hang out!"
                            : " (in English)"),
                    "twitch.tv/FluffierThanThou",
                    localizedTimes.join(" & ") + " " + localizedTimezone,
                ];
                imageBuffer = await createTwitchScheduleImage(text);
            }

            cacheFile(filePath, imageBuffer);
            return res.type("png").send(imageBuffer);
        } catch (err) {
            console.log(err);
            res.status(500).send(
                "something went wrong. Please try again later, and contact karel.kroeze@gmail.com if the issue persists."
            );
        }
    }
);

app.get(
    /\/title\/(.*)\.png$/,
    // logger,
    cacheControl(CACHE_TITLES_MAXAGE),
    async (req, res) => {
        try {
            let title = req.params[0];
            let filePath = bannerPath(title);
            if (await isCached(filePath, CACHE_TITLES_MAXAGE)) {
                return res.sendFile(filePath);
            }

            let imageBuffer = await createBannerImage(req.params[0]);
            cacheFile(filePath, imageBuffer);
            return res.type("png").send(imageBuffer);
        } catch (err) {
            console.log(err);
            res.status(500).send(
                "something went wrong. Please try again later, and contact karel.kroeze@gmail.com if the issue persists."
            );
        }
    }
);

createCache()
    .then((_) => app.listen(port))
    .then((_) => console.log(`Listening at http://localhost:${port}`));

app.on("exit", async () => {
    (await client).close();
});
