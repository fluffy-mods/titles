import canvas, { loadImage, Canvas } from "canvas";
import path from "path";
import { HelixStream } from "twitch";
import { CACHE_PREVIEWS_MAXAGE } from "./filesystem";
import merge from "lodash/merge";

const FONT_STAATLICHES = path.join(
    __dirname,
    "../fonts/Staatliches-Regular.ttf"
);

canvas.registerFont(FONT_STAATLICHES, { family: "Staatliches" });

export async function createBannerImage(
    title: string,
    settings?: Partial<BannerSettings>
) {
    const _settings = merge({}, defaultBannerSettings, settings);
    const height =
        _settings.bannerHeight +
        (_settings.pointOffset.y + _settings.margin) * 2;
    const canvas = new Canvas(_settings.width, height);
    drawBanner(title, canvas, _settings);
    return canvas.toBuffer("image/png");
}

async function drawBanner(
    title: string,
    canvas: Canvas,
    _settings: BannerSettings
) {
    drawBannerBackground(canvas, _settings);
    drawBannerForeground(canvas, _settings);
    drawBannerTitle(title, canvas, _settings);
}

function drawBannerTitle(
    title: string,
    canvas: Canvas,
    _settings: BannerSettings
) {
    const ctx = canvas.getContext("2d");

    // draw title
    ctx.fillStyle = _settings.colours.text;
    ctx.font = `${_settings.bannerHeight * 1.2}px Staatliches`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
        title,
        _settings.width / 2 + _settings.bannerOffset.x,
        _settings.margin +
            _settings.pointOffset.y +
            _settings.bannerOffset.y +
            _settings.bannerHeight / 2 +
            1,
        _settings.width - (_settings.margin + _settings.bannerSlant) * 2
    );
}

function drawBannerForeground(canvas: Canvas, _settings: BannerSettings) {
    const ctx = canvas.getContext("2d");
    const POINTS = {
        topLeft: {
            x: _settings.margin + _settings.bannerOffset.x,
            y:
                _settings.margin +
                _settings.bannerOffset.y +
                _settings.pointOffset.y,
        },
        topRight: {
            x:
                _settings.width +
                _settings.bannerOffset.x -
                _settings.margin -
                _settings.bannerSlant,
            y:
                _settings.margin +
                _settings.bannerOffset.y +
                _settings.pointOffset.y,
        },
        bottomLeft: {
            x:
                _settings.margin +
                _settings.bannerOffset.x +
                _settings.bannerSlant,
            y:
                _settings.margin +
                _settings.bannerHeight +
                _settings.bannerOffset.y +
                _settings.pointOffset.y,
        },
        bottomRight: {
            x: _settings.width + _settings.bannerOffset.x - _settings.margin,
            y:
                _settings.margin +
                _settings.bannerHeight +
                _settings.bannerOffset.y +
                _settings.pointOffset.y,
        },
    };

    // draw banner foreground
    ctx.fillStyle = _settings.colours.bannerFg;
    createPath(
        ctx,
        POINTS.topLeft,
        POINTS.topRight,
        POINTS.bottomRight,
        POINTS.bottomLeft
    );
    ctx.fill();
}

function drawBannerBackground(canvas: Canvas, _settings: BannerSettings) {
    const ctx = canvas.getContext("2d");
    const POINTS = {
        topLeft: {
            x: _settings.margin + _settings.bannerOffset.x,
            y:
                _settings.margin +
                _settings.bannerOffset.y +
                _settings.pointOffset.y,
        },
        topRight: {
            x:
                _settings.width +
                _settings.bannerOffset.x -
                _settings.margin -
                _settings.bannerSlant,
            y:
                _settings.margin +
                _settings.bannerOffset.y +
                _settings.pointOffset.y,
        },
        bottomLeft: {
            x:
                _settings.margin +
                _settings.bannerOffset.x +
                _settings.bannerSlant,
            y:
                _settings.margin +
                _settings.bannerHeight +
                _settings.bannerOffset.y +
                _settings.pointOffset.y,
        },
        bottomRight: {
            x: _settings.width + _settings.bannerOffset.x - _settings.margin,
            y:
                _settings.margin +
                _settings.bannerHeight +
                _settings.bannerOffset.y +
                _settings.pointOffset.y,
        },
        pointLeft: {
            x:
                _settings.margin +
                _settings.bannerOffset.x +
                _settings.pointOffset.x,
            y: _settings.margin + _settings.bannerOffset.y,
        },
        pointRight: {
            x:
                _settings.width +
                _settings.bannerOffset.x -
                _settings.margin -
                _settings.pointOffset.x,
            y:
                _settings.margin +
                2 * _settings.pointOffset.y +
                _settings.bannerOffset.y +
                _settings.bannerHeight,
        },
    };

    // draw banner background pieces
    ctx.fillStyle = _settings.colours.bannerBg;
    createPath(ctx, POINTS.topLeft, POINTS.pointLeft, POINTS.bottomLeft);
    ctx.fill();
    createPath(ctx, POINTS.bottomRight, POINTS.pointRight, POINTS.topRight);
    ctx.fill();
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
    settings?: Partial<TwitchPreviewSettings>
) {
    const _settings = merge({}, defaultTwitchPreviewSettings, settings);
    const height = _settings.margin * 2 + _settings.previewHeight;
    _settings.bannerHeight += _settings.previewFontSize / 1.2;
    _settings.pointOffset.y *= 1.2;
    _settings.bannerOffset.y =
        height -
        _settings.margin * 2 -
        _settings.bannerHeight -
        _settings.pointOffset.y * 2;
    const canvas = new Canvas(_settings.width, height);
    const ctx = canvas.getContext("2d");

    const previewImage = await getTwitchPreview(
        stream,
        _settings.previewWidth,
        _settings.previewHeight
    );

    drawBannerBackground(canvas, _settings);
    ctx.drawImage(
        previewImage,
        _settings.previewOffset.x,
        _settings.previewOffset.y
    );
    drawBannerForeground(canvas, _settings);

    // draw title
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = _settings.colours.text;
    const titleHeight =
        (_settings.bannerHeight - _settings.previewFontSize) * 1.2;
    ctx.font = `${titleHeight}px Staatliches`;
    ctx.fillText(
        "Streaming Now!",
        _settings.width / 2 + _settings.bannerOffset.x,
        _settings.margin +
            _settings.pointOffset.y +
            _settings.bannerOffset.y +
            titleHeight / 2,
        _settings.width - (_settings.margin + _settings.bannerSlant) * 2
    );

    // draw subtitle
    ctx.font = `${_settings.previewFontSize}px Staatliches`;
    ctx.fillText(
        stream.title.split("-")[0],
        _settings.width / 2 + _settings.bannerSlant / 3,
        _settings.bannerOffset.y +
            _settings.pointOffset.y +
            _settings.bannerHeight -
            _settings.previewFontSize / 1.2 / 2,
        _settings.width - (_settings.margin + _settings.bannerSlant) * 2
    );
    return canvas.toBuffer("image/png");
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

export type point = { x: number; y: number };
export type colour = string;

export interface BannerSettings {
    width: number;
    margin: number;
    pointOffset: point;
    colours: {
        [label: string]: colour;
    };
    bannerOffset: point;
    bannerHeight: number;
    bannerSlant: number;
}

const defaultBannerSettings: BannerSettings = {
    width: 480,
    margin: 0,
    pointOffset: { x: 80, y: 10 },
    bannerOffset: { x: 0, y: 0 },
    colours: {
        bannerBg: "#145398",
        bannerFg: "#2c87e9",
        boxBg: "#1a222b",
        text: "#fff",
    },
    bannerHeight: 30,
    bannerSlant: 10,
};

interface TwitchPreviewSettings extends BannerSettings {
    previewWidth: number;
    previewHeight: number;
    previewOffset: point;
    previewFontSize: number;
}

const defaultTwitchPreviewSettings: TwitchPreviewSettings = merge(
    {},
    defaultBannerSettings,
    {
        previewWidth: 400,
        previewHeight: 230,
        previewOffset: {
            x: 55,
            y: 0,
        },
        previewFontSize: 24,
    }
);

export interface BannerWithBackgroundSettings extends BannerSettings {
    contentHeight: number;
    contentInset: number;
    contentSlant: number;
}

const defaultBannerWithBackgroundSettings: BannerWithBackgroundSettings = merge(
    {},
    defaultBannerSettings,
    {
        contentHeight: 60,
        contentInset: 40,
        contentSlant: 20,
    }
);

export async function createBannerWithBackground(
    title: string,
    settings?: Partial<BannerWithBackgroundSettings>
): Promise<canvas.Canvas> {
    const _settings = merge({}, defaultBannerWithBackgroundSettings, settings);
    const height =
        _settings.bannerHeight +
        _settings.contentHeight +
        _settings.contentSlant +
        _settings.pointOffset.y +
        _settings.margin * 2;
    const canvas = new Canvas(_settings.width, height);
    const ctx = canvas.getContext("2d");

    const POINTS = {
        bgTopLeft: {
            x:
                _settings.margin +
                _settings.bannerSlant +
                _settings.contentInset,
            y:
                _settings.margin +
                _settings.pointOffset.y +
                _settings.bannerHeight,
        },
        bgBottomLeft: {
            x:
                _settings.margin +
                _settings.contentSlant +
                _settings.contentInset,
            y: height - _settings.bannerSlant,
        },
        bgBottomRight: {
            x:
                _settings.width -
                _settings.margin -
                _settings.contentSlant -
                _settings.contentInset,
            y: height - _settings.margin,
        },
        bgTopRight: {
            x: _settings.width - _settings.margin - _settings.contentInset,
            y:
                _settings.margin +
                _settings.pointOffset.y +
                _settings.bannerHeight,
        },
    };

    drawBannerBackground(canvas, _settings);

    // info box background
    // draw background
    ctx.fillStyle = _settings.colours.boxBg;
    ctx.beginPath();
    ctx.moveTo(POINTS.bgTopLeft.x, POINTS.bgTopLeft.y);
    ctx.lineTo(POINTS.bgBottomLeft.x, POINTS.bgBottomLeft.y);
    ctx.lineTo(POINTS.bgBottomRight.x, POINTS.bgBottomRight.y);
    ctx.lineTo(POINTS.bgTopRight.x, POINTS.bgTopRight.y);
    ctx.fill();

    drawBannerForeground(canvas, _settings);
    drawBannerTitle(title, canvas, _settings);

    return canvas;
}

interface TwitchScheduleSettings {
    lineHeight: number;
}

const defaultTwitchScheduleSettings: TwitchScheduleSettings = {
    lineHeight: 20,
};

export async function createTwitchScheduleImage(
    text: string[],
    settings?: Partial<BannerWithBackgroundSettings & TwitchScheduleSettings>
) {
    const _settings = merge(
        {},
        defaultBannerWithBackgroundSettings,
        defaultTwitchScheduleSettings,
        settings
    );
    _settings.contentHeight = text.length * _settings.lineHeight;
    const Canvas = await createBannerWithBackground(
        "Twitch Streams",
        _settings
    );
    const ctx = Canvas.getContext("2d");

    let yPosition =
        _settings.margin +
        _settings.pointOffset.y +
        _settings.bannerHeight +
        _settings.lineHeight / 2;
    const maxWidth =
        _settings.width -
        _settings.contentSlant -
        (_settings.margin + _settings.contentInset + _settings.bannerSlant) * 2;
    ctx.font = `${_settings.lineHeight}px Staatliches`;

    for (let line of text) {
        ctx.fillText(line, _settings.width / 2, yPosition, maxWidth);
        yPosition += _settings.lineHeight;
    }
    return Canvas.toBuffer("image/png");
}
