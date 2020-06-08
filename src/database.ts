import { MongoClient } from "mongodb";
export const client = new MongoClient("mongodb://mongo:27017", {
    useUnifiedTopology: true,
}).connect();
