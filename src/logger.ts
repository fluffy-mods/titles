import morgan from "morgan";
import chalk from "chalk";

// create tokens
morgan.token("locale", (req) => req.locale);
morgan.token("timezone", (req) => req.timezone);

export function loggerMiddleware() {
  return morgan(
    ":response-time ms :timezone :locale :url :status :res[content-length] :referrer"
  );
}
