import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../firebase/firebaseConfig';
import { collection, query, orderBy, getDocs, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import EventCard from '../components/EventCard';
import { useNavigate } from 'react-router-dom';
import './PageStyles.css';

const EventsPage = ({ showNotification }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    // Memoize fetchEvents so it does not change on every render
    const fetchEvents = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const q = query(collection(db, 'sportsEvents'), orderBy('eventTime', 'asc'));
            const querySnapshot = await getDocs(q);
            const eventsData = querySnapshot.docs.map(doc => {
                const event = { id: doc.id, ...doc.data() };
                if (!event.creatorId) {
                    console.warn(`Event "${event.name}" (ID: ${event.id}) is missing 'creatorId'. This event might not be deletable/editable by its creator.`);
                }
                return event;
            });
            setEvents(eventsData);
            console.log('Events fetched:', eventsData);
        } catch (err) {
            console.error('Error fetching events:', err);
            setError('Failed to load events. Please try again later.');
            if (showNotification) showNotification('Failed to load events.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showNotification]); // include showNotification if used inside fetchEvents

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleDeleteEvent = async (eventId) => {
        if (!currentUser) {
            showNotification('You must be logged in to delete an event.', 'error');
            return;
        }
        const eventToDelete = events.find(e => e.id === eventId);
        if (!eventToDelete) {
            showNotification('Event not found.', 'error');
            return;
        }
        if (currentUser.email !== 'admin@sportsbuddy.com' && currentUser.uid !== eventToDelete.creatorId) {
            showNotification('Permission denied. Only admin or event creator can delete this event.', 'error');
            return;
        }

        if (window.confirm("Are you sure you want to delete this event?")) {
            try {
                await deleteDoc(doc(db, 'sportsEvents', eventId));
                if (showNotification) showNotification('Event deleted successfully!', 'success');
                fetchEvents();
            } catch (error) {
                console.error("Error deleting event:", error);
                if (showNotification) showNotification(`Failed to delete event: ${error.message}`, 'error');
            }
        }
    };

    const handleCompleteEvent = async (eventId, creatorId) => {
        if (!currentUser) {
            showNotification('You must be logged in to complete an event.', 'error');
            return;
        }
        if (currentUser.email !== 'admin@sportsbuddy.com' && currentUser.uid !== creatorId) {
            showNotification('Permission denied. Only admin or event creator can mark as complete.', 'error');
            return;
        }

        try {
            await updateDoc(doc(db, 'sportsEvents', eventId), {
                status: 'completed',
                completedAt: new Date(),
            });
            if (showNotification) showNotification('Event marked as completed!', 'success');
            fetchEvents();
        } catch (error) {
            console.error("Error marking event as complete:", error);
            if (showNotification) showNotification(`Failed to mark event as complete: ${error.message}`, 'error');
        }
    };

    const handleEditEvent = (eventId, creatorId) => {
        if (!currentUser) {
            showNotification('You must be logged in to edit an event.', 'error');
            return;
        }
        if (currentUser.email !== 'admin@sportsbuddy.com' && currentUser.uid !== creatorId) {
            showNotification('Permission denied. Only admin or event creator can edit events.', 'error');
            return;
        }
        navigate(`/add-event?editId=${eventId}`);
    };

    const handleJoinEvent = async (eventId, hasJoined) => {
        if (!currentUser) {
            showNotification('You must be logged in to join an event.', 'error');
            return;
        }

        try {
            const eventDocRef = doc(db, 'sportsEvents', eventId);
            if (hasJoined) {
                await updateDoc(eventDocRef, {
                    joinedUsers: arrayRemove(currentUser.uid)
                });
                showNotification('You have left the event.', 'info');
            } else {
                await updateDoc(eventDocRef, {
                    joinedUsers: arrayUnion(currentUser.uid)
                });
                showNotification('You have joined the event!', 'success');
            }
            fetchEvents();
        } catch (error) {
            console.error("Error joining/leaving event:", error);
            showNotification(`Failed to join/leave event: ${error.message}`, 'error');
        }
    };

    if (loading) {
        return <div className="loading-state flex-center">Loading events...</div>;
    }

    if (error) {
        return <div className="error-state flex-center">{error}</div>;
    }

    return (
        <section className="events-page container">
            <h3>All Sports Events</h3>
            {events.length === 0 ? (
                <p className="no-data-message">No upcoming events found.</p>
            ) : (
                <div className="grid-container">
                    {events.map(event => (
                        <EventCard
                            key={event.id}
                            event={event}
                            currentUser={currentUser}
                            onDelete={handleDeleteEvent}
                            onComplete={handleCompleteEvent}
                            onEdit={handleEditEvent}
                            onJoin={handleJoinEvent}
                            showNotification={showNotification}
                        />
                    ))}
                </div>
            )}
        </section>
    );
};

export default EventsPage;
