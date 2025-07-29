// Enhanced fetch wrapper with comprehensive logging
const originalFetch = window.fetch;

window.fetch = async function(url, options = {}) {
    const startTime = performance.now();
    const requestId = Math.random().toString(36).substr(2, 9);
    
    // Log request
    console.group(`🚀 Request [${requestId}]`);
    console.log('Method:', options.method || 'GET');
    console.log('URL:', url);
    console.log('Headers:', options.headers || 'None');
    
    if (options.body && typeof options.body === 'string') {
        try {
            const parsedBody = JSON.parse(options.body);
            console.log('Body:', parsedBody);
        } catch {
            console.log('Body:', options.body.substring(0, 200) + (options.body.length > 200 ? '...' : ''));
        }
    } else if (options.body instanceof FormData) {
        console.log('Body: FormData with entries:');
        for (let [key, value] of options.body.entries()) {
            if (value instanceof File) {
                console.log(`  ${key}: File(${value.name}, ${value.size} bytes)`);
            } else {
                console.log(`  ${key}:`, value);
            }
        }
    }
    
    console.groupEnd();
    
    try {
        const response = await originalFetch(url, options);
        const duration = Math.round(performance.now() - startTime);
        
        // Clone response to read body without consuming it
        const responseClone = response.clone();
        let responseBody;
        
        try {
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                responseBody = await responseClone.json();
            } else {
                const text = await responseClone.text();
                responseBody = text.substring(0, 200) + (text.length > 200 ? '...' : '');
            }
        } catch (error) {
            responseBody = 'Unable to parse response body';
        }
        
        // Log response
        const statusColor = response.ok ? '✅' : '❌';
        console.group(`${statusColor} Response [${requestId}] - ${duration}ms`);
        console.log('Status:', response.status, response.statusText);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));
        console.log('Body:', responseBody);
        console.groupEnd();
        
        return response;
    } catch (error) {
        const duration = Math.round(performance.now() - startTime);
        console.group(`❌ Request Failed [${requestId}] - ${duration}ms`);
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        console.groupEnd();
        
        throw error;
    }
};

// Global error handler
window.addEventListener('error', (event) => {
    console.group('❌ Global Error');
    console.error('Message:', event.message);
    console.error('Source:', event.filename, 'Line:', event.lineno, 'Column:', event.colno);
    console.error('Error:', event.error);
    console.groupEnd();
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.group('❌ Unhandled Promise Rejection');
    console.error('Reason:', event.reason);
    console.error('Promise:', event.promise);
    console.groupEnd();
});

console.log('🔧 Enhanced logging system initialized');