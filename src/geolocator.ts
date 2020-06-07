import maxmind, { CityResponse } from "maxmind";
import path from "path";

const MAXMIND_CITY_DB = path.join(__dirname, "../geo_db/GeoLite2-City.mmdb");
const lookup = maxmind.open<CityResponse>(MAXMIND_CITY_DB);
