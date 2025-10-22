// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { auth } from '../firebase/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import './PageStyles.css'; // General page styling

const LoginPage = ({ showNotification }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            showNotification('Logged in successfully!', 'success');
            console.log('User logged in:', auth.currentUser.uid); // Logging 
            navigate('/profile'); // Redirect to profile or home
        } catch (error) {
            console.error('Login error:', error); // Logging 
            showNotification(`Login failed: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="auth-page flex-center">
            <div className="auth-form">
                <h3>Login</h3>
                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Logging In...' : 'Login'}
                    </button>
                </form>
                <p className="auth-switch-text">
                    Don't have an account? <Link to="/register">Register here</Link>
                </p>
            </div>
        </section>
    );
};

export default LoginPage;
