// src/components/Notification.jsx
import React, { useEffect, useState } from 'react';
import './Notification.css'; // Component-specific CSS

const Notification = ({ message, type }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (message) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 2800); // Disappear slightly before parent timeout
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [message]);

    if (!isVisible) return null;

    return (
        <div className={`notification ${type}`}>
            <p>{message}</p>
        </div>
    );
};

export default Notification;
