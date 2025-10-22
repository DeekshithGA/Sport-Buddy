// src/pages/HomePage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react'; // useRef added here
import { Link, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/firebaseConfig';
import { collection, query, orderBy, getDocs, doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import EventCard from '../components/EventCard';
import './PageStyles.css';

// Define sports icons and their corresponding local image paths in public/assets
const sportsIcons = [
    { name: 'All', icon: '/assets/all_sports_icon.png' }, // Make sure you have a generic 'all_sports_icon.png' in public/assets
    { name: 'Cricket', icon: '/assets/cricket.png' },
    { name: 'Football', icon: '/assets/football.png' },
    { name: 'Volleyball', icon: '/assets/vollyball.png' }, // Double-check this filename
    { name: 'Tennis', icon: '/assets/tennis.png' },
    { name: 'BGMI', icon: '/assets/bgmi.jpeg' },
    { name: 'Cycling', icon: '/assets/cycling.png' },
    { name: 'E-Sports', icon: '/assets/e-sport.png' },
    { name: 'Horse Riding', icon: '/assets/equestrian.png' },
    { name: 'Hockey', icon: '/assets/hockey.png' },
    { name: 'Running', icon: '/assets/training.png' },
];

const HomePage = ({ showNotification }) => {
    const [selectedSport, setSelectedSport] = useState('All');
    const [allEvents, setAllEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [errorEvents, setErrorEvents] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const navigate = useNavigate();

    // Create a ref for the "Upcoming Events" section
    const upcomingEventsSectionRef = useRef(null); // New ref for the section

    // Listen for auth state changes to get current user
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    // Function to fetch all events from Firestore
    const fetchAllEvents = useCallback(async () => {
        setLoadingEvents(true);
        setErrorEvents(null);
        try {
            const eventsCollectionRef = collection(db, 'sportsEvents');
            const q = query(eventsCollectionRef, orderBy('eventTime', 'asc'));
            const querySnapshot = await getDocs(q);
            const eventsData = querySnapshot.docs.map(doc => {
                const event = { id: doc.id, ...doc.data() };
                // Add a 'joined' flag based on currentUser.uid if available
                event.joined = currentUser && event.joinedUsers && event.joinedUsers.includes(currentUser.uid);
                if (!event.creatorId) {
                    console.warn(`Event "${event.name}" (ID: ${event.id}) is missing 'creatorId'. This event might not be deletable/editable by its creator.`);
                }
                return event;
            });
            setAllEvents(eventsData);
            console.log('All events fetched:', eventsData);
        } catch (err) {
            console.error('Error fetching all events:', err);
            setErrorEvents('Failed to load events. Please try again.');
            if (showNotification) showNotification('Failed to load events.', 'error');
        } finally {
            setLoadingEvents(false);
        }
    }, [currentUser, showNotification]);

    // Effect to fetch all events on component mount and when currentUser changes
    useEffect(() => {
        fetchAllEvents();
    }, [fetchAllEvents]);

    // Effect to filter events whenever allEvents or selectedSport changes
    useEffect(() => {
        if (selectedSport === 'All') {
            setFilteredEvents(allEvents);
        } else {
            const filtered = allEvents.filter(event =>
                event.sport && event.sport.toLowerCase() === selectedSport.toLowerCase()
            );
            setFilteredEvents(filtered);
        }
    }, [selectedSport, allEvents]);

    // Modified handleSportIconClick to include scrolling
    const handleSportIconClick = (sportName) => {
        setSelectedSport(sportName);
        // Scroll to the "Upcoming Events" section
        if (upcomingEventsSectionRef.current) {
            upcomingEventsSectionRef.current.scrollIntoView({
                behavior: 'smooth', // Smooth scrolling
                block: 'start'      // Aligns the top of the element with the top of the viewport
            });
        }
    };

    // --- Event Action Handlers (Copied from EventsPage and adapted for HomePage) ---
    const handleDeleteEvent = async (eventId) => {
        if (!currentUser) {
            showNotification('You must be logged in to delete an event.', 'error');
            return;
        }
        const eventToDelete = allEvents.find(e => e.id === eventId);
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
                fetchAllEvents(); // Re-fetch to update UI
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

        if (window.confirm("Are you sure you want to mark this event as completed?")) {
            try {
                await updateDoc(doc(db, 'sportsEvents', eventId), {
                    status: 'completed',
                    completedAt: new Date(),
                });
                if (showNotification) showNotification('Event marked as completed!', 'success');
                fetchAllEvents(); // Re-fetch to update status
            } catch (error) {
                console.error("Error marking event as complete:", error);
                if (showNotification) showNotification(`Failed to mark event as complete: ${error.message}`, 'error');
            }
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
        navigate(`/add-event?editId=${eventId}`); // Navigate to edit page
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
                if (showNotification) showNotification('You have left the event.', 'info');
            } else {
                await updateDoc(eventDocRef, {
                    joinedUsers: arrayUnion(currentUser.uid)
                });
                if (showNotification) showNotification('You have joined the event!', 'success');
            }
            fetchAllEvents(); // Re-fetch to update UI
        } catch (error) {
            console.error("Error joining/leaving event:", error);
            if (showNotification) showNotification(`Failed to join/leave event: ${error.message}`, 'error');
        }
    };
    // --- End Event Action Handlers ---

    return (
        <>
            {/* Hero Section - Now with Icons instead of text */}
            <section className="hero-section">
                <div className="container">
                    <div className="hero-icons-display">
                        {sportsIcons.map((sportItem) => (
                            // Only render if it's not the 'All' category, or if you want 'All' to be a clickable icon too.
                            // If 'All' is meant for general viewing without a specific icon, remove this check.
                            sportItem.name !== 'All' && ( 
                                <div
                                    key={sportItem.name}
                                    className="hero-sport-icon-item"
                                    onClick={() => handleSportIconClick(sportItem.name)}
                                >
                                    <img src={sportItem.icon} alt={sportItem.name} className="hero-sport-icon" />
                                    <p>{sportItem.name}</p>
                                </div>
                            )
                        ))}
                    </div>
                    <div className="hero-buttons">
                        <Link to="/find-buddy" className="btn btn-primary">Find a Buddy</Link>
                        <Link to="/events" className="btn btn-secondary">Explore All Events</Link>
                    </div>
                </div>
            </section>

            {/* Filtered Events Section - Add ref here */}
            <section className="filtered-events-section container" ref={upcomingEventsSectionRef}> {/* Ref added here */}
                {selectedSport && selectedSport !== 'All' ? (
                    <h3>Upcoming {selectedSport} Events</h3>
                ) : (
                    <h3>Upcoming Events</h3>
                )}
                {loadingEvents ? (
                    <div className="loading-state flex-center">Loading events...</div>
                ) : errorEvents ? (
                    <div className="error-state flex-center">{errorEvents}</div>
                ) : filteredEvents.length === 0 ? (
                    <p className="no-data-message">
                        {selectedSport === 'All'
                            ? 'No upcoming events found. Be the first to add one!'
                            : `No upcoming ${selectedSport} events found.`}
                    </p>
                ) : (
                    <div className="events-grid grid-container">
                        {filteredEvents.map(event => (
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
        </>
    );
};

export default HomePage;
