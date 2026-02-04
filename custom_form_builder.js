import { CustomForm, Observable } from "@minecraft/server-ui";
import { Player } from "@minecraft/server";

export class CustomFormBuilder {
    /** @type {Player} */
    player;

    /** @type {Array<(form: CustomForm) => void>} */
    elements = [];

    /** @type {Observable<string>} */
    title;

    constructor(player, title = "Custom Form") {
        this.player = player;
        this.title = Observable.create(String(title));
    }

    setTitle(text) {
        this.title.setData(String(text));
        return this;
    }

    label(text) {
        const obs =
            text instanceof Observable
                ? text
                : Observable.create(String(text));

        this.elements.push(form => {
            form.label(obs);
        });
        return this;
    }

    spacer() {
        this.elements.push(form => form.spacer());
        return this;
    }

    divider() {
        this.elements.push(form => form.divider());
        return this;
    }

    textField(label, defaultValue = "", onChange) {
        const labelObs =
            label instanceof Observable
                ? label
                : Observable.create(String(label));

        const textObs = Observable.create(String(defaultValue));

        if (onChange) {
            textObs.subscribe(v => onChange(v, this.player));
        }

        this.elements.push(form => {
            form.textField(labelObs, textObs);
        });

        return textObs; // ← 重要：外から操作したいなら返す
    }

    toggle(label, defaultValue = false, onChange) {
        const labelObs =
            label instanceof Observable
                ? label
                : Observable.create(String(label));

        const toggleObs = Observable.create(Boolean(defaultValue));

        if (onChange) {
            toggleObs.subscribe(v => onChange(v, this.player));
        }

        this.elements.push(form => {
            form.toggle(labelObs, toggleObs);
        });

        return toggleObs;
    }

    slider(label, defaultValue, min, max, onChange) {
        const labelObs =
            label instanceof Observable
                ? label
                : Observable.create(String(label));

        const valueObs = Observable.create(Number(defaultValue));
        const minObs =
            min instanceof Observable ? min : Observable.create(Number(min));
        const maxObs =
            max instanceof Observable ? max : Observable.create(Number(max));

        if (onChange) {
            valueObs.subscribe(v => onChange(v, this.player));
        }

        this.elements.push(form => {
            form.slider(labelObs, valueObs, minObs, maxObs);
        });

        return valueObs;
    }

    dropdown(label, items, defaultIndex = 0, onChange) {
        const labelObs =
            label instanceof Observable
                ? label
                : Observable.create(String(label));

        const valueObs = Observable.create(Number(defaultIndex));

        if (onChange) {
            valueObs.subscribe(v => onChange(v, this.player));
        }

        this.elements.push(form => {
            form.dropdown(labelObs, valueObs, items);
        });

        return valueObs;
    }

    button(label, onClick) {
        const labelObs =
            label instanceof Observable
                ? label
                : Observable.create(String(label));

        this.elements.push(form => {
            form.button(labelObs, () => {
                onClick(this.player);
            });
        });

        return this;
    }

    async show() {
        const form = CustomForm.create(this.player, this.title);

        for (const el of this.elements) {
            el(form);
        }

        await form.show();
    }
}
