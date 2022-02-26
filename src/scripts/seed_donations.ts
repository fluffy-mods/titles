import "../environment";

import { parse } from "csv-parse/sync";
import moment from "moment";
import fs from "mz/fs";
import { join } from "path";

import { client } from "../database";
import { storeDonation } from "../donations";

const BASE_PATH = "data/transactions";
const ANONYMOUS = ["Ko-fi Supporter"];

async function seed() {
    for (const file of await fs.readdir(BASE_PATH)) {
        console.log({ file });

        const donations = parse(await fs.readFile(join(BASE_PATH, file)), {
            columns: true,
        });

        for (const donation of donations) {
            const from = ANONYMOUS.includes(donation.From)
                ? "Anonymous"
                : donation.From;

            const amount = parseFloat(donation.Received);
            const timestamp = moment(
                Object.values(donation)[0] as string,
                "MM/DD/YYYY"
            ).toDate();
            console.log({ amount, timestamp, from });
            await storeDonation({ amount, timestamp, from });
        }
    }

    (await client).close();
}

seed();
