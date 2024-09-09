export interface Signal<T = any> {
  value: T;
  peek(): T;
}

export interface Computed<T = any> extends Signal<T> {
  readonly value: T;
}

export declare function SignalFn<T>(value: T): Signal<T>;

export declare function ComputedFn<T>(fn: () => T): Computed<T>;

export type MaybeSignal<T = any> = T | Signal<T>;

export declare function ToValue<T>(value: MaybeSignal<T>): T;

type EffectCleanup = () => void | undefined;

export type EffectFn = (cb: () => EffectCleanup) => () => void;

export type OnScopeDisposeFn = (cb: () => void) => void;
