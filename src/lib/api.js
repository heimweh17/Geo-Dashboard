const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const buildAuthHeaders = (token) => ({
	Authorization: `Bearer ${token}`,
});

export async function login(email, password) {
	const body = new URLSearchParams();
	body.set('username', email);
	body.set('password', password);

	const res = await fetch(`${API_BASE}/auth/login`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body,
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || 'Login failed');
	}
	return res.json();
}

export async function register(email, password) {
	const res = await fetch(`${API_BASE}/auth/register`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ email, password }),
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || 'Registration failed');
	}
	return res.json();
}

export async function me(token) {
	const res = await fetch(`${API_BASE}/auth/me`, {
		headers: buildAuthHeaders(token),
	});
	if (!res.ok) {
		throw new Error('Unauthorized');
	}
	return res.json();
}

export async function uploadDataset(token, file) {
	const form = new FormData();
	form.append('file', file);
	const res = await fetch(`${API_BASE}/datasets/upload`, {
		method: 'POST',
		headers: buildAuthHeaders(token),
		body: form,
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || 'Upload failed');
	}
	return res.json();
}

export async function analyzeDataset(token, datasetId, params) {
	const res = await fetch(`${API_BASE}/analysis/${datasetId}/analyze`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...buildAuthHeaders(token),
		},
		body: JSON.stringify(params),
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || 'Analysis failed');
	}
	return res.json();
}

// Saved Places endpoints
export async function listPlaces(token) {
	const res = await fetch(`${API_BASE}/places/`, {
		headers: buildAuthHeaders(token),
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || 'Failed to fetch places');
	}
	return res.json();
}

export async function createPlace(token, payload) {
	const res = await fetch(`${API_BASE}/places/`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...buildAuthHeaders(token),
		},
		body: JSON.stringify(payload),
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || 'Failed to create place');
	}
	return res.json();
}

export async function updatePlace(token, placeId, payload) {
	const res = await fetch(`${API_BASE}/places/${placeId}`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			...buildAuthHeaders(token),
		},
		body: JSON.stringify(payload),
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || 'Failed to update place');
	}
	return res.json();
}

export async function deletePlace(token, placeId) {
	const res = await fetch(`${API_BASE}/places/${placeId}`, {
		method: 'DELETE',
		headers: buildAuthHeaders(token),
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || 'Failed to delete place');
	}
	return;
}

export const api = {
	login,
	register,
	me,
	uploadDataset,
	analyzeDataset,
	listPlaces,
	createPlace,
	updatePlace,
	deletePlace,
	buildAuthHeaders,
	API_BASE,
};


