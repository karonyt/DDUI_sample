import { DataDrivenScreen, ddui } from "@minecraft/server-ui";

export class CustomFormBuilder {
    constructor(player) {
        this.player = player;
        this.layout = [];
        this.callbacks = new Map();
        this.subscriptions = [];
        this.isShown = false;
        this.title = "Custom Form";
    }

    addHeader(text) {
        this.layout.push({
            header_visible: true,
            visible: true,
            text: text
        });
        return this;
    }

    addSpacer() {
        this.layout.push({
            spacer_visible: true,
            visible: true
        });
        return this;
    }

    addDivider() {
        this.layout.push({
            divider_visible: true,
            visible: true
        });
        return this;
    }

    addTextField(label, defaultValue = "", description = "", onChange = null) {
        const index = this.layout.length;
        this.layout.push({
            textfield_visible: true,
            visible: true,
            label: label,
            text: defaultValue,
            description: description
        });

        if (onChange) {
            this.callbacks.set(`layout[${index}].text`, onChange);
        }

        return this;
    }

    addToggle(label, defaultValue = false, description = "", onChange = null, visible = true) {
        const index = this.layout.length;
        this.layout.push({
            toggle_visible: true,
            visible: visible,
            label: label,
            toggled: defaultValue,
            description: description
        });

        if (onChange) {
            this.callbacks.set(`layout[${index}].toggled`, onChange);
        }

        return this;
    }

    addSlider(label, defaultValue = 0, min = 0, max = 100, step = 1, description = "", onChange = null) {
        const index = this.layout.length;
        this.layout.push({
            slider_visible: true,
            visible: true,
            label: label,
            value: defaultValue,
            minValue: min,
            maxValue: max,
            step: step,
            description: description
        });

        if (onChange) {
            this.callbacks.set(`layout[${index}].value`, onChange);
        }

        return this;
    }

    addDropdown(label, items, defaultValue = 0, description = "", onChange = null) {
        const index = this.layout.length;

        const formattedItems = {
            length: items.length
        };
        items.forEach((item, i) => {
            formattedItems[i] = {
                label: item.label,
                value: item.value ?? i,
                description: item.description ?? ""
            };
        });

        this.layout.push({
            dropdown_visible: true,
            visible: true,
            label: label,
            value: defaultValue,
            description: description,
            items: formattedItems
        });

        if (onChange) {
            this.callbacks.set(`layout[${index}].value`, onChange);
        }

        return this;
    }

    addButton(label, tooltip = "", onClick = null, disabled = false) {
        const index = this.layout.length;
        this.layout.push({
            button_visible: true,
            visible: true,
            label: label,
            tooltip: tooltip,
            disabled: disabled,
            onClick: 0
        });

        if (onClick) {
            this.callbacks.set(`layout[${index}].onClick`, onClick);
        }

        return this;
    }

    updateElement(index, property, value) {
        if (!this.isShown) {
            throw new Error("フォームが表示されていません");
        }

        if (index < 0 || index >= this.layout.length) {
            throw new Error(`無効なインデックス: ${index}`);
        }

        if (property === "visible" || property === "disabled" || property === "toggled") {
            value = Boolean(value);
        } else if (property === "value" || property === "minValue" || property === "maxValue" || property === "step") {
            value = Number(value);
        } else if (property === "text" || property === "label" || property === "description" || property === "tooltip") {
            value = String(value);
        }

        this.layout[index][property] = value;

        const path = `layout[${index}].${property}`;

        ddui.setPropertyPath(
            this.player,
            "minecraft",
            "custom_form_data",
            path,
            value
        );

        return this;
    }

    setElementVisible(index, visible) {
        return this.updateElement(index, "visible", Boolean(visible));
    }

    setElementDisabled(index, disabled) {
        return this.updateElement(index, "disabled", Boolean(disabled));
    }

    setTextFieldValue(index, value) {
        return this.updateElement(index, "text", String(value));
    }

    setToggleValue(index, value) {
        return this.updateElement(index, "toggled", Boolean(value));
    }

    setSliderValue(index, value) {
        return this.updateElement(index, "value", Number(value));
    }

    setDropdownValue(index, value) {
        return this.updateElement(index, "value", Number(value));
    }

    setLabelText(index, text) {
        return this.updateElement(index, "text", String(text));
    }

    setButtonLabel(index, label) {
        return this.updateElement(index, "label", String(label));
    }

    setTitle(title) {
        this.title = String(title);

        if (this.isShown) {
            ddui.setPropertyPath(
                this.player,
                "minecraft",
                "custom_form_data",
                "title",
                this.title
            );
        }

        return this;
    }

    getElement(index) {
        if (index < 0 || index >= this.layout.length) {
            throw new Error(`無効なインデックス: ${index}`);
        }
        return this.layout[index];
    }

    rebuild() {
        if (!this.isShown) {
            throw new Error("フォームが表示されていません");
        }

        const formattedLayout = {
            length: this.layout.length
        };
        this.layout.forEach((item, i) => {
            formattedLayout[i] = item;
        });

        const formData = {
            title: this.title,
            layout: formattedLayout,
            closeButton: {
                label: "閉じる",
                button_visible: true,
                onClick: 0
            }
        };

        ddui.setProperty(this.player, "minecraft", "custom_form_data", JSON.stringify(formData));

        return this;
    }

    show(title = "Custom Form", showCloseButton = true, onClose = null) {
        this.title = String(title);
        this.isShown = true;

        const formattedLayout = {
            length: this.layout.length
        };
        this.layout.forEach((item, i) => {
            formattedLayout[i] = item;
        });

        const formData = {
            title: this.title,
            layout: formattedLayout,
            closeButton: {
                label: "閉じる",
                button_visible: true,
                onClick: 0
            }
        };

        ddui.setProperty(this.player, "minecraft", "custom_form_data", JSON.stringify(formData));

        this.callbacks.forEach((callback, path) => {
            ddui.setClientWritable(this.player, "minecraft", "custom_form_data", path, true);

            const subscription = ddui.subscribe(
                this.player,
                "minecraft",
                "custom_form_data",
                path,
                (value) => {
                    if (path.endsWith(".onClick")) {
                        const n = Number(value);
                        if (n <= 0) return;

                        ddui.setPropertyPath(
                            this.player,
                            "minecraft",
                            "custom_form_data",
                            path,
                            0
                        );

                        callback(this.player, this);
                    } else {
                        let parsedValue = value;

                        if (typeof value === 'string') {
                            const trimmed = value.trim();

                            if (trimmed === 'true') {
                                parsedValue = true;
                            } else if (trimmed === 'false') {
                                parsedValue = false;
                            } else {
                                const num = Number(trimmed);
                                if (!isNaN(num)) {
                                    parsedValue = num;
                                } else {
                                    parsedValue = trimmed;
                                }
                            }
                        }

                        callback(parsedValue, this.player, this);
                    }
                }
            );
            this.subscriptions.push(subscription);
        });

        if (showCloseButton) {
            ddui.setClientWritable(this.player, "minecraft", "custom_form_data", "closeButton.onClick", true);

            const closeSubscription = ddui.subscribe(
                this.player,
                "minecraft",
                "custom_form_data",
                "closeButton.onClick",
                (value) => {
                    const n = Number(value);
                    if (n <= 0) return;

                    ddui.setPropertyPath(
                        this.player,
                        "minecraft",
                        "custom_form_data",
                        "closeButton.onClick",
                        0
                    );

                    this.close();

                    if (onClose) {
                        onClose(this.player);
                    }
                }
            );

            this.subscriptions.push(closeSubscription);
        }

        new DataDrivenScreen().showScreen(this.player, "minecraft:custom_form");
    }

    close() {
        DataDrivenScreen.closeAllScreens(this.player);
        this.isShown = false;
        this.cleanup();
    }

    cleanup() {
        this.subscriptions.forEach(sub => {
            if (sub) ddui.unsubscribe(sub);
        });
        this.subscriptions = [];
    }
}
