// src/components/EventCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom'; // For navigation (if needed for fallback)
// No need to import auth or onAuthStateChanged here if currentUser is passed as prop

// Helper function to format Firestore Timestamp to a readable string
const formatFirestoreTimestamp = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return 'Not specified';
    const date = timestamp.toDate();
    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).replace(',', ''); // Remove comma if present
};

const EventCard = ({ event, currentUser, onJoin, onComplete, onEdit, onDelete, showNotification }) => {
    const navigate = useNavigate();
    const eventTime = event.eventTime ? event.eventTime.toDate() : null; // Convert Firestore Timestamp to Date object
    const currentTime = new Date();

    // Determine event status
    const isCompleted = event.status === 'completed' || (eventTime && eventTime < currentTime);
    // Check if current user has joined this event
    const hasJoined = currentUser && event.joinedUsers && event.joinedUsers.includes(currentUser.uid);
    // Check if current user is the creator
    const isCreator = currentUser && event.creatorId === currentUser.uid;
    // Check if current user is admin (assuming admin email is 'admin@sportsbuddy.com')
    const isAdmin = currentUser && currentUser.email === 'admin@sportsbuddy.com';

    // Handlers for buttons
    const handleJoinClick = () => {
        if (onJoin) {
            onJoin(event.id, hasJoined); // Pass event ID and current join status
        } else {
            console.warn("onJoin handler not provided for EventCard.");
            if (showNotification) showNotification("Join functionality not available here.", "info");
        }
    };

    const handleCompleteClick = () => {
        if (onComplete) {
            onComplete(event.id, event.creatorId); // Pass event ID and creator ID
        } else {
            console.warn("onComplete handler not provided for EventCard.");
            if (showNotification) showNotification("Complete functionality not available here.", "info");
        }
    };

    const handleEditClick = () => {
        if (onEdit) {
            onEdit(event.id, event.creatorId); // Pass event ID and creator ID
        } else {
            console.warn("onEdit handler not provided for EventCard.");
            if (showNotification) showNotification("Edit functionality not available here.", "info");
            // Fallback to navigate to edit page if no specific handler is provided
            navigate(`/add-event?editId=${event.id}`);
        }
    };

    const handleDeleteClick = () => {
        if (onDelete) {
            onDelete(event.id); // Pass event ID
        } else {
            console.warn("onDelete handler not provided for EventCard.");
            if (showNotification) showNotification("Delete functionality not available here.", "info");
        }
    };

    return (
        <div className={`event-card ${isCompleted ? 'event-completed' : ''}`}>
            <h4 className="event-title">{event.name || 'Event Title'}</h4>
            <p><strong>Sport:</strong> {event.sport || 'Not specified'}</p>
            <p><strong>Location:</strong> {event.location || 'Not specified'}</p>
            <p><strong>Time:</strong> {formatFirestoreTimestamp(event.eventTime)}</p>
            {event.description && <p className="event-description">{event.description}</p>}

            {isCompleted && <p className="completed-tag">**COMPLETED**</p>}
            {hasJoined && !isCompleted && <p className="joined-tag">**JOINED**</p>} {/* Show JOINED only if not completed */}

            <div className="event-actions-horizontal"> {/* Ensure this class is used for horizontal layout */}
                {/* Join/Leave Button */}
                {currentUser && !isCreator && !isCompleted && ( // Show Join/Leave if logged in, not creator, and not completed
                    <button
                        className={`btn-join-event ${hasJoined ? 'btn-leave-event' : ''}`} // Use specific classes for styling
                        onClick={handleJoinClick}
                    >
                        {hasJoined ? 'Leave' : 'Join'}
                    </button>
                )}

                {/* Complete Button */}
                {(isCreator || isAdmin) && !isCompleted && ( // Show Complete if creator or admin and not completed
                    <button className="btn-complete-event" onClick={handleCompleteClick}>Complete</button>
                )}
                
                {/* Edit Button */}
                {(isCreator || isAdmin) && ( // Show Edit if creator or admin (even if completed, as you might want to edit details of a past event)
                    <button className="btn-edit-event" onClick={handleEditClick}>Edit</button>
                )}

                {/* Delete Button */}
                {(isCreator || isAdmin) && ( // Show Delete if creator or admin (even if completed)
                    <button className="btn-delete-event" onClick={handleDeleteClick}>Delete</button>
                )}
            </div>
        </div>
    );
};

export default EventCard;
