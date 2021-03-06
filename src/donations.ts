import merge from "lodash/merge";
import ms from "ms";

import { client } from "./database";

export interface IDonationData {
    message_id: string;
    timestamp: string;
    type: string;
    from_name: string;
    message: string;
    amount: string;
    url: string;
}

export interface IDonation {
    from: string;
    amount: number;
    timestamp: Date;
}

export interface ISupporter {
    from: string;
    amount: number;
    size: number;
    text: string;
    last_donation: Date;
}

function isDonation(input: any): input is IDonation {
    return input.from && typeof input.from === "string";
}

interface IStoreReturnValue {
    status: number;
    message: string;
}

export async function storeDonation(
    donation: IDonation
): Promise<IStoreReturnValue>;
export async function storeDonation(
    donationData: IDonationData
): Promise<IStoreReturnValue>;
export async function storeDonation(
    data: IDonation | IDonationData
): Promise<IStoreReturnValue> {
    try {
        const donationCollection = (await client)
            .db("donations")
            .collection("donations");
        let donation: IDonation;
        if (isDonation(data)) {
            donation = data;
        } else {
            donation = {
                from: data.from_name,
                amount: parseFloat(data.amount),
                timestamp: new Date(data.timestamp),
            };
        }
        const result = await donationCollection.insertOne(donation);
        console.log({ donation, result });

        if (result.acknowledged) {
            return { status: 200, message: "ok" };
        } else {
            return { status: 400, message: "failed" };
        }
    } catch (err: unknown) {
        if (err instanceof Error) {
            return { status: 500, message: err.toString() };
        } else {
            console.log({ err });
            return { status: 500, message: "unknown error" };
        }
    }
}

interface DonationOptions {
    maxAge: number;
    limit: number;
}

const defaultDonationOptions: DonationOptions = {
    maxAge: ms("90 days"),
    limit: 100,
};

export async function getDonations(settings?: Partial<DonationOptions>) {
    const _settings = merge({}, defaultDonationOptions, settings);

    try {
        const donationCollection = (await client)
            .db("donations")
            .collection("donations");
        const donations = donationCollection.aggregate([
            {
                $match: {
                    timestamp: {
                        $gte: new Date(Date.now() - _settings.maxAge),
                    },
                },
            },
            {
                $group: {
                    _id: "$from",
                    from: { $first: "$from" },
                    amount: { $sum: "$amount" },
                    last_donation: { $max: "$timestamp" },
                },
            },
            { $sort: { amount: -1 } },
            { $limit: _settings.limit },
        ]);
        return (await donations.toArray()) as ISupporter[];
    } catch (err) {
        console.error(err);
        return [];
    }
}
