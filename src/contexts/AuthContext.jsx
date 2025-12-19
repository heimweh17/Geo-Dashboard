import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [token, setToken] = useState(null);
	const [loading, setLoading] = useState(true);

  useEffect(() => {
		const stored = localStorage.getItem('geo_token');
		if (stored) {
			setToken(stored);
			api.me(stored)
				.then((u) => setUser(u))
				.catch(() => {
					localStorage.removeItem('geo_token');
					setUser(null);
					setToken(null);
				})
				.finally(() => setLoading(false));
		} else {
			setLoading(false);
		}
  }, []);

	// Sign up with email/password (no email verification flow)
	const signUp = async (email, password) => {
		return api.register(email, password);
	};

	// Sign in with email/password
	const signIn = async (email, password) => {
		const data = await api.login(email, password);
		const t = data?.access_token;
		if (!t) throw new Error('No token returned');
		localStorage.setItem('geo_token', t);
		setToken(t);
		const u = await api.me(t);
		setUser(u);
		return u;
	};

  // Sign in with Google
  const signInWithGoogle = async () => {
		throw new Error('Google sign-in is not supported.');
  };

  // Sign out
  const signOut = async () => {
		localStorage.removeItem('geo_token');
		setUser(null);
		setToken(null);
  };

  const value = {
		user,
		token,
		isAuthed: !!token,
		loading,
		signUp,
		signIn,
		signInWithGoogle,
		signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};