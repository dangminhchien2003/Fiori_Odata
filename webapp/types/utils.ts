export type Dict<T = any> = { [key: string]: T };

export interface ComponentData {
  startupParameters: Dict<string>;
}

export type LiteralUnion<T, U extends string = string> = T | (U & Record<never, never>);
