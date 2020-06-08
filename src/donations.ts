import { client } from "./database";

export interface IDonation {
    message_id: string;
    timestamp: string;
    type: string;
    from_name: string;
    message: string;
    amount: string;
    url: string;
}

export async function storeDonation(donation: IDonation) {
    try {
        const donationCollection = (await client)
            .db("donations")
            .collection<IDonation>("donations");
        const result = await donationCollection.insertOne(donation);
        if (result.result.ok == 1) {
            return { status: 200, message: "ok" };
        } else {
            return { status: 400, message: "failed" };
        }
    } catch (err) {
        return { status: 500, message: err.toString() };
    }
}
