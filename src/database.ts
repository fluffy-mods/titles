import { MongoClient } from "mongodb";

const dbUri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@donations-vsh2n.azure.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`;
export const client = new MongoClient(dbUri, {
    useUnifiedTopology: true,
}).connect();
