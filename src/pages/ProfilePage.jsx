// src/pages/ProfilePage.jsx

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore'; // Keep updateDoc if used for saving
import './PageStyles.css';

const ProfilePage = ({ user, showNotification }) => {
  const [username, setUsername] = useState('');
  const [location, setLocation] = useState('');
  const [abilityLevel, setAbilityLevel] = useState('');
  const [sportsInterests, setSportsInterests] = useState([]); // Array for selected sports
  const [availableCategories, setAvailableCategories] = useState([]); // used below
  const [availableCities, setAvailableCities] = useState([]); // used below

  const [connectionsCount, setConnectionsCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch user profile data and options on mount or user change
  useEffect(() => {
    const fetchUserProfileAndOptions = async () => {
      if (user) {
        setLoading(true);
        try {
          // Fetch user profile data
          const userDocRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            setUsername(data.username || '');
            setLocation(data.location || '');
            setAbilityLevel(data.abilityLevel || '');
            setSportsInterests(data.sportsInterest || []);
            setConnectionsCount(Array.isArray(data.connections) ? data.connections.length : 0);
          } else {
            showNotification('User profile not found. Please update your details.', 'info');
            setIsEditing(true);
            setConnectionsCount(0);
          }

          // Fetch sports categories
          const categoriesSnapshot = await getDocs(collection(db, 'categories'));
          setAvailableCategories(categoriesSnapshot.docs.map(doc => doc.data().name));

          // Fetch cities
          const citiesSnapshot = await getDocs(collection(db, 'cities'));
          setAvailableCities(citiesSnapshot.docs.map(doc => doc.data().name));

          setProfileLoaded(true);
        } catch (error) {
          console.error('Error fetching profile:', error);
          showNotification(`Failed to load profile: ${error.message}`, 'error');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserProfileAndOptions();
  }, [user, showNotification]);

  // Implement handleSave to update profile to fix ESLint error
  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) {
      showNotification('You must be logged in to update your profile.', 'error');
      return;
    }
    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        username,
        location,
        abilityLevel,
        sportsInterest: sportsInterests,
      });
      showNotification('Profile updated successfully!', 'success');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification(`Failed to update profile: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSportsInterestChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSportsInterests(prev => [...prev, value]);
    } else {
      setSportsInterests(prev => prev.filter(sport => sport !== value));
    }
  };

  const handleCancel = () => {
    // Reload user profile data to revert changes
    if (!user) return;
    setLoading(true);
    getDoc(doc(db, 'users', user.uid))
      .then(userSnap => {
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUsername(data.username || '');
          setLocation(data.location || '');
          setAbilityLevel(data.abilityLevel || '');
          setSportsInterests(data.sportsInterest || []);
        }
      })
      .catch(err => {
        console.error('Error reverting profile:', err);
        showNotification('Failed to revert changes.', 'error');
      })
      .finally(() => {
        setLoading(false);
        setIsEditing(false);
      });
  };

  if (loading && !profileLoaded) {
    return <div className="loading-state flex-center">Loading profile...</div>;
  }

  if (!user) {
    return <div className="not-logged-in-message flex-center">Please log in to view your profile.</div>;
  }

  return (
    <section className="profile-page container">
      <h3>My Profile</h3>
      {isEditing ? (
        <form onSubmit={handleSave} className="profile-form">
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Your Username"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="location">Location:</label>
            <input
              type="text"
              id="location"
              value={location}
              list="cities-list"
              onChange={e => setLocation(e.target.value)}
              placeholder="Enter your city"
              required
              disabled={loading}
            />
            <datalist id="cities-list">
              {availableCities.map(city => (
                <option key={city} value={city} />
              ))}
            </datalist>
          </div>
          <div className="form-group">
            <label htmlFor="abilityLevel">Ability Level:</label>
            <select
              id="abilityLevel"
              value={abilityLevel}
              onChange={e => setAbilityLevel(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">Select Level</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          <div className="form-group">
            <label>Sports Interests:</label>
            <div className="sports-checkbox-group">
              {availableCategories.length > 0
                ? availableCategories.map(sportCat => (
                    <label key={sportCat}>
                      <input
                        type="checkbox"
                        value={sportCat}
                        checked={sportsInterests.includes(sportCat)}
                        onChange={handleSportsInterestChange}
                        disabled={loading}
                      />
                      {sportCat}
                    </label>
                  ))
                : <p>Loading sports categories...</p>}
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={loading}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="profile-display-card card">
          <p><strong>Username:</strong> {username || 'N/A'}</p>
          <p><strong>Email:</strong> {user.email || 'N/A'}</p>
          <p><strong>Location:</strong> {location || 'N/A'}</p>
          <p><strong>Sports Interests:</strong> {sportsInterests.length > 0 ? sportsInterests.join(', ') : 'N/A'}</p>
          <p><strong>Ability Level:</strong> {abilityLevel || 'N/A'}</p>

          {/* Show "You follow X users" only to logged-in user */}
          <p><strong>You follow:</strong> {connectionsCount} user{connectionsCount !== 1 ? 's' : ''}</p>

          <div className="profile-actions">
            <button type="button" className="btn btn-primary" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProfilePage;
