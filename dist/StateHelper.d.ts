declare class Environement {
    #private;
    constructor(key: string);
    GetKey(): string;
}
export declare class StringStateCache extends Environement {
    constructor(key: string);
    Set(value: string): void;
    Get(): string;
}
export declare class BooleanStateCache extends Environement {
    constructor(key: string);
    Set(value: Boolean): void;
    Get(): Boolean;
}
export declare class NumberStateCache extends Environement {
    constructor(key: string);
    Set(value: number): void;
    Get(): number;
}
export {};
