// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { auth, db } from '../firebase/firebaseConfig';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import './PageStyles.css'; // General page styling

const RegisterPage = ({ showNotification }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: username });

            // Add user data to Firestore [cite: 17]
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                username: username,
                email: email,
                createdAt: serverTimestamp(),
                // Add default fields like sportsInterest, abilityLevel, location etc.
                sportsInterest: [],
                abilityLevel: '',
                location: ''
            });

            showNotification('Registered successfully! Please login.', 'success');
            console.log('User registered and profile created:', userCredential.user.uid); // Logging 
            navigate('/login'); // Redirect to login page
        } catch (error) {
            console.error('Registration error:', error); // Logging 
            showNotification(`Registration failed: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="auth-page flex-center">
            <div className="auth-form">
                <h3>Register</h3>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
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
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>
                <p className="auth-switch-text">
                    Already have an account? <Link to="/login">Login here</Link>
                </p>
            </div>
        </section>
    );
};

export default RegisterPage;
