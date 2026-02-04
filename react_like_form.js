import { CustomForm, Observable } from "@minecraft/server-ui";
import { system } from "@minecraft/server";

/**
 * Registers an interval that is automatically cleaned up.
 * This is NOT reactive – it runs immediately.
 *
 * @param {() => void} callback - Function executed every tick interval
 * @param {number} tick - Interval in ticks
 * @returns {() => void} Cleanup function
 */
export function useInterval(callback, tick) {
    const id = system.runInterval(callback, tick);

    return () => {
        system.clearRun(id);
    };
}

/**
 * Runs a side effect and re-runs it when any dependency Observable changes.
 * Similar to React's useEffect, but:
 * - Runs immediately on registration
 * - Depends ONLY on Observable subscriptions
 * - Does NOT trigger re-render
 *
 * @template T
 * @param {() => (void | (() => void))} effect - Side-effect function
 * @param {Observable<T>[]} deps - Observable dependencies
 * @returns {() => void} Cleanup function
 */
export function useEffect(effect, deps = []) {
    let cleanup = null;

    /**
     * Executes effect and handles previous cleanup.
     */
    const run = () => {
        if (cleanup) cleanup();
        cleanup = effect() ?? null;
    };

    const unsubscribes = deps.map(dep =>
        dep.subscribe(run)
    );

    // Initial execution
    run();

    return () => {
        if (cleanup) cleanup();
        for (let i = 0; i < deps.length; i++) {
            depSafeUnsub(deps[i], unsubscribes[i]);
        }
    };
}

/**
 * Safely unsubscribe from an Observable.
 *
 * @param {Observable<any>} dep
 * @param {(v:any)=>void} fn
 */
function depSafeUnsub(dep, fn) {
    try {
        dep.unsubscribe(fn);
    } catch {
        // ignore – Observable might already be disposed
    }
}

/**
 * Creates a reactive state backed by Observable.
 *
 * IMPORTANT:
 * - State updates DO NOT cause re-render
 * - UI must be bound to the returned Observable
 *
 * @template T
 * @param {T} initial
 * @returns {[() => T, (v:T)=>void, Observable<T>]}
 */
export function useState(initial) {
    const obs = Observable.create(initial);

    const get = () => obs.getData();
    const set = (v) => obs.setData(v);

    return [get, set, obs];
}

/**
 * React-like form controller for Minecraft CustomForm.
 *
 * LIMITATIONS:
 * - Render is executed only once per mount
 * - UI structure is immutable after show()
 * - State updates affect only Observable-bound values
 *
 * This class emulates React's lifecycle model under strict UI constraints.
 */
export class ReactLikeForm {
    /** @type {import("@minecraft/server").Player} */
    player;

    /** @type {Observable<string>} */
    title;

    /**
     * @type {(form: CustomForm, registerCleanup: (fn:()=>void)=>void) => void}
     */
    render;

    /** @type {Array<() => void>} */
    cleanups = [];

    /**
     * @param {import("@minecraft/server").Player} player
     * @param {string} title
     * @param {(form: CustomForm, registerCleanup:(fn:()=>void)=>void)=>void} render
     */
    constructor(player, title, render) {
        this.player = player;
        this.title = Observable.create(title);
        this.render = render;
    }

    /**
     * Mounts and shows the form.
     * Executes render phase once, then applies effects.
     *
     * @returns {Promise<void>}
     */
    mount() {
        const form = CustomForm.create(this.player, this.title);

        /**
         * Registers a cleanup function to be executed on unmount.
         *
         * @param {() => void} fn
         */
        const registerCleanup = (fn) => {
            if (typeof fn === "function") {
                this.cleanups.push(fn);
            }
        };

        // render phase
        this.render(form, registerCleanup);

        return form.show();
    }

    /**
     * Unmounts the form and runs all registered cleanup functions.
     */
    unmount() {
        for (const fn of this.cleanups) {
            try { fn(); } catch { }
        }
        this.cleanups = [];
    }

    /**
     * Forces full teardown and rebuild of the form.
     * Use this ONLY when UI structure must change.
     */
    remount() {
        this.unmount();
        this.mount();
    }
}
