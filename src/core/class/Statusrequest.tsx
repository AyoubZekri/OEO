export const Statusrequest = {
    none: 0,
    loadeng: 1,
    success: 2,
    failure: 3,
    serverfailure: 4,
    serverExption: 5,
    offlinefailure: 6,
} as const;

export type Statusrequest = (typeof Statusrequest)[keyof typeof Statusrequest];
