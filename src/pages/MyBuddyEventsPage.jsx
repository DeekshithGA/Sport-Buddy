// src/pages/MyBuddyEventsPage.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { doc, getDoc } from 'firebase/firestore'; // For fetching single document
import EventCard from '../components/BuddyCard'; // Reusing BuddyCard for events
import './PageStyles.css';
import { auth } from '../firebase/firebaseConfig'; // Import auth to get currentUser
import { onAuthStateChanged } from 'firebase/auth'; // Import onAuthStateChanged

const MyBuddyEventsPage = ({ showNotification }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [buddyEvents, setBuddyEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [error, setError] = useState(null);

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoadingAuth(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchBuddyEvents = async () => {
            if (!currentUser || loadingAuth) {
                return; // Wait for user to be loaded
            }

            setLoadingEvents(true);
            setError(null);
            setBuddyEvents([]);

            try {
                // 1. Fetch the current user's document to get their connections
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userSnap = await getDoc(userDocRef);

                if (!userSnap.exists()) {
                    showNotification('Your user profile not found.', 'error');
                    setLoadingEvents(false);
                    return;
                }

                const userData = userSnap.data();
                const connections = userData.connections || [];

                if (connections.length === 0) {
                    showNotification('You have no active buddy connections.', 'info');
                    setLoadingEvents(false);
                    return;
                }

                // 2. Query sportsEvents collection for events created by these connected buddies
                // Firestore 'in' query is limited to 10 items. If you have more connections,
                // you'll need to break this into multiple queries or use a different strategy (e.g., Cloud Functions).
                if (connections.length > 10) {
                    showNotification('Warning: Only showing events from the first 10 buddies due to Firestore query limits.', 'warning');
                    // For more than 10 connections, you'd loop or use batches/Cloud Functions
                }
                
                const q = query(
                    collection(db, 'sportsEvents'),
                    where('creatorId', 'in', connections.slice(0, 10)) // Use slice if more than 10 connections
                    // You might want to add other filters like status: 'upcoming'
                    // where('status', '==', 'upcoming')
                );

                const querySnapshot = await getDocs(q);
                const eventsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setBuddyEvents(eventsData);

            } catch (err) {
                console.error('Error fetching buddy events:', err);
                setError('Failed to load buddy events. Please try again.');
            } finally {
                setLoadingEvents(false);
            }
        };

        fetchBuddyEvents();
    }, [currentUser, loadingAuth, showNotification]); // Dependencies

    if (loadingAuth || loadingEvents) {
        return <div className="loading-state flex-center">Loading buddy events...</div>;
    }

    if (error) {
        return <div className="error-state flex-center">{error}</div>;
    }

    return (
        <section className="my-buddy-events-page container">
            <h3>Events from Your Buddies</h3>
            {buddyEvents.length === 0 && (
                <p className="no-data-message">
                    No events found from your connected buddies. Connect with more buddies or check back later!
                </p>
            )}
            <div className="events-grid grid-container">
                {buddyEvents.map(event => (
                    <EventCard
                        key={event.id}
                        buddy={event} // Pass event data as 'buddy' prop (since BuddyCard is reusable)
                        currentUser={currentUser}
                        showNotification={showNotification}
                        isFindBuddyPage={false} // Explicitly indicate it's an event card
                    />
                ))}
            </div>
        </section>
    );
};

export default MyBuddyEventsPage;
