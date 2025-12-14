import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function ClickManejador({ alHacerClick }) {
    useMapEvents({
        click: (e) => {
            alHacerClick(e.latlng);
        },
    });
    return null;
}

function SelectorMapa({ alSeleccionarUbicacion }) {
    // 1. CENTRAR EN LAJA, CHILE
    const [posicion, setPosicion] = useState([-37.2703, -72.7038]); 
    const [cargando, setCargando] = useState(false);

    const manejarClick = async (latlng) => {
        setPosicion([latlng.lat, latlng.lng]);
        setCargando(true);

        // 2. CONSULTAR LA DIRECCIÓN (Nominatim API)
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&zoom=18&addressdetails=1`;
            const respuesta = await fetch(url);
            const datos = await respuesta.json();
            const direccion = datos.display_name; 
        
            alSeleccionarUbicacion(direccion, latlng); 

        } catch (error) {
            console.error("Error obteniendo dirección:", error);
            alSeleccionarUbicacion(`Coordenadas: ${latlng.lat}, ${latlng.lng}`, latlng);
        } finally {
            setCargando(false);
        }
    };

    return (
        <div style={{ height: "300px", width: "100%", marginBottom: "15px", border: "2px solid #ccc", position: "relative" }}>
            {cargando && (
                <div style={{
                    position: "absolute", zIndex: 1000, top: 10, right: 10, 
                    background: "white", padding: "5px 10px", borderRadius: "5px",
                    boxShadow: "0 0 5px rgba(0,0,0,0.3)", fontWeight: "bold"
                }}>
                    ⌛ Buscando dirección...
                </div>
            )}

            <MapContainer center={posicion} zoom={14} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                <Marker position={posicion}></Marker>
                <ClickManejador alHacerClick={manejarClick} />
            </MapContainer>
        </div>
    );
}

export default SelectorMapa;