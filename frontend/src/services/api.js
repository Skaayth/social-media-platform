const API_URL = import.meta.env.VITE_API_URL || 
                (import.meta.env.MODE === 'production' 
                  ? 'https://sakethbook-356304ecb26f.herokuapp.com' 
                  : 'http://localhost:3000');
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('authToken');
  const isFormData = options.body instanceof FormData;
  
  const config = {
    ...options,
    credentials: 'include',
  };
  
  if (isFormData) {
    config.headers = options.headers || {};
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  } else {
    config.headers = {
      ...options.headers,
    };
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (options.body && typeof options.body === 'string') {
      config.headers['Content-Type'] = 'application/json';
    }
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

// Authentication
export async function register(userData) {
  const response = await apiFetch('/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
  
  if (response.result === 'success' && userData.password) {
    const loginResponse = await login(userData.username, userData.password);
    return loginResponse;
  }
  
  return response;
}

export async function login(username, password) {
  const response = await apiFetch('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  
  if (response.token) {
    localStorage.setItem('authToken', response.token);
  }
  
  return response;
}

export async function logout() {
  const response = await apiFetch('/logout', {
    method: 'PUT'
  });
  
  localStorage.removeItem('authToken');
  return response;
}

// Articles
export async function fetchArticles(page = 1) {
  return apiFetch(`/articles?page=${page}`);
}

export async function fetchArticlesByUser(username) {
  return apiFetch(`/articles/${username}`);
}

export async function createArticle(text, imageFile = null) {
  if (imageFile) {
    const formData = new FormData();
    formData.append('text', text);
    formData.append('image', imageFile);
    
    return apiFetch('/article', {
      method: 'POST',
      body: formData
    });
  } else {
    return apiFetch('/article', {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  }
}

export async function updateArticle(articleId, text) {
  return apiFetch(`/articles/${articleId}`, {
    method: 'PUT',
    body: JSON.stringify({ text })
  });
}

export async function addComment(articleId, text) {
  return apiFetch(`/articles/${articleId}`, {
    method: 'PUT',
    body: JSON.stringify({ text, commentId: -1 })
  });
}

export async function updateComment(articleId, commentId, text) {
  return apiFetch(`/articles/${articleId}`, {
    method: 'PUT',
    body: JSON.stringify({ text, commentId })
  });
}

// Profile
export async function fetchHeadline(username = null) {
  const endpoint = username ? `/headline/${username}` : '/headline';
  return apiFetch(endpoint);
}

export async function updateHeadline(headline) {
  return apiFetch('/headline', {
    method: 'PUT',
    body: JSON.stringify({ headline })
  });
}

export async function fetchAvatar(username = null) {
  const endpoint = username ? `/avatar/${username}` : '/avatar';
  return apiFetch(endpoint);
}

export async function updateAvatar(imageFile) {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  return apiFetch('/avatar', {
    method: 'PUT',
    body: formData
  });
}

export async function fetchEmail(username = null) {
  const endpoint = username ? `/email/${username}` : '/email';
  return apiFetch(endpoint);
}

export async function updateEmail(email) {
  return apiFetch('/email', {
    method: 'PUT',
    body: JSON.stringify({ email })
  });
}

export async function fetchZipcode(username = null) {
  const endpoint = username ? `/zipcode/${username}` : '/zipcode';
  return apiFetch(endpoint);
}

export async function updateZipcode(zipcode) {
  return apiFetch('/zipcode', {
    method: 'PUT',
    body: JSON.stringify({ zipcode })
  });
}

export async function fetchPhone(username = null) {
  const endpoint = username ? `/phone/${username}` : '/phone';
  return apiFetch(endpoint);
}

export async function updatePhone(phone) {
  return apiFetch('/phone', {
    method: 'PUT',
    body: JSON.stringify({ phone })
  });
}

export async function updatePassword(password) {
  return apiFetch('/password', {
    method: 'PUT',
    body: JSON.stringify({ password })
  });
}

// Following
export async function fetchFollowing(username = null) {
  const endpoint = username ? `/following/${username}` : '/following';
  return apiFetch(endpoint);
}

export async function addFollowing(username) {
  return apiFetch(`/following/${username}`, {
    method: 'PUT'
  });
}

export async function removeFollowing(username) {
  return apiFetch(`/following/${username}`, {
    method: 'DELETE'
  });
}

// Account Linking
export async function getLinkedAccounts() {
  return apiFetch('/link/accounts');
}

export async function linkPasswordAccount(username, password) {
  return apiFetch('/link/password', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}

export async function linkOAuthAccount(oauthUsername) {
  return apiFetch('/link/oauth', {
    method: 'POST',
    body: JSON.stringify({ oauthUsername })
  });
}

export async function unlinkProvider(provider) {
  return apiFetch(`/link/${provider}`, {
    method: 'DELETE'
  });
}

// OAuth
export function initiateGoogleLogin() {
  window.location.href = `${API_URL}/auth/google`;
}

export async function checkAuthStatus() {
  return apiFetch('/auth/status');
}

// Export API_URL for reference
export { API_URL };
