require("dotenv").config();

import path from "path";
import { fs } from "mz";
import moment from "moment";
import { storeDonation } from "../donations";

async function seed() {
    const rawDonations = await fs.readFile(
        path.join(__dirname, "../../data/donations.json"),
        "utf8"
    );
    const donations = JSON.parse(rawDonations);
    let lastTimestamp = moment("2021-01-01", "yyyy-MM-DD");
    let year = 2020;
    for (const donation of donations) {
        let curTimestamp = moment(`${donation.date} ${year}`, "D MMM yyyy");
        if (curTimestamp.isAfter(lastTimestamp)) {
            curTimestamp = moment(`${donation.date} ${--year}`, "D MMM yyyy");
        }
        lastTimestamp = curTimestamp;

        const amountRegex = donation.amount.match(/You received (?:\$|€)(\d+)/);
        const amount = amountRegex ? parseInt(amountRegex[1]) : 0;
        const timestamp = curTimestamp.toDate();
        const from = donation.from == "Anon" ? "Anonymous" : donation.from;
        storeDonation({ amount, timestamp, from });
    }
}

seed();
