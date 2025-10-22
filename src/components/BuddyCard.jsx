// src/components/BuddyCard.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/firebaseConfig';
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  collection,
  getDocs,
} from 'firebase/firestore';
import './Card.css';

const BuddyCard = ({ buddy, currentUser, showNotification, isFindBuddyPage = false }) => {
  const navigate = useNavigate();

  const [isConnected, setIsConnected] = React.useState(false);
  const [followers, setFollowers] = React.useState([]);

  React.useEffect(() => {
    if (isFindBuddyPage && currentUser && currentUser.uid && buddy?.id) {
      const fetchCurrentUserConnections = async () => {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const userConnections = userData.connections || [];
            setIsConnected(userConnections.includes(buddy.id));
          }
        } catch (error) {
          console.error('Error fetching current user connections:', error);
        }
      };
      fetchCurrentUserConnections();
    }
  }, [isFindBuddyPage, currentUser, buddy?.id]);

  // Fetch followers of this buddy (any user who has buddy.id in their connections)
  React.useEffect(() => {
    const fetchFollowers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const filteredFollowers = allUsers.filter(
          user => Array.isArray(user.connections) && user.connections.includes(buddy.id),
        );
        setFollowers(filteredFollowers);
      } catch (err) {
        console.error('Error fetching followers:', err);
      }
    };
    if (buddy?.id) {
      fetchFollowers();
    }
  }, [buddy?.id]);

  if (!buddy) {
    return null;
  }

  const { id, name, sport, location, description, creatorId } = buddy;
  const eventTime = buddy.eventTime;
  const status = buddy.status;
  const joinedUsers = buddy.joinedUsers || [];

  const username = buddy.username || buddy.displayName || buddy.name;
  const sportsInterest = buddy.sportsInterest || [];
  const abilityLevel = buddy.abilityLevel;
  const userLocation = buddy.location;
  const userId = buddy.id;

  const isCompleted = status === 'completed';
  const hasJoined = currentUser && joinedUsers.includes(currentUser.uid);
  const isCreator = currentUser && creatorId === currentUser.uid;
  const isAdmin = currentUser && currentUser.email === 'admin@sportsbuddy.com';
  const canCompleteOrEdit = isCreator || isAdmin;
  const canDelete = isCreator || isAdmin;

  const handleConnect = async () => {
    if (!currentUser) {
      showNotification('Please log in to connect with a buddy.', 'error');
      navigate('/login');
      return;
    }
    if (currentUser.uid === userId) {
      showNotification('You cannot connect with yourself!', 'info');
      return;
    }
    try {
      const currentUserDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(currentUserDocRef, {
        connections: arrayUnion(userId),
      });
      setIsConnected(true);
      showNotification(`You are now connected with ${username}!`, 'success');
    } catch (error) {
      console.error('Error connecting to buddy:', error);
      showNotification(`Failed to connect: ${error.message}`, 'error');
    }
  };

  const handleLeaveBuddy = async () => {
    if (!currentUser) {
      showNotification('Please log in to manage your connections.', 'error');
      navigate('/login');
      return;
    }
    try {
      const currentUserDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(currentUserDocRef, {
        connections: arrayRemove(userId),
      });
      setIsConnected(false);
      showNotification(`You have left connection with ${username}.`, 'info');
    } catch (error) {
      console.error('Error leaving buddy:', error);
      showNotification(`Failed to leave buddy: ${error.message}`, 'error');
    }
  };

  const handleJoinLeave = async () => {
    if (!currentUser) {
      showNotification('Please log in to join or leave an event.', 'error');
      navigate('/login');
      return;
    }
    if (isCreator) {
      showNotification('You cannot join/leave your own event. You are the creator.', 'info');
      return;
    }
    try {
      const eventDocRef = doc(db, 'sportsEvents', id);
      if (hasJoined) {
        await updateDoc(eventDocRef, {
          joinedUsers: arrayRemove(currentUser.uid),
        });
        showNotification('You have left the event!', 'info');
      } else {
        await updateDoc(eventDocRef, {
          joinedUsers: arrayUnion(currentUser.uid),
        });
        showNotification('You have joined the event!', 'success');
      }
    } catch (error) {
      console.error('Error joining/leaving event:', error);
      showNotification(`Failed to join/leave event: ${error.message}`, 'error');
    }
  };

  const handleEdit = () => {
    navigate(`/add-event?editId=${id}`);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteDoc(doc(db, 'sportsEvents', id));
        showNotification('Event deleted successfully!', 'success');
      } catch (error) {
        console.error('Error deleting event:', error);
        showNotification(`Failed to delete event: ${error.message}`, 'error');
      }
    }
  };

  const handleComplete = async () => {
    if (window.confirm('Mark this event as completed?')) {
      try {
        const eventDocRef = doc(db, 'sportsEvents', id);
        await updateDoc(eventDocRef, {
          status: 'completed',
        });
        showNotification('Event marked as completed!', 'success');
      } catch (error) {
        console.error('Error marking event complete:', error);
        showNotification(`Failed to mark event complete: ${error.message}`, 'error');
      }
    }
  };

  if (isFindBuddyPage) {
    return (
      <div className="card buddy-card">
        <h4>{username || 'N/A'}</h4>
        <p>
          <strong>Sports:</strong>{' '}
          {sportsInterest.length > 0 ? sportsInterest.join(', ') : 'N/A'}
        </p>
        <p>
          <strong>Ability:</strong> {abilityLevel || 'N/A'}
        </p>
        <p>
          <strong>Location:</strong> {userLocation || 'N/A'}
        </p>
        <p>
          <strong>Followers:</strong> {followers.length}
          {followers.length > 0 && (
            <span>
              {' ('}
              {followers
                .map(follower => follower.username || follower.displayName || follower.id)
                .join(', ')}
              {')'}
            </span>
          )}
        </p>
        <div
          className="buddy-actions"
          style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}
        >
          {currentUser && currentUser.uid !== userId && (
            <>
              <button
                className={`btn ${isConnected ? 'btn-secondary' : 'btn-info'}`}
                onClick={handleConnect}
                disabled={isConnected}
                style={{ cursor: isConnected ? 'not-allowed' : 'pointer' }}
                title={isConnected ? 'Already connected' : 'Connect with buddy'}
              >
                {isConnected ? 'Connected' : 'Connect'}
              </button>
              {isConnected && (
                <button
                  className="btn btn-danger"
                  onClick={handleLeaveBuddy}
                  title="Leave this buddy"
                >
                  Leave
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  const formattedTime =
    eventTime && eventTime.toDate
      ? eventTime
          .toDate()
          .toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
          .replace(',', '')
      : 'N/A';

  return (
    <div className={`card event-card ${isCompleted ? 'event-completed' : ''}`}>
      <h4>{name}</h4>
      <p>
        <strong>Sport:</strong> {sport}
      </p>
      <p>
        <strong>Location:</strong> {location}
      </p>
      <p>
        <strong>Time:</strong> {formattedTime}
      </p>
      {description && <p>{description}</p>}

      {isCompleted ? (
        <p className="completed-tag">**COMPLETED**</p>
      ) : hasJoined ? (
        <p className="joined-tag">**JOINED**</p>
      ) : null}

      <div className="event-actions">
        {!isCompleted && currentUser && (
          <button
            onClick={handleJoinLeave}
            className={`btn btn-sm ${hasJoined ? 'btn-secondary' : 'btn-info'}`}
            style={{ marginRight: '10px' }}
          >
            {hasJoined ? 'Leave' : 'Join'}
          </button>
        )}

        {!isCompleted && canCompleteOrEdit && (
          <button
            onClick={handleComplete}
            className="btn btn-sm btn-success"
            style={{ marginRight: '10px' }}
          >
            Complete
          </button>
        )}
        {!isCompleted && canCompleteOrEdit && (
          <button
            onClick={handleEdit}
            className="btn btn-sm btn-primary"
            style={{ marginRight: '10px' }}
          >
            Edit
          </button>
        )}
        {canDelete && (
          <button onClick={handleDelete} className="btn btn-sm btn-danger">
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default BuddyCard;
