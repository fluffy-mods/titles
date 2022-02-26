import canvas, { Canvas } from "canvas";
import merge from "lodash/merge";
import path from "path";

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
    await drawBanner(title, canvas, _settings);
    return canvas.toBuffer("image/png");
}

async function drawBanner(
    title: string,
    canvas: Canvas,
    _settings: BannerSettings
) {
    await drawBannerBackground(canvas, _settings);
    await drawBannerForeground(canvas, _settings);
    await drawBannerTitle(title, canvas, _settings);
}

const FLAG_PROPORTION = 1.618;
const FLAG = canvas.loadImage(path.join(__dirname, "../images/ua-flag.svg"));
async function drawBannerTitle(
    title: string,
    canvas: Canvas,
    _settings: BannerSettings
) {
    const ctx = canvas.getContext("2d");

    // draw flag
    const flag = await FLAG;
    const flag_height = _settings.bannerHeight + 20;
    const flag_width = flag_height * FLAG_PROPORTION;
    const flag_x = _settings.bannerSlant + _settings.bannerOffset.x - 5;
    const flag_y = _settings.pointOffset.y + _settings.bannerOffset.y - 10;
    console.log({ flag_x, flag_y, flag_width, flag_height });
    ctx.drawImage(
        flag,
        0,
        0,
        flag.width,
        flag.height,
        flag_x,
        flag_y,
        flag_width,
        flag_height
    );

    // draw title
    ctx.fillStyle = _settings.colours.text;
    ctx.font = `${_settings.bannerHeight * 1.2}px Staatliches`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
        title,
        _settings.width / 2 + _settings.bannerOffset.x + flag_width / 2,
        _settings.margin +
            _settings.pointOffset.y +
            _settings.bannerOffset.y +
            _settings.bannerHeight / 2 +
            1,
        _settings.width -
            (_settings.margin + _settings.bannerSlant) * 2 -
            flag_width
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

    await drawBannerBackground(canvas, _settings);

    // info box background
    // draw background
    ctx.fillStyle = _settings.colours.boxBg;
    createPath(
        ctx,
        POINTS.bgTopLeft,
        POINTS.bgBottomLeft,
        POINTS.bgBottomRight,
        POINTS.bgTopRight
    );
    ctx.fill();

    await drawBannerForeground(canvas, _settings);
    await drawBannerTitle(title, canvas, _settings);

    return canvas;
}
