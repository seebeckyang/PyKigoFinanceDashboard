export interface Expense {
    id: string;
    date: string; // YYYY-MM-DD
    store_name: string;
    amount: number;
    currency: string;
    category_id?: string;
    project_label: string;
    goal_id?: string;
    paid_by: string;   // 'CY', 'HY'
    paid_for: string;  // 'Both', 'CY', 'HY'
    is_reviewed: boolean;
    is_automated: boolean;
    is_duplicate: boolean;
    einvoice_id?: string;
    metadata?: any;
    categories?: ExpenseCategory;
    created_at: string;
}

export interface ExpenseCategory {
    id: string;
    name: string;
    icon?: string;
    color?: string;
}

export interface AASettlement {
    total_cy_paid: number;
    total_hy_paid: number;
    cy_owes_hy: number;
    hy_owes_cy: number;
    net_settlement: {
        from: string;
        to: string;
        amount: number;
    };
}
export interface Settlement {
    id: string;
    settlement_date: string;
    amount: number;
    payer: string;   // 'CY', 'HY'
    payee: string;   // 'CY', 'HY'
    project_label: string;
    goal_id?: string;
    notes?: string;
    created_at: string;
}
