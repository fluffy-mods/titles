import moment, { Moment } from "moment-timezone";
import locale from "locale";
import maxmind, { CityResponse } from "maxmind";
import path from "path";
import express from "express";

const DEFAULT_LOCALE = "en-gb";
const SUPPORTED_LOCALES = require("../data/supportedLocales.json");
const MAXMIND_CITY_DB = path.join(__dirname, "../data/GeoLite2-City.mmdb");
const lookup = maxmind.open<CityResponse>(MAXMIND_CITY_DB);

interface ITimezoneOptions {
  ipfield: keyof typeof express.request;
  default: string;
}
const defaultTimezoneOptions: ITimezoneOptions = {
  ipfield: "clientIp",
  default: "Europe/Amsterdam",
};
interface ILocaleOptions {
  locales: string[];
  default: string;
}
const defaultLocaleOptions: ILocaleOptions = {
  locales: SUPPORTED_LOCALES,
  default: DEFAULT_LOCALE,
};

export async function getTimezone(ip: string) {
  return (await lookup).get(ip)?.location?.time_zone;
}
export function localeMiddleware(options?: Partial<ILocaleOptions>) {
  options = Object.assign({}, defaultLocaleOptions, options);
  return locale(SUPPORTED_LOCALES, DEFAULT_LOCALE);
}
export function timezoneMiddleware(_options?: Partial<ITimezoneOptions>) {
  let options = Object.assign({}, defaultTimezoneOptions, _options);
  return async function (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    req.timezone = (await getTimezone(req[options.ipfield])) ?? options.default;
    next();
  };
}
export function getTimezoneAbbreviation(timezone: string, locale: string) {
  return moment.tz(timezone).locale(locale).format(" z");
}
export function getLocalTime(
  time: string,
  timezone: string,
  locale: string,
  source: string = "Europe/Amsterdam",
  format: string = "dddd LT"
): string {
  return moment
    .tz(time, format, source)
    .tz(timezone)
    .locale(locale)
    .format(format);
}
