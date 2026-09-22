/** Only explicit provider playback identifiers are accepted; never arbitrary URLs. */
export function getVideoEmbedUrl(
  provider: string | null,
  asset: string | null,
): string | null {
  if (!provider || !asset) return null;
  if (provider === "mux" && /^[a-zA-Z0-9]{8,200}$/.test(asset))
    return "https://player.mux.com/" + asset;
  if (provider === "cloudflare_stream" && /^[a-zA-Z0-9_-]{8,200}$/.test(asset))
    return "https://iframe.videodelivery.net/" + asset;
  if (
    provider === "bunny" &&
    new RegExp("^[0-9]+/[a-fA-F0-9-]{36}$").test(asset)
  )
    return "https://iframe.mediadelivery.net/embed/" + asset;
  return null;
}
