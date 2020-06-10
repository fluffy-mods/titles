import TwitchClient, { HelixStream } from "twitch";

// twitch API
export const twitch: Promise<TwitchClient> = TwitchClient.getAppAccessToken(
    process.env.TWITCH_CLIENT_ID!,
    process.env.TWITCH_CLIENT_SECRET!
).then((token) => {
    return TwitchClient.withCredentials(
        process.env.TWITCH_CLIENT_ID!,
        token.accessToken,
        undefined,
        {
            clientSecret: process.env.TWITCH_CLIENT_SECRET!,
            refreshToken: token.refreshToken,
        }
    );
});

export async function getStreamDetails(streamer: string = "FluffierThanThou") {
    const _twitch = await twitch;
    let stream: HelixStream | null;
    try {
        stream = await _twitch.helix.streams.getStreamByUserName(streamer);
    } catch (err) {
        console.error(err);
        await _twitch.refreshAccessToken();
        stream = await _twitch.helix.streams.getStreamByUserName(streamer);
    }
    return stream;
}
