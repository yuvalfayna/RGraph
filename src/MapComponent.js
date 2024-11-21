//שירות האחראי על יצירה וניהול מופע של מפה

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';

const MapComponent = ({ points }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const drawnItemsRef = useRef(new L.FeatureGroup());
  const drawControlRef = useRef(null);

  useEffect(() => {
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([51.5, -0.09], 2);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(mapInstance.current);
    }

    mapInstance.current.addLayer(drawnItemsRef.current);

    const customIcon = L.icon({
      iconUrl: 'https://uxwing.com/wp-content/themes/uxwing/download/location-travel-map/map-pin-icon.png',
      className: 'custom-icon',
      iconSize: [25, 25],
      iconAnchor: [12, 41],
      popupAnchor: [0, -41],
    });

    const addMarkers = () => {
      markersRef.current.forEach(marker => {
        mapInstance.current.removeLayer(marker);
      });
      markersRef.current = [];

      if (points && points.length > 0) {
        points.forEach(point => {
          const { lat, lng } = point;
          const marker = L.marker([lat, lng], { icon: customIcon });
          const psik = marker.getLatLng().toString().indexOf(',');
          const soger = marker.getLatLng().toString().indexOf(')');
          const popupContent = "Latitude: " + marker.getLatLng().toString().substring(7, psik) + "<br>Longitude: " + marker.getLatLng().toString().substring(psik + 1, soger);
          marker.bindPopup(popupContent);
          marker.addTo(mapInstance.current);
          markersRef.current.push(marker);

          marker.on('mouseover', function () {
            this.openPopup();
          });
          marker.on('mouseout', function () {
            this.closePopup();
          });
        });
      }
    };

    addMarkers();

    if (!drawControlRef.current) {
      drawControlRef.current = new L.Control.Draw({
        edit: {
          featureGroup: drawnItemsRef.current
        },
        draw: {
          polyline: true,
          polygon: true,
          circle: false,
          rectangle: false,
          marker: false,
          circlemarker:false
          
        }
      });
      mapInstance.current.addControl(drawControlRef.current);
    }

    mapInstance.current.on(L.Draw.Event.CREATED, (event) => {
      const layer = event.layer;
      drawnItemsRef.current.addLayer(layer);

      if (layer instanceof L.Polygon) {
        const area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]);
        const popupAreaContent=(`The area is ${area/1000000} square KiloMeters.`);
        layer.bindPopup(popupAreaContent).openPopup();
      }
    });
  }, [points]);
  return <div ref={mapRef} style={{ height: '700px', width: '800px' }} />;
};

export default MapComponent;
