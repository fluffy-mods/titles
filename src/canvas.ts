import canvas, { loadImage } from "canvas";
import path from "path";
import { HelixStream } from "twitch";
import { CACHE_PREVIEWS_MAXAGE } from "./filesystem";

const FONT_STAATLICHES = path.join(
  __dirname,
  "../fonts/Staatliches-Regular.ttf"
);

canvas.registerFont(FONT_STAATLICHES, { family: "Staatliches" });

export async function createBannerImage(
  title: string,
  width = 630,
  height = 100
) {
  const Canvas = canvas.createCanvas(width, height);
  const ctx = Canvas.getContext("2d");

  const bannerBg = await loadImage(
    path.join(__dirname, "../images/banner.png")
  );

  ctx.drawImage(bannerBg, 0, 0, 630, 123, 0, 0, 630, 100);
  ctx.font = "60px Staatliches";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.fillText(title, width / 2, 78, width);
  return Canvas.toBuffer("image/png");
}

const preview: {
  time: number;
  image: canvas.Image | undefined;
} = {
  time: 0,
  image: undefined,
};
export async function getTwitchPreview(
  stream: HelixStream,
  width: number,
  height: number,
  maxAge: number = CACHE_PREVIEWS_MAXAGE
) {
  if (preview.time + maxAge < Date.now() || !preview.image) {
    const previewUrl = stream.thumbnailUrl
      .replace("{width}", width.toString())
      .replace("{height}", height.toString())
      .replace(".jpg", ".png");
    preview.image = await loadImage(previewUrl);
  }
  return preview.image;
}

export async function createTwitchPreviewImage(
  stream: HelixStream,
  width = 630,
  height = 320
) {
  const Canvas = canvas.createCanvas(width, height);
  const ctx = Canvas.getContext("2d");
  const offsets = {
    x: 55,
    y: 0,
    width: 110,
    height: 20,
  };

  const bannerFg = await loadImage(
    path.join(__dirname, "../images/banner-overlay-fg.png")
  );
  const bannerBg = await loadImage(
    path.join(__dirname, "../images/banner-overlay-bg.png")
  );
  const previewImage = getTwitchPreview(
    stream,
    width - offsets.width,
    height - offsets.height
  );

  ctx.drawImage(bannerBg, 0, height - 180);
  ctx.drawImage(previewImage, offsets.x, offsets.y);
  ctx.drawImage(bannerFg, 0, height - 180);

  ctx.font = "64px Staatliches";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = "white";
  ctx.fillText("Streaming Now!", width / 2, height - 56, width);
  ctx.font = "24px Staatliches";
  ctx.fillText(
    stream.title.split("-")[0],
    width / 2 + 8,
    height - 48,
    width - 80
  );
  return Canvas.toBuffer("image/png");
}

function createPath(
  context: CanvasRenderingContext2D,
  ...points: { x: number; y: number }[]
): void {
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    context.lineTo(points[i].x, points[i].y);
  }
  context.closePath();
}

export async function createTwitchScheduleImage(text: string[]) {
  const width = 630;
  const height = 240;
  const Canvas = canvas.createCanvas(width, height);
  const ctx = Canvas.getContext("2d");
  const COLOURS = {
    bannerBg: "#145398",
    bannerFg: "#2c87e9",
    boxBg: "#1a222b",
  };
  const POINTS = {
    topLeft: { x: 7, y: 38 },
    topRight: { x: 588, y: 38 },
    pointLeft: { x: 122, y: 8 },
    bottomLeft: { x: 47, y: 100 },
    bottomRight: { x: 620, y: 102 },
    pointRight: { x: 520, y: 124 },
  };

  // draw banner background pieces
  ctx.fillStyle = COLOURS.bannerBg;
  createPath(ctx, POINTS.topLeft, POINTS.pointLeft, POINTS.bottomLeft);
  ctx.fill();
  createPath(ctx, POINTS.bottomRight, POINTS.pointRight, POINTS.topRight);
  ctx.fill();

  // info box background
  // draw background
  ctx.fillStyle = COLOURS.boxBg;
  ctx.beginPath();
  ctx.moveTo(60, 100);
  ctx.lineTo(60, 190);
  ctx.lineTo(560, 200);
  ctx.lineTo(580, 100);
  ctx.fill();

  ctx.fillStyle = COLOURS.bannerFg;
  createPath(
    ctx,
    POINTS.topLeft,
    POINTS.topRight,
    POINTS.bottomRight,
    POINTS.bottomLeft
  );
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.font = "64px Staatliches";
  ctx.textAlign = "center";
  ctx.fillText("twitch streams", width / 2, 95, width - 90);
  ctx.font = "24px Staatliches";

  let y = 126,
    lineHeight = 28;
  for (let line of text) {
    ctx.fillText(line, width / 2, y, width - 140);
    y += lineHeight;
  }
  return Canvas.toBuffer("image/png");
}
