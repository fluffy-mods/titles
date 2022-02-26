import { Request } from "express";
import morgan from "morgan";

// create tokens
morgan.token<Request, any>("locale", (req) => req.locale);
morgan.token<Request, any>("timezone", (req) => req.timezone);

export function loggerMiddleware() {
    return morgan(
        ":response-time ms :timezone :locale :url :status :res[content-length] :referrer"
    );
}
