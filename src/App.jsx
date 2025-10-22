// src/App.jsx
import React, { useState, useEffect, useRef } from 'react'; // Import useRef
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { auth } from './firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

// Import your page components
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import FindBuddyPage from './pages/FindBuddyPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import AddEventPage from './pages/AddEventPage';
import AdminDashboard from './pages/AdminDashboard';
import MyBuddyEventsPage from './pages/MyBuddyEventsPage'; 

// Import component for showing messages (e.g., success/error)
import Notification from './components/Notification';

import './App.css'; // Component-specific CSS for App.jsx

function App() {
    const [user, setUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [notification, setNotification] = useState({ message: '', type: '' });
    const navigate = useNavigate();

    // Create a ref for the main navigation element
    const navRef = useRef(null); //

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoadingAuth(false);
            console.log('Auth state changed:', currentUser ? currentUser.uid : 'Logged out');
        });
        return () => unsubscribe();
    }, []);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    };

    const handleLogout = async () => {
        try {
            await auth.signOut();
            showNotification('Logged out successfully!', 'success');
            navigate('/login');
            // Close the nav menu on logout
            if (navRef.current.classList.contains('active')) { //
                navRef.current.classList.remove('active'); //
            }
            console.log('User logged out.');
        } catch (error) {
            console.error('Logout error:', error);
            showNotification(`Logout failed: ${error.message}`, 'error');
        }
    };

    // New function to close the navigation menu when a link is clicked
    const handleNavLinkClick = () => { //
        if (navRef.current.classList.contains('active')) { //
            navRef.current.classList.remove('active'); //
        }
    };

    if (loadingAuth) {
        return <div className="loading-screen flex-center">Loading authentication...</div>;
    }

    return (
        <div className="app-container">
            <header className="main-header">
                <div className="container">
                    <h1 className="logo"><Link to="/" onClick={handleNavLinkClick}>Sports Buddy</Link></h1> {/* Add onClick here */}
                    <nav className="main-nav" ref={navRef}> {/* Assign the ref here */}
                        <ul className="nav-list">
                            <li><Link to="/" onClick={handleNavLinkClick}>Home</Link></li>
                            <li><Link to="/events" onClick={handleNavLinkClick}>Events</Link></li>
                            <li><Link to="/find-buddy" onClick={handleNavLinkClick}>Find Buddy</Link></li>
                            {user && <li><Link to="/profile" onClick={handleNavLinkClick}>Profile</Link></li>}
                            {user && <li><Link to="/add-event" onClick={handleNavLinkClick}>Add Event</Link></li>}
                            {user && <li><Link to="/my-buddy-events" onClick={handleNavLinkClick}>My Buddy Events</Link></li>}
                            {user && user.email === 'admin@sportsbuddy.com' && <li><Link to="/admin" onClick={handleNavLinkClick}>Admin</Link></li>}
                            <li>
                                {user ? (
                                    <button onClick={handleLogout} className="btn btn-primary">Logout</button>
                                ) : (
                                    <Link to="/login" className="btn-auth" onClick={handleNavLinkClick}>Login/Register</Link>
                                )}
                            </li>
                        </ul>
                    </nav>
                    {/* The hamburger menu click handler */}
                    <div className="hamburger-menu" onClick={() => navRef.current.classList.toggle('active')}> {/* Use ref here */}
                        <div className="bar"></div>
                        <div className="bar"></div>
                        <div className="bar"></div>
                    </div>
                </div>
            </header>

            {notification.message && <Notification message={notification.message} type={notification.type} />}

            <main>
                <Routes>
                    <Route path="/" element={<HomePage user={user} />} />
                    <Route path="/events" element={<EventsPage user={user} showNotification={showNotification} />} />
                    <Route path="/find-buddy" element={<FindBuddyPage currentUser={user} showNotification={showNotification} />} />
                    <Route path="/login" element={<LoginPage showNotification={showNotification} />} />
                    <Route path="/register" element={<RegisterPage showNotification={showNotification} />} />
                    {user ? (
                        <>
                            <Route path="/profile" element={<ProfilePage user={user} showNotification={showNotification} />} />
                            <Route path="/add-event" element={<AddEventPage user={user} showNotification={showNotification} />} />
                            <Route path="/my-buddy-events" element={<MyBuddyEventsPage currentUser={user} showNotification={showNotification} />} />
                            {user.email === 'admin@sportsbuddy.com' && <Route path="/admin" element={<AdminDashboard user={user} showNotification={showNotification} />} />}
                        </>
                    ) : (
                        <Route path="/*" element={<LoginPage showNotification={showNotification} />} />
                    )}
                </Routes>
            </main>

            <footer className="main-footer">
                <div className="container">
                    <p>&copy; 2025 Sports Buddy. All rights reserved by AJ (https://github.com/Mr-aj33t).</p>
                </div>
            </footer>
        </div>
    );
}

export default App;
