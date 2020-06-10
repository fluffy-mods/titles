import { Canvas } from "canvas";
import cloud, { Word } from "d3-cloud";
import { point } from "./canvas";
import merge from "lodash/merge";

export interface WordCloudSettings {
    cloudWidth: number;
    cloudHeight: number;
    cloudOffset: point;
    fontSize: (word: Word, settings: WordCloudSettings) => number;
    fontStyle: (word: Word, settings: WordCloudSettings) => string;
    minRotation: number;
    maxRotation: number;
    rotationSteps: number;
}

const defaultWordCloudSettings: WordCloudSettings = {
    cloudWidth: 550,
    cloudHeight: 180,
    cloudOffset: { x: 0, y: 0 },
    fontSize: (word) => word.size!,
    fontStyle: (word) => "white",
    minRotation: -45,
    maxRotation: 45,
    rotationSteps: 5,
};

export async function createWordCloud(
    words: { text: string; size: number }[],
    settings?: Partial<WordCloudSettings>
): Promise<Word[]> {
    const _settings = merge({}, defaultWordCloudSettings, settings);
    return new Promise((resolve, reject) => {
        try {
            cloud()
                .size([_settings.cloudWidth, _settings.cloudHeight])
                .canvas(
                    () =>
                        (new Canvas(
                            _settings.cloudWidth,
                            _settings.cloudHeight
                        ) as unknown) as HTMLCanvasElement
                )
                .words(words)
                .padding(1)
                .rotate(function () {
                    return (
                        _settings.minRotation +
                        Math.floor(Math.random() * _settings.rotationSteps) *
                            ((_settings.maxRotation - _settings.minRotation) /
                                (_settings.rotationSteps - 1))
                    );
                })
                .font("Staatliches")
                .fontSize((word) => _settings.fontSize(word, _settings))
                .spiral("rectangular")
                .on("end", (tags) => resolve(tags))
                .start();
        } catch (err) {
            return reject(err);
        }
    });
}

export async function renderWordCloud(
    canvas: Canvas,
    words: any,
    settings?: Partial<WordCloudSettings>
) {
    const _settings = merge({}, defaultWordCloudSettings, settings);

    function radians(degrees: number) {
        return (degrees / 180) * Math.PI;
    }

    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.translate(
        _settings.cloudWidth / 2 + _settings.cloudOffset.x,
        _settings.cloudHeight / 2 + _settings.cloudOffset.y
    );

    for (const word of words) {
        const angle = radians(word.rotate);
        ctx.fillStyle = _settings.fontStyle(word, _settings);
        ctx.font = `${word.size}px ${word.font}`;
        ctx.translate(word.x, word.y);
        ctx.rotate(angle);
        ctx.fillText(word.text, 0, 0);
        ctx.rotate(-angle);
        ctx.translate(-word.x, -word.y);
    }

    return canvas;
}
