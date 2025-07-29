const API_BASE = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    if (token) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(loginForm);
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
        };
        
        const submitButton = loginForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        
        try {
            submitButton.textContent = 'Signing In...';
            submitButton.disabled = true;
            
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Store auth data
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                console.log('✅ Login successful');
                
                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            } else {
                throw new Error(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            alert(error.message || 'Login failed. Please try again.');
        } finally {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    });
});