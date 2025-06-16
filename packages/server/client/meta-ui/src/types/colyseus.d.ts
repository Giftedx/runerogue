// Type definitions for Colyseus.js client
declare module 'colyseus.js' {
  export class Client {
    constructor(endpoint: string);
    joinOrCreate<T = any>(roomName: string, options?: any): Promise<Room<T>>;
    join<T = any>(roomName: string, options?: any): Promise<Room<T>>;
    create<T = any>(roomName: string, options?: any): Promise<Room<T>>;
    reconnect<T = any>(roomId: string, sessionId: string): Promise<Room<T>>;
  }

  export class Room<T = any> {
    id: string;
    sessionId: string;
    name: string;
    state: T;

    send(type: string, message?: any): void;
    leave(code?: number): Promise<void>;

    onStateChange(callback: (state: T) => void): void;
    onMessage(type: string, callback: (message: any) => void): void;
    onError(callback: (code: number, message: string) => void): void;
    onLeave(callback: (code: number) => void): void;
  }

  export interface Schema {
    onChange: (callback: (changes: any[]) => void) => void;
    onRemove: (callback: (item: any) => void) => void;
    toJSON(): any;
  }

  export class MapSchema<T = any> implements Schema, Map<string, T> {
    constructor();
    size: number;
    get(key: string): T | undefined;
    has(key: string): boolean;
    set(key: string, value: T): this;
    delete(key: string): boolean;
    clear(): void;
    forEach(callbackfn: (value: T, key: string, map: Map<string, T>) => void, thisArg?: any): void;
    entries(): IterableIterator<[string, T]>;
    keys(): IterableIterator<string>;
    values(): IterableIterator<T>;
    [Symbol.iterator](): IterableIterator<[string, T]>;
    readonly [Symbol.toStringTag]: string;
    onChange(callback: (changes: any[]) => void): void;
    onRemove(callback: (item: any) => void): void;
    toJSON(): any;
  }

  export class ArraySchema<T = any> implements Schema, Array<T> {
    constructor(...items: T[]);
    length: number;
    push(...items: T[]): number;
    pop(): T | undefined;
    shift(): T | undefined;
    unshift(...items: T[]): number;
    indexOf(searchElement: T, fromIndex?: number): number;
    lastIndexOf(searchElement: T, fromIndex?: number): number;
    every<S extends T>(
      predicate: (value: T, index: number, array: T[]) => value is S,
      thisArg?: any
    ): this is S[];
    every(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: any): boolean;
    some(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: any): boolean;
    forEach(callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any): void;
    map<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): U[];
    filter<S extends T>(
      predicate: (value: T, index: number, array: T[]) => value is S,
      thisArg?: any
    ): S[];
    filter(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: any): T[];
    reduce(
      callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T
    ): T;
    reduce(
      callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T,
      initialValue: T
    ): T;
    reduce<U>(
      callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U,
      initialValue: U
    ): U;
    reduceRight(
      callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T
    ): T;
    reduceRight(
      callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T,
      initialValue: T
    ): T;
    reduceRight<U>(
      callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U,
      initialValue: U
    ): U;
    find<S extends T>(
      predicate: (this: void, value: T, index: number, obj: T[]) => value is S,
      thisArg?: any
    ): S | undefined;
    find(predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: any): T | undefined;
    findIndex(predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: any): number;
    fill(value: T, start?: number, end?: number): this;
    copyWithin(target: number, start: number, end?: number): this;
    splice(start: number, deleteCount?: number): T[];
    splice(start: number, deleteCount: number, ...items: T[]): T[];
    slice(start?: number, end?: number): T[];
    sort(compareFn?: (a: T, b: T) => number): this;
    reverse(): T[];
    concat(...items: ConcatArray<T>[]): T[];
    concat(...items: (T | ConcatArray<T>)[]): T[];
    includes(searchElement: T, fromIndex?: number): boolean;
    join(separator?: string): string;
    toString(): string;
    toLocaleString(): string;
    [Symbol.iterator](): IterableIterator<T>;
    [index: number]: T;
    onChange(callback: (changes: any[]) => void): void;
    onRemove(callback: (item: any) => void): void;
    toJSON(): any;
  }
}
