import { system, world } from "@minecraft/server";
import { Observable } from "@minecraft/server-ui";
import { CustomFormBuilder } from "./custom_form_builder.js";

function generateRandomChart(length = 30, noteRate = 0.3) {
    return Array.from({ length }, () =>
        Math.random() < noteRate ? "O" : "-"
    );
}

world.afterEvents.itemUse.subscribe((ev) => {
    if (ev.itemStack.typeId !== "minecraft:stick") return;

    const player = ev.source;

    const score = Observable.create(0);
    const combo = Observable.create(0);

    const scoreText = Observable.create("スコア: 0 コンボ: 0");

    score.subscribe(() => {
        scoreText.setData(`スコア: ${score.getData()} コンボ: ${combo.getData()}`);
    });
    combo.subscribe(() => {
        scoreText.setData(`スコア: ${score.getData()} コンボ: ${combo.getData()}`);
    });

    let chart = generateRandomChart();
    const chartText = Observable.create(chart.join(""));

    const speed = 4;
    let noteIndex = 0;
    const sounds = ["note.harp", "note.bass", "note.snare"];

    const form = new CustomFormBuilder(player, "ランダム音ゲー")
        .spacer()
        .label(scoreText)
        .spacer()
        .spacer()
        .label("§a |")
        .spacer()
        .label(chartText)
        .spacer()
        .label("§a |")
        .spacer()
        .button("タイミングよく押せ！", () => {
            if (chart[0] === "O") {
                score.setData(score.getData() + 10);
                combo.setData(combo.getData() + 1);
            } else {
                combo.setData(0);
            }
        });
        

    const interval = system.runInterval(() => {
        chart.shift();
        chart.push(Math.random() < 0.3 ? "O" : "-");
        chartText.setData(chart.join("").slice(1));

        if (chart[1] === "O") {
            const sound = sounds[noteIndex % sounds.length];
            player.playSound(sound, {
                location: player.location,
                volume: 1,
                pitch: 1
            });
            noteIndex++;
        }
    }, speed);

    form.show().then(() => {
        system.clearRun(interval);
    });
});
