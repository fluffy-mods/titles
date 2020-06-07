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
  titleCacheMiddleware,
  isCached,
  previewPath,
  cacheFile,
  bannerPath,
  createCache,
} from "./filesystem";
import {
  createTwitchPreviewImage,
  createTwitchScheduleImage,
  createBannerImage,
} from "./canvas";
import { getStreamDetails } from "./twitch";
import cors from "cors";

const STREAM_TIMES = ["tuesday 20:00", "thursday 20:00"];

const app = express();
const port = 3000;

app.use(cors());
app.use(ipMiddleware());
app.use(localeMiddleware());
app.use(timezoneMiddleware());
app.use("/title", titleCacheMiddleware());

app.get("/preview.png", loggerMiddleware(), async (req, res) => {
  // todo: remove for production
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
      let localizedTimezone = getTimezoneAbbreviation(req.timezone, req.locale);
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
    res
      .status(500)
      .send(
        "something went wrong. Please try again later, and contact karel.kroeze@gmail.com if the issue persists."
      );
  }
});

app.get(/\/title\/(.*)\.png$/, async (req, res) => {
  try {
    let title = req.params[0];
    let filePath = bannerPath(title);
    let imageBuffer = await createBannerImage(req.params[0]);
    cacheFile(filePath, imageBuffer);
    return res.type("png").send(imageBuffer);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .send(
        "something went wrong. Please try again later, and contact karel.kroeze@gmail.com if the issue persists."
      );
  }
});

createCache()
  .then((_) => app.listen(port))
  .then((_) => console.log(`Listening at http://localhost:${port}`));
