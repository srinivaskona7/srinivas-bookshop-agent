const API_BASE = 'http://localhost:5000/api';
let currentUser = null;
let allUsers = [];
let cropper = null;

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    // Get current user data
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        currentUser = JSON.parse(userData);
        updateUserInterface();
    }
    
    // Initialize the dashboard
    initializeDashboard();
});

async function initializeDashboard() {
    try {
        // Load current user data
        await loadCurrentUser();
        
        // Load books
        await loadBooks();
        
        // Start health monitoring
        startHealthMonitoring();
        
        // Setup event listeners
        setupEventListeners();
        
        // Load admin data if user is admin
        if (currentUser && currentUser.role === 'admin') {
            await loadUsers();
        }
        
        console.log('✅ Dashboard initialized successfully');
    } catch (error) {
        console.error('❌ Dashboard initialization error:', error);
        alert('Failed to load dashboard. Please refresh the page.');
    }
}

function updateUserInterface() {
    if (!currentUser) return;
    
    // Update user info in navbar
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    
    userName.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
    
    if (currentUser.profileImageUrl) {
        userAvatar.src = `${API_BASE.replace('/api', '')}${currentUser.profileImageUrl}`;
    }
    
    // Show admin buttons if user is admin
    if (currentUser.role === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'block';
        });
    }
}

async function loadCurrentUser() {
    try {
        const response = await fetch(`${API_BASE}/users/me`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (response.ok) {
            currentUser = await response.json();
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateUserInterface();
        } else {
            throw new Error('Failed to load user data');
        }
    } catch (error) {
        console.error('❌ Load user error:', error);
        if (error.message.includes('401') || error.message.includes('403')) {
            logout();
        }
    }
}

async function loadBooks() {
    try {
        const response = await fetch(`${API_BASE}/books`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (response.ok) {
            const books = await response.json();
            displayBooks(books);
        } else {
            throw new Error('Failed to load books');
        }
    } catch (error) {
        console.error('❌ Load books error:', error);
        document.getElementById('booksGrid').innerHTML = 'Failed to load books.';
    }
}

function displayBooks(books) {
    const booksGrid = document.getElementById('booksGrid');
    
    if (books.length === 0) {
        booksGrid.innerHTML = 'No books available yet.';
        return;
    }
    
    booksGrid.innerHTML = books.map(book => `
        <div class="book-card">
            <img src="${API_BASE.replace('/api', '')}${book.coverImageUrl}" alt="${book.title}" class="book-cover">
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">by ${book.author}</p>
                <p class="book-description">${book.description}</p>
                <div class="book-footer">
                    <span class="book-price">$${book.price.toFixed(2)}</span>
                    <button onclick="viewBook('${book.bookFileUrl}')" class="book-view-btn">View PDF</button>
                </div>
            </div>
        </div>
    `).join('');
}

function viewBook(bookFileUrl) {
    const fullUrl = `${API_BASE.replace('/api', '')}${bookFileUrl}`;
    window.open(fullUrl, '_blank');
}

async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE}/admin/users`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (response.ok) {
            allUsers = await response.json();
            displayUsers(allUsers);
            populateUserSelect();
        } else {
            throw new Error('Failed to load users');
        }
    } catch (error) {
        console.error('❌ Load users error:', error);
    }
}

function displayUsers(users) {
    const usersTableBody = document.getElementById('usersTableBody');
    
    usersTableBody.innerHTML = users.map(user => `
        <tr>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

function populateUserSelect() {
    const userSelect = document.getElementById('userSelect');
    
    userSelect.innerHTML = '<option value="">Choose a user...</option>' +
        allUsers.map(user => `
            <option value="${user._id}">${user.username} (${user.email})</option>
        `).join('');
}

function setupEventListeners() {
    // Navigation buttons
    document.getElementById('rolesBtn')?.addEventListener('click', () => showPanel('rolesPanel'));
    document.getElementById('addBookBtn')?.addEventListener('click', () => showPanel('addBookPanel'));
    document.getElementById('allUsersBtn')?.addEventListener('click', () => showPanel('allUsersPanel'));
    
    // User info click to open profile modal
    document.getElementById('userInfo').addEventListener('click', openProfileModal);
    
    // Profile modal events
    document.getElementById('closeModal').addEventListener('click', closeProfileModal);
    document.getElementById('changePhotoBtn').addEventListener('click', () => {
        document.getElementById('avatarInput').click();
    });
    
    document.getElementById('avatarInput').addEventListener('change', handleAvatarSelect);
    document.getElementById('savePhotoBtn').addEventListener('click', savePhoto);
    document.getElementById('cancelCropBtn').addEventListener('click', cancelCrop);
    document.getElementById('profileForm').addEventListener('submit', updateProfile);
    
    // Admin form events
    document.getElementById('updateRoleBtn')?.addEventListener('click', updateUserRole);
    document.getElementById('addBookForm')?.addEventListener('submit', addBook);
    
    // User search
    document.getElementById('userSearch')?.addEventListener('input', handleUserSearch);

    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    
    // User select change
    document.getElementById('userSelect')?.addEventListener('change', handleUserSelectChange);
    
    // Modal overlay click to close
    document.getElementById('profileModal').addEventListener('click', function(e) {
        if (e.target === this) closeProfileModal();
    });
}

function showPanel(panelId) {
    // Hide all panels
    document.querySelectorAll('.admin-panel').forEach(panel => {
        panel.style.display = 'none';
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected panel
    document.getElementById(panelId).style.display = 'block';
    
    // Add active class to clicked button
    const buttonMap = {
        'rolesPanel': 'rolesBtn',
        'addBookPanel': 'addBookBtn', 
        'allUsersPanel': 'allUsersBtn'
    };
    
    document.getElementById(buttonMap[panelId])?.classList.add('active');
    
    // Show welcome section if no admin panel is active
    const welcomeSection = document.getElementById('welcomeSection');
    const anyPanelVisible = Array.from(document.querySelectorAll('.admin-panel'))
        .some(panel => panel.style.display === 'block');
    
    welcomeSection.style.display = anyPanelVisible ? 'none' : 'block';
}

function openProfileModal() {
    const modal = document.getElementById('profileModal');
    const profileAvatar = document.getElementById('profileAvatar');
    
    // Populate current user data
    document.getElementById('profileFirstName').value = currentUser.firstName || '';
    document.getElementById('profileLastName').value = currentUser.lastName || '';
    document.getElementById('profileEmail').value = currentUser.email || '';
    document.getElementById('profilePasswordHint').value = currentUser.passwordHint || '';
    
    if (currentUser.profileImageUrl) {
        profileAvatar.src = `${API_BASE.replace('/api', '')}${currentUser.profileImageUrl}`;
    }
    
    modal.style.display = 'block';
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    modal.style.display = 'none';
    
    // Clean up cropper if exists
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    
    // Hide cropper container
    document.getElementById('cropperContainer').style.display = 'none';
}

function handleAvatarSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const cropperImage = document.getElementById('cropperImage');
        cropperImage.src = e.target.result;
        
        // Show cropper container
        document.getElementById('cropperContainer').style.display = 'block';
        
        // Initialize cropper
        cropper = new Cropper(cropperImage, {
            aspectRatio: 1,
            viewMode: 1,
            guides: false,
            center: false,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
        });
    };
    
    reader.readAsDataURL(file);
}

async function savePhoto() {
    if (!cropper) return;
    
    try {
        const canvas = cropper.getCroppedCanvas({
            width: 200,
            height: 200,
            imageSmoothingQuality: 'high'
        });
        
        canvas.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append('profileImage', blob, 'avatar.png');
            
            const response = await fetch(`${API_BASE}/users/me`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: formData
            });
            
            if (response.ok) {
                const updatedUser = await response.json();
                currentUser = updatedUser;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                // Update all avatar images
                const newAvatarUrl = `${API_BASE.replace('/api', '')}${updatedUser.profileImageUrl}`;
                document.getElementById('userAvatar').src = newAvatarUrl;
                document.getElementById('profileAvatar').src = newAvatarUrl;
                
                console.log('✅ Profile photo updated');
                cancelCrop();
            } else {
                throw new Error('Failed to update profile photo');
            }
        }, 'image/png', 0.9);
    } catch (error) {
        console.error('❌ Save photo error:', error);
        alert('Failed to save photo. Please try again.');
    }
}

function cancelCrop() {
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    
    document.getElementById('cropperContainer').style.display = 'none';
    document.getElementById('avatarInput').value = '';
}

async function updateProfile(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const updateData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        passwordHint: formData.get('passwordHint')
    };
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    
    try {
        submitButton.textContent = 'Saving...';
        submitButton.disabled = true;
        
        const response = await fetch(`${API_BASE}/users/me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
            const updatedUser = await response.json();
            currentUser = updatedUser;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateUserInterface();
            
            console.log('✅ Profile updated');
            alert('Profile updated successfully!');
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update profile');
        }
    } catch (error) {
        console.error('❌ Update profile error:', error);
        alert(error.message || 'Failed to update profile');
    } finally {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

function handleUserSelectChange(e) {
    const userId = e.target.value;
    const user = allUsers.find(u => u._id === userId);
    if (user) {
        document.getElementById('roleSelect').value = user.role;
    }
}

async function updateUserRole() {
    const userId = document.getElementById('userSelect').value;
    const newRole = document.getElementById('roleSelect').value;
    if (!userId) {
        alert('Please select a user');
        return;
    }
    const button = document.getElementById('updateRoleBtn');
    const originalText = button.textContent;
    try {
        button.textContent = 'Updating...';
        button.disabled = true;
        const response = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ role: newRole })
        });
        if (response.ok) {
            console.log('✅ User role updated');
            alert('User role updated successfully!');
            await loadUsers();
            document.getElementById('userSelect').value = '';
            document.getElementById('roleSelect').value = 'user';
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update user role');
        }
    } catch (error) {
        console.error('❌ Update role error:', error);
        alert(error.message || 'Failed to update user role');
    } finally {
        button.textContent = originalText;
        button.disabled = false;
    }
}

async function addBook(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    try {
        submitButton.textContent = 'Adding Book...';
        submitButton.disabled = true;
        const response = await fetch(`${API_BASE}/admin/books`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: formData
        });
        if (response.ok) {
            console.log('✅ Book added successfully');
            alert('Book added successfully!');
            e.target.reset();
            await loadBooks();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add book');
        }
    } catch (error) {
        console.error('❌ Add book error:', error);
        alert(error.message || 'Failed to add book');
    } finally {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

function handleUserSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filteredUsers = allUsers.filter(user => 
        user.username.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
    );
    displayUsers(filteredUsers);
}

function startHealthMonitoring() {
    const healthBadge = document.getElementById('healthBadge');
    async function checkHealth() {
        try {
            const response = await fetch(`${API_BASE}/health`, {
                timeout: 5000
            });
            if (response.ok) {
                healthBadge.className = 'health-badge healthy';
                healthBadge.textContent = '🟢';
                healthBadge.title = 'Backend is healthy';
            } else {
                throw new Error('Health check failed');
            }
        } catch (error) {
            healthBadge.className = 'health-badge unhealthy';
            healthBadge.textContent = '🔴';
            healthBadge.title = 'Backend is unreachable';
            console.warn('⚠️  Health check failed:', error.message);
        }
    }
    checkHealth();
    setInterval(checkHealth, 10000);
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Global error handlers
window.addEventListener('error', (event) => {
    console.error('❌ Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Unhandled promise rejection:', event.reason);
});