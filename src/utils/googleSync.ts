import { AppConfig, Borrower, LoanTransaction } from '../types';

export const syncToGoogleSheets = async (
    scriptUrl: string,
    data: { borrowers: Borrower[]; transactions: LoanTransaction[]; config: AppConfig }
) => {
    if (!scriptUrl) return;

    try {
        // We use 'no-cors' mode because Google Apps Script Web App default CORS policy might block direct access from some origins,
        // BUT 'no-cors' treats the response as opaque and we can't read it.
        // However, for fire-and-forget logging/backup, it might be enough if the script is set up correctly (Accessible by Anyone).
        // Actually, if "Anyone" access is set, standard CORS usually works or we can use JSONP (but fetch is better).
        // Let's try standard POST. If CORS fails, we might need a distinct approach.
        // Standard approach for GAS: POST with text/plain (to avoid preflight) and handle JSON parsing in script.

        const payload = JSON.stringify({
            timestamp: new Date().toISOString(),
            type: 'FULL_BACKUP',
            data: data
        });

        await fetch(scriptUrl, {
            method: 'POST',
            mode: 'no-cors', // Essential for GAS Web Apps usually, unless user handles OPTIONS
            headers: {
                'Content-Type': 'text/plain', // Avoids preflight
            },
            body: payload
        });

        console.log('Sync initialized...');
        return true;
    } catch (error) {
        console.error('Google Sheets Sync Error:', error);
        return false;
    }
};
