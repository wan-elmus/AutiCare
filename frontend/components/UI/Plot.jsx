'use client';
import { useState, useRef, useEffect } from 'react';
import Map, {Popup, GeolocateControl, FullscreenControl, Source, Layer, Marker} from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Ensure the Mapbox access token is available
if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
  throw new Error('Mapbox token is required. Please add NEXT_PUBLIC_MAPBOX_TOKEN to your environment variables.');
}

export default function Plot() {
  const [viewState, setViewState] = useState({
    longitude: 36.825363,
    latitude: -1.284919,
    zoom: 11
  });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  let mapRef = useRef(null);

  if(!isClient) return null;
  
  return (
    <>
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      {...viewState}
      onMove={evt => setViewState(evt.viewState)}
      style={{ width: '100%', height: '100%', overflow: 'hidden' }}
      mapStyle="mapbox://styles/mapbox/streets-v9"
      ref={mapRef}
    >
      <FullscreenControl/>
    </Map>
    </>
  );
}