// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import './PageStyles.css'; // General page styling
import './AdminDashboard.css'; // Specific styling for Admin Dashboard

const AdminDashboard = ({ showNotification }) => {
    // State for managing categories, cities, and areas
    const [categories, setCategories] = useState([]);
    const [cities, setCities] = useState([]);
    const [areas, setAreas] = useState([]);

    // State for form inputs (for adding/updating)
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCityName, setNewCityName] = useState('');
    const [newAreaName, setNewAreaName] = useState('');
    const [selectedCityForArea, setSelectedCityForArea] = useState(''); // To link area to a city

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Fetch Data Functions ---
    const fetchCategories = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'categories'));
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCategories(data);
        } catch (err) {
            console.error("Error fetching categories:", err);
            setError("Failed to load categories.");
        }
    };

    const fetchCities = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'cities'));
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCities(data);
        } catch (err) {
            console.error("Error fetching cities:", err);
            setError("Failed to load cities.");
        }
    };

    const fetchAreas = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'areas'));
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAreas(data);
        } catch (err) {
            console.error("Error fetching areas:", err);
            setError("Failed to load areas.");
        }
    };

    // Fetch all data on component mount
    useEffect(() => {
        const loadAllData = async () => {
            setLoading(true);
            setError(null);
            await Promise.all([fetchCategories(), fetchCities(), fetchAreas()]);
            setLoading(false);
        };
        loadAllData();
    }, []);

    // --- CRUD Operations for Categories ---
    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) {
            showNotification("Category name cannot be empty.", "error");
            return;
        }
        try {
            await addDoc(collection(db, 'categories'), { name: newCategoryName.trim() });
            showNotification("Category added successfully!", "success");
            setNewCategoryName('');
            fetchCategories(); // Re-fetch to update list
        } catch (err) {
            console.error("Error adding category:", err);
            showNotification(`Error adding category: ${err.message}`, "error");
        }
    };

    const handleDeleteCategory = async (id) => {
        if (window.confirm("Are you sure you want to delete this category?")) {
            try {
                await deleteDoc(doc(db, 'categories', id));
                showNotification("Category deleted successfully!", "success");
                fetchCategories(); // Re-fetch to update list
            } catch (err) {
                console.error("Error deleting category:", err);
                showNotification(`Error deleting category: ${err.message}`, "error");
            }
        }
    };

    // --- CRUD Operations for Cities ---
    const handleAddCity = async (e) => {
        e.preventDefault();
        if (!newCityName.trim()) {
            showNotification("City name cannot be empty.", "error");
            return;
        }
        try {
            await addDoc(collection(db, 'cities'), { name: newCityName.trim() });
            showNotification("City added successfully!", "success");
            setNewCityName('');
            fetchCities(); // Re-fetch to update list
        } catch (err) {
            console.error("Error adding city:", err);
            showNotification(`Error adding city: ${err.message}`, "error");
        }
    };

    const handleDeleteCity = async (id) => {
        if (window.confirm("Are you sure you want to delete this city?")) {
            try {
                await deleteDoc(doc(db, 'cities', id));
                showNotification("City deleted successfully!", "success");
                fetchCities(); // Re-fetch to update list
                // Also re-fetch areas, as some might have been linked to this city
                fetchAreas();
            } catch (err) {
                console.error("Error deleting city:", err);
                showNotification(`Error deleting city: ${err.message}`, "error");
            }
        }
    };

    // --- CRUD Operations for Areas ---
    const handleAddArea = async (e) => {
        e.preventDefault();
        if (!newAreaName.trim() || !selectedCityForArea) {
            showNotification("Area name and city must be selected.", "error");
            return;
        }
        const cityName = cities.find(city => city.id === selectedCityForArea)?.name;
        if (!cityName) {
            showNotification("Selected city not found.", "error");
            return;
        }

        try {
            await addDoc(collection(db, 'areas'), {
                name: newAreaName.trim(),
                cityId: selectedCityForArea,
                cityName: cityName
            });
            showNotification("Area added successfully!", "success");
            setNewAreaName('');
            setSelectedCityForArea('');
            fetchAreas(); // Re-fetch to update list
        } catch (err) {
            console.error("Error adding area:", err);
            showNotification(`Error adding area: ${err.message}`, "error");
        }
    };

    const handleDeleteArea = async (id) => {
        if (window.confirm("Are you sure you want to delete this area?")) {
            try {
                await deleteDoc(doc(db, 'areas', id));
                showNotification("Area deleted successfully!", "success");
                fetchAreas(); // Re-fetch to update list
            } catch (err) {
                console.error("Error deleting area:", err);
                showNotification(`Error deleting area: ${err.message}`, "error");
            }
        }
    };

    // Placeholder for "Delete Sports" functionality
    // This would likely involve searching for sports events and deleting them
    const handleDeleteSportEvent = async (eventId) => {
        if (window.confirm("Are you sure you want to delete this sports event?")) {
            try {
                await deleteDoc(doc(db, 'sportsEvents', eventId));
                showNotification("Sports event deleted successfully!", "success");
                // You would typically re-fetch sports events if they were listed here
                // For now, this is a conceptual placeholder
            } catch (err) {
                console.error("Error deleting sports event:", err);
                showNotification(`Error deleting sports event: ${err.message}`, "error");
            }
        }
    };

    if (loading) {
        return <div className="loading-screen flex-center">Loading admin data...</div>;
    }

    if (error) {
        return <div className="error-state flex-center">{error}</div>;
    }

    return (
        <section className="admin-dashboard-page container">
            <h3>Admin Dashboard</h3>

            {/* --- Manage Categories --- */}
            <div className="admin-section">
                <h4>Manage Sports Categories</h4>
                <form onSubmit={handleAddCategory} className="admin-form">
                    <input
                        type="text"
                        placeholder="New Category Name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary">Add Category</button>
                </form>
                <ul className="admin-list">
                    {categories.map((category) => (
                        <li key={category.id}>
                            {category.name}
                            <button onClick={() => handleDeleteCategory(category.id)} className="btn btn-danger btn-small">Delete</button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* --- Manage Cities --- */}
            <div className="admin-section">
                <h4>Manage Cities</h4>
                <form onSubmit={handleAddCity} className="admin-form">
                    <input
                        type="text"
                        placeholder="New City Name"
                        value={newCityName}
                        onChange={(e) => setNewCityName(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary">Add City</button>
                </form>
                <ul className="admin-list">
                    {cities.map((city) => (
                        <li key={city.id}>
                            {city.name}
                            <button onClick={() => handleDeleteCity(city.id)} className="btn btn-danger btn-small">Delete</button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* --- Manage Areas --- */}
            <div className="admin-section">
                <h4>Manage Areas</h4>
                <form onSubmit={handleAddArea} className="admin-form">
                    <input
                        type="text"
                        placeholder="New Area Name"
                        value={newAreaName}
                        onChange={(e) => setNewAreaName(e.target.value)}
                    />
                    <select
                        value={selectedCityForArea}
                        onChange={(e) => setSelectedCityForArea(e.target.value)}
                    >
                        <option value="">Select City</option>
                        {cities.map(city => (
                            <option key={city.id} value={city.id}>{city.name}</option>
                        ))}
                    </select>
                    <button type="submit" className="btn btn-primary">Add Area</button>
                </form>
                <ul className="admin-list">
                    {areas.map((area) => (
                        <li key={area.id}>
                            {area.name} ({area.cityName || 'N/A'})
                            <button onClick={() => handleDeleteArea(area.id)} className="btn btn-danger btn-small">Delete</button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* --- Delete Sports (Conceptual Placeholder) --- */}
            <div className="admin-section">
                <h4>Delete Sports Events (Manual Example)</h4>
                <p>
                    To delete a sports event, you would typically list them here or provide a search.
                    For demonstration, here's a button to call a delete function (replace 'someEventId123' with actual ID).
                </p>
                <button
                    onClick={() => handleDeleteSportEvent('someEventId123')}
                    className="btn btn-danger"
                >
                    Delete Sample Event
                </button>
            </div>
        </section>
    );
};

export default AdminDashboard;
