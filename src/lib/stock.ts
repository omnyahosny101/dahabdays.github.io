/**
 * Free stock media from Pexels (pexels.com/license — free for commercial use, no attribution required).
 * These fill the site until the owner uploads their own photos and reels in Dashboard › Media.
 * If a file fails to load (offline, blocked), every slot falls back to its illustration.
 */
export const px = (id: number, w = 1600) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
const vid = (id: number, file: string) => `https://videos.pexels.com/video-files/${id}/${file}`;
const poster = (id: number) => `https://images.pexels.com/videos/${id}/pexels-photo-${id}.jpeg?auto=compress&w=1260`;

export const STOCK = {
  heroVideo: vid(1456686, "1456686-hd_1920_1080_30fps.mp4"),
  heroPoster: `https://images.pexels.com/videos/1456686/free-video-1456686.jpg?auto=compress&w=1600`,
  underwaterVideo: vid(5277921, "5277921-uhd_2560_1440_30fps.mp4"),
  reefVideo: vid(1457024, "1457024-hd_1920_1080_30fps.mp4"),

  // Dahab & South Sinai (land)
  dahabCoastMountains: px(40359550), dahabBoatSunset: px(39811855), dahabBoatBlue: px(39811860),
  dahabWaves: px(35241406), dahabTwilight: px(38508092), dahabCliffs: px(38508096),
  dahabCliffMeditate: px(27430541), dahabHike: px(35508963), camelsDesert: px(19401673),
  camelRest: px(26793137), sinaiMountains: px(30832252), mountainSunset: px(17918925),

  // Underwater
  diverReef: px(3046582), diverCavern: px(4666754), fishCorals: px(13010781),
  redSeaCorals: px(3828753), anthias: px(8029851)
};

/** Vertical 9:16 clips for the reels row until the owner uploads their own */
export const STOCK_REELS = [
  { url: vid(31201126, "13327674_1440_2560_60fps.mp4"), poster: poster(31201126), caption: "Divers over the reef" },
  { url: vid(32582621, "13893614_1440_2560_60fps.mp4"), poster: poster(32582621), caption: "Coral garden fly-by" },
  { url: vid(34227122, "14505694_1440_2560_60fps.mp4"), poster: poster(34227122), caption: "Buddy team, blue water" },
  { url: vid(31999821, "13637717_1440_2560_60fps.mp4"), poster: poster(31999821), caption: "Life on the reef" }
];

/** Gallery until the owner uploads: [url, caption, tag] — captions describe what the photo shows */
export const STOCK_GALLERY: [string, string, string][] = [
  [STOCK.dahabCoastMountains, "Where the mountains meet the sea", "Dahab"],
  [STOCK.diverReef, "Diver over a turquoise reef", "Underwater"],
  [STOCK.dahabBoatSunset, "Sunset over the Dahab coast", "Dahab"],
  [STOCK.anthias, "Anthias swirling over Red Sea coral", "Underwater"],
  [STOCK.camelsDesert, "Camel trek in the desert", "Trips"],
  [STOCK.diverCavern, "Light in an underwater cavern", "Underwater"],
  [STOCK.dahabTwilight, "Twilight on the coastline", "Dahab"],
  [STOCK.fishCorals, "Schooling fish on the corals", "Underwater"],
  [STOCK.dahabHike, "Hiking the Dahab mountains", "Trips"],
  [STOCK.redSeaCorals, "Red Sea corals", "Underwater"],
  [STOCK.dahabWaves, "Red Sea waves and mountains", "Dahab"],
  [STOCK.camelRest, "Rest stop with the camels", "Trips"]
];

/** Default photo per program (owner can change in Dashboard › Services) */
export const SERVICE_STOCK: Record<string, string> = {
  dsd: STOCK.diverReef, owd: STOCK.fishCorals, aowd: STOCK.diverCavern, combo: STOCK.anthias, rescue: STOCK.redSeaCorals,
  nitrox: STOCK.diverReef, refresh: STOCK.fishCorals, dm: STOCK.diverCavern,
  shore: STOCK.anthias, "bh-dive": STOCK.diverCavern, "canyon-dive": STOCK.diverCavern, pack10: STOCK.redSeaCorals,
  "bh-snorkel": STOCK.dahabWaves, pools: STOCK.dahabBoatBlue, lagoon: STOCK.dahabCoastMountains, tawilat: STOCK.mountainSunset,
  ghazala: STOCK.sinaiMountains, sinai: STOCK.dahabCliffMeditate, colored: STOCK.dahabHike, weshwash: STOCK.camelRest,
  "t-sharm": STOCK.dahabCliffs, "t-hotel": STOCK.dahabBoatSunset
};
