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
  return (await twitch).helix.streams.getStreamByUserName(streamer);
}
