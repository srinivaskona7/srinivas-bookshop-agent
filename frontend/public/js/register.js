const API_BASE = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    if (token) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(registerForm);
        const userData = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
            passwordHint: formData.get('passwordHint')
        };
        
        const submitButton = registerForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        
        try {
            submitButton.textContent = 'Creating Account...';
            submitButton.disabled = true;
            
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                console.log('✅ Registration successful');
                alert('Account created successfully! Please sign in.');
                
                // Redirect to login page (DO NOT auto-login)
                window.location.href = 'login.html';
            } else {
                throw new Error(data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('❌ Registration error:', error);
            alert(error.message || 'Registration failed. Please try again.');
        } finally {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    });
});