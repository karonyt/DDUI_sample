import { world } from "@minecraft/server";
import { CustomFormBuilder } from "./custom_form_builder.js";

world.afterEvents.itemUse.subscribe((ev) => {
    if (ev.itemStack.typeId !== "minecraft:stick") return;

    const form = new CustomFormBuilder(ev.source);
    let counter = 0;

    form
        .addHeader("カウンター: 0")  // index 0
        .addSpacer()                 // index 1
        .addButton("カウントアップ", "", (player, form) => {
            counter++;
            form.setLabelText(0, `カウンター: ${counter}`);
            form.setTitle(`カウント: ${counter}`);
        })                           // index 2
        .addButton("リセット", "", (player, form) => {
            counter = 0;
            form.setLabelText(0, `カウンター: 0`);
            form.setTitle("Custom Form");
        })                           // index 3
        .addSpacer() // index 4
        .addDivider()                // index 5
        .addToggle("オプション", true, "", (value, player, form) => {

            form.setElementVisible(7, value);
            form.setElementVisible(8, value);
            form.setElementVisible(9, value);

        })                           // index 6
        .addSlider("音量", 50, 0, 100, 10, "", (value, player, form) => {
            player.sendMessage(`§b音量変更: ${value}`);
            form.setLabelText(9, `現在の音量: ${value}`);
        }, false)                    // index 7
        .addSpacer() // index 8
        .addHeader("現在の音量: 50", false) // index 9
        .addSpacer() // index 10
        .show("リアクティブフォーム");
});
