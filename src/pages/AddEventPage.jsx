// src/pages/AddEventPage.jsx

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, addDoc, serverTimestamp, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import './PageStyles.css'; // Assuming common styling for pages

const AddEventPage = ({ user, showNotification }) => {
    const [eventName, setEventName] = useState('');
    const [sport, setSport] = useState('');
    const [location, setLocation] = useState('');
    const [eventDateTime, setEventDateTime] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]); // State for sports categories
    const [cities, setCities] = useState([]); // State for cities

    const navigate = useNavigate();
    const locationHook = useLocation();
    const isEditMode = locationHook.search.includes('editId');
    const editEventId = new URLSearchParams(locationHook.search).get('editId');


    // Fetch categories and cities from Firebase on component mount
    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                // Fetch Categories
                const categoriesCollectionRef = collection(db, 'categories');
                const categoriesSnapshot = await getDocs(categoriesCollectionRef);
                const categoriesList = categoriesSnapshot.docs.map(doc => doc.data().name);
                setCategories(categoriesList);

                // Fetch Cities
                const citiesCollectionRef = collection(db, 'cities');
                const citiesSnapshot = await getDocs(citiesCollectionRef);
                const citiesList = citiesSnapshot.docs.map(doc => doc.data().name);
                setCities(citiesList);

            } catch (error) {
                console.error('Error fetching dropdown data:', error);
                showNotification('Failed to load sports categories or cities.', 'error');
            }
        };

        fetchDropdownData();
    }, [showNotification]);


    // Effect for Edit Mode: Populate form with existing event data
    useEffect(() => {
        const fetchEventForEdit = async () => {
            if (isEditMode && editEventId) {
                setLoading(true);
                try {
                    const eventRef = doc(db, 'sportsEvents', editEventId);
                    const eventSnap = await getDoc(eventRef);
                    if (eventSnap.exists()) {
                        const eventData = eventSnap.data();
                        setEventName(eventData.name || '');
                        setSport(eventData.sport || '');
                        setLocation(eventData.location || '');
                        setDescription(eventData.description || '');

                        // Format timestamp back to local datetime string for input field
                        if (eventData.eventTime && eventData.eventTime.toDate) {
                            const date = eventData.eventTime.toDate();
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            const hours = String(date.getHours()).padStart(2, '0');
                            const minutes = String(date.getMinutes()).padStart(2, '0');
                            setEventDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
                        }
                    } else {
                        showNotification('Event not found for editing.', 'error');
                        navigate('/events'); // Redirect if event not found
                    }
                } catch (error) {
                    console.error('Error fetching event for edit:', error);
                    showNotification('Failed to load event details for editing.', 'error');
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchEventForEdit();
    }, [isEditMode, editEventId, navigate, showNotification]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            showNotification('You must be logged in to add or edit an event.', 'error');
            navigate('/login');
            return;
        }

        if (!eventName || !sport || !location || !eventDateTime) {
            showNotification('Please fill in all required fields: Event Name, Sport, Location, and Date & Time.', 'error');
            return;
        }

        setLoading(true);
        try {
            const eventData = {
                name: eventName,
                sport: sport,
                location: location,
                eventTime: new Date(eventDateTime), // Convert string to Date object
                description: description,
                creatorId: user.uid,
                creatorEmail: user.email,
                status: 'upcoming', // Default status for new events
                joinedUsers: [] // Initialize with an empty array for new events
            };

            if (isEditMode && editEventId) {
                // Update existing event
                const eventRef = doc(db, 'sportsEvents', editEventId);
                await updateDoc(eventRef, eventData);
                showNotification('Event updated successfully!', 'success');
            } else {
                // Add new event
                await addDoc(collection(db, 'sportsEvents'), {
                    ...eventData,
                    createdAt: serverTimestamp() // Add timestamp for new events
                });
                showNotification('Event added successfully!', 'success');
            }

            // Clear form
            setEventName('');
            setSport('');
            setLocation('');
            setEventDateTime('');
            setDescription('');

            // Redirect to events page after adding/editing
            navigate('/events');

        } catch (error) {
            console.error('Error adding/updating event:', error);
            showNotification(`Failed to ${isEditMode ? 'update' : 'add'} event: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="add-event-page container">
            <h3>{isEditMode ? 'Edit Sports Event' : 'Add New Sports Event'}</h3>
            <form onSubmit={handleSubmit} className="event-form">
                <div className="form-group">
                    <label htmlFor="eventName">Event Name:</label>
                    <input
                        type="text"
                        id="eventName"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        placeholder="e.g., Sunday Football Match"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="sport">Sport:</label>
                    {/* Use datalist for suggestions while allowing manual input */}
                    <input
                        type="text"
                        id="sport"
                        list="sports-categories"
                        value={sport}
                        onChange={(e) => setSport(e.target.value)}
                        placeholder="e.g., Cricket, Basketball"
                        required
                    />
                    <datalist id="sports-categories">
                        {categories.map((cat, index) => (
                            <option key={index} value={cat} />
                        ))}
                    </datalist>
                </div>

                <div className="form-group">
                    <label htmlFor="location">Location:</label>
                    {/* Use datalist for suggestions while allowing manual input */}
                    <input
                        type="text"
                        id="location"
                        list="cities-list"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g., Kanpur, Armapur Estate"
                        required
                    />
                    <datalist id="cities-list">
                        {cities.map((city, index) => (
                            <option key={index} value={city} />
                        ))}
                    </datalist>
                </div>

                <div className="form-group">
                    <label htmlFor="eventDateTime">Date & Time:</label>
                    <input
                        type="datetime-local"
                        id="eventDateTime"
                        value={eventDateTime}
                        onChange={(e) => setEventDateTime(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="description">Description (Optional):</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Any specific details, rules, contact info, etc."
                        rows="3"
                    ></textarea>
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Event' : 'Add Event')}
                </button>
            </form>
        </section>
    );
};

export default AddEventPage;
