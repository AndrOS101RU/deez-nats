export type Req = {
    id: string;
    statementId: 'userById' | 'ordersByUser' | 'logUserActivity';
    params: any;
};

export type Res = {
    id: string;
    ok: boolean;
    rows: any;
    error: string | null;
    elapsedMs: number;
};
