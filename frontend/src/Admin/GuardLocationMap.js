// GuardLocationMap.js
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default icon issues with Leaflet in Create React App
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const GuardLocationMap = ({ latitude, longitude }) => {
    const [address, setAddress] = useState('Fetching address...');

    useEffect(() => {
        async function fetchAddress() {
            try {
                const response = await axios.get(
                    `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                );
                if (response.data && response.data.display_name) {
                    setAddress(response.data.display_name);
                } else {
                    setAddress('Address not found');
                }
            } catch (error) {
                console.error('Error fetching address:', error.message);
                setAddress('Error fetching address');
            }
        }
        fetchAddress();
    }, [latitude, longitude]);

    return (
        <MapContainer
            center={[latitude, longitude]}
            zoom={15}
            style={{ height: '400px', width: '100%' }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
            />
            <Marker position={[latitude, longitude]}>
                <Popup>{address}</Popup>
            </Marker>
        </MapContainer>
    );
};

export default GuardLocationMap;
