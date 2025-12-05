export interface Order {
    id: string;
    invoice_number: string;
    product_id: string;
    product_name: string;
    package_name: string;
    package_price: number;

    // Customer Info
    customer_name: string;
    customer_email: string;
    customer_phone: string;

    // Package Details (from selected package)
    package_details: {
        undangan: string;
        foto: string;
        video: string;
        share: string;
    };

    // Pricing
    subtotal: number;
    discount_code?: string;
    discount_amount: number;
    tax: number;
    total: number;

    // Payment
    payment_method: string;
    payment_bank?: string;
    payment_status: 'pending' | 'in_progress' | 'paid' | 'expired' | 'cancelled';
    payment_proof_url?: string;
    payment_deadline: string;
    paid_at?: string;

    created_at: string;
    updated_at: string;
}

export interface PaymentMethod {
    id: string;
    type: 'bank' | 'ewallet';
    name: string;
    account_number: string;
    account_name: string;
    is_active: boolean;
}
