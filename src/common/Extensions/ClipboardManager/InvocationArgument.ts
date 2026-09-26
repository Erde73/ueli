export type InvocationArgument =
    | { type: "getAll" }
    | { type: "add"; name: string; content: string }
    | { type: "update"; id: number; name: string; content: string }
    | { type: "delete"; id: number };
