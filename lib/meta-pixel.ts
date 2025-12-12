// lib/meta-pixel.ts
// Helper functions for Meta Pixel (Facebook CAPI) tracking
// Note: Pixel ID is now dynamically loaded from database in layout.tsx

declare global {
    interface Window {
        fbq: (...args: any[]) => void;
    }
}

// Track page view (already tracked automatically)
export const trackPageView = () => {
    if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "PageView");
    }
};

export const trackViewContent = (params: {
    content_name: string;
    content_ids?: string[];
    content_type?: string;
    value?: number;
    currency?: string;
}) => {
    if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "ViewContent", {
            content_name: params.content_name,
            content_ids: params.content_ids || [],
            content_type: params.content_type || "product",
            value: params.value || 0,
            currency: params.currency || "IDR",
        });
    }
};

// Track when user adds to cart (selects a package)
export const trackAddToCart = (params: {
    content_name: string;
    content_ids?: string[];
    content_type?: string;
    value: number;
    currency?: string;
}) => {
    if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "AddToCart", {
            content_name: params.content_name,
            content_ids: params.content_ids || [],
            content_type: params.content_type || "product",
            value: params.value,
            currency: params.currency || "IDR",
        });
    }
};

// Track when user initiates checkout
export const trackInitiateCheckout = (params: {
    content_name: string;
    content_ids?: string[];
    content_type?: string;
    value: number;
    currency?: string;
    num_items?: number;
}) => {
    if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "InitiateCheckout", {
            content_name: params.content_name,
            content_ids: params.content_ids || [],
            content_type: params.content_type || "product",
            value: params.value,
            currency: params.currency || "IDR",
            num_items: params.num_items || 1,
        });
    }
};

// Track successful purchase
export const trackPurchase = (params: {
    content_name: string;
    content_ids?: string[];
    content_type?: string;
    value: number;
    currency?: string;
    num_items?: number;
}) => {
    if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "Purchase", {
            content_name: params.content_name,
            content_ids: params.content_ids || [],
            content_type: params.content_type || "product",
            value: params.value,
            currency: params.currency || "IDR",
            num_items: params.num_items || 1,
        });
    }
};

// Track lead/contact form submission
export const trackLead = (params?: {
    content_name?: string;
    content_category?: string;
    value?: number;
    currency?: string;
}) => {
    if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "Lead", {
            content_name: params?.content_name || "Contact Form",
            content_category: params?.content_category || "Contact",
            value: params?.value || 0,
            currency: params?.currency || "IDR",
        });
    }
};

// Track contact event
export const trackContact = () => {
    if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "Contact");
    }
};

// Custom event tracking
export const trackCustomEvent = (eventName: string, params?: Record<string, any>) => {
    if (typeof window !== "undefined" && window.fbq) {
        window.fbq("trackCustom", eventName, params);
    }
};
