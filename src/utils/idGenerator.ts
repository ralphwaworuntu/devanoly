export const generateId = (): string => {
    // Try to use crypto.randomUUID if available (most modern browsers)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    
    // Fallback for older browsers or non-secure contexts
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};
