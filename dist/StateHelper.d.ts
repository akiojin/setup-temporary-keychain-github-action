export declare class ActionStateHelper {
    static Set(key: string, value: string): void;
    static Get(key: string): string;
}
declare class ActionStateCache {
    #private;
    constructor(key: string);
    GetKey(): string;
}
export declare class StringStateCache extends ActionStateCache {
    constructor(key: string);
    Set(value: string): void;
    Get(): string;
}
export declare class BooleanStateCache extends ActionStateCache {
    constructor(key: string);
    Set(value: Boolean): void;
    Get(): Boolean;
}
export declare class NumberStateCache extends ActionStateCache {
    constructor(key: string);
    Set(value: number): void;
    Get(): number;
}
export {};
