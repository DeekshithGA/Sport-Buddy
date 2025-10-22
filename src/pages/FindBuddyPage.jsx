// src/pages/FindBuddyPage.jsx

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import BuddyCard from '../components/BuddyCard';
import './PageStyles.css';
import { auth } from '../firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

const FindBuddyPage = ({ showNotification }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [currentUserConnections, setCurrentUserConnections] = useState([]);

    const [sport, setSport] = useState('');
    const [abilityLevel, setAbilityLevel] = useState('');
    const [location, setLocation] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchPerformed, setSearchPerformed] = useState(false);

    // Listen for auth state changes to get the current user
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                // Fetch current user's connections when auth state changes
                try {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userSnap = await getDoc(userDocRef);
                    if (userSnap.exists()) {
                        setCurrentUserConnections(userSnap.data().connections || []);
                    } else {
                        setCurrentUserConnections([]);
                    }
                } catch (error) {
                    console.error("Error fetching current user's connections:", error);
                    setCurrentUserConnections([]);
                }
            } else {
                setCurrentUserConnections([]);
            }
            setLoadingAuth(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSearchResults([]);
        setSearchPerformed(true);

        try {
            let q = collection(db, 'users');

            if (sport) {
                q = query(q, where('sportsInterest', 'array-contains', sport));
            }
            if (abilityLevel) {
                q = query(q, where('abilityLevel', '==', abilityLevel));
            }
            if (location) {
                q = query(q, where('location', '==', location));
            }
            q = query(q, limit(20));

            const querySnapshot = await getDocs(q);
            const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setSearchResults(results);

            if (results.length === 0) {
                showNotification('No buddies found matching your criteria.', 'info');
            }

        } catch (error) {
            console.error('Error searching for buddies:', error);
            showNotification(`Error searching: ${error.message}`, 'error');
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    if (loadingAuth) {
        return <div className="loading-state flex-center">Loading user data...</div>;
    }

    return (
        <section className="find-buddy-page container">
            <h3>Find Your Sports Buddy</h3>
            <form onSubmit={handleSearch} className="search-form">
                <label>Sport (e.g., Football)</label>
                <input
                    type="text"
                    value={sport}
                    onChange={(e) => setSport(e.target.value)}
                    placeholder="e.g., Football"
                />

                <label>Ability Level</label>
                <select value={abilityLevel} onChange={(e) => setAbilityLevel(e.target.value)}>
                    <option value="">Select Level</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                </select>

                <label>Location (e.g., New York)</label>
                <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Kanpur"
                />

                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </form>

            <div className="search-results-grid grid-container">
                {loading && <p>Searching for buddies...</p>}

                {/* Search results display logic */}
                {!loading && searchPerformed && (
                    searchResults.length === 0 ? (
                        <p>No buddies found matching your criteria. Try different filters.</p>
                    ) : (
                        searchResults.map(buddy => (
                            <BuddyCard
                                key={buddy.id}
                                buddy={buddy}
                                currentUser={currentUser}
                                currentUserConnections={currentUserConnections} // Pass current user's connections
                                showNotification={showNotification}
                                isFindBuddyPage={true}
                            />
                        ))
                    )
                )}
            </div>
        </section>
    );
};

export default FindBuddyPage;
