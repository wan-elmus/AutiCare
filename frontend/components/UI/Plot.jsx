'use client';

import { useState, useRef, useEffect } from 'react';
import useSWR from "swr";
import { fetcher } from '../../app/lib/data';
import { Map, Popup, GeolocateControl, FullscreenControl, Source, Layer, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { SearchBox } from '@mapbox/search-js-react';
import Spinner from './Spinner';

if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
  throw new Error('Mapbox token is required. Please add NEXT_PUBLIC_MAPBOX_TOKEN to your environment variables.');
}

export function Stats() {
  const [viewState, setViewState] = useState({
    longitude: 36.825363,
    latitude: -1.284919,
    zoom: 11
  });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  const mapRef = useRef(null);

  if (!isClient) return null;

  return (
    <Map
      {...viewState}
      onMove={evt => setViewState(evt.viewState)}
      style={{ width: '100%', height: '100%', overflow: 'hidden' }}
      mapStyle="https://demotiles.maplibre.org/style.json"
      ref={mapRef}
    >
      <FullscreenControl />
    </Map>
  );
}

export default function Plot({ Destinations, Mode, Origin, query }) {
    const [inputValue, setInputValue] = useState("");
  
    const [origin, setOrigin] = Origin || [[36.8219, -1.2921], () => {}]; // Default to Nairobi
    const [destinations, setDestinations] = Destinations || [[], () => {}];
    const [mode] = Mode || ['driving'];
    const [popupData, setPopupData] = useState(null);
  
    // Safe origin fallback
    const safeOrigin = Array.isArray(origin) &&
      origin.length === 2 &&
      typeof origin[0] === 'number' &&
      typeof origin[1] === 'number'
      ? origin
      : [36.8219, -1.2921];
  
    const [viewState, setViewState] = useState({
      longitude: safeOrigin[0],
      latitude: safeOrigin[1],
      zoom: 14,
    });
  
    const cleanDestinations = (destinations || []).filter(
      d => Array.isArray(d) && d.length === 2 && typeof d[0] === 'number' && typeof d[1] === 'number'
    );
  
    const allCoords = [safeOrigin, ...cleanDestinations];
    const coordsStr = allCoords.map(d => d.join(',')).join(';');
  
    const [url, setUrl] = useState(
      `https://api.mapbox.com/directions/v5/mapbox/${mode}/${coordsStr}?alternatives=true&geometries=geojson&language=en&overview=full&steps=true&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
    );
  
    useEffect(() => {
      const updatedCoordsStr = [safeOrigin, ...cleanDestinations]
        .map(d => d.join(','))
        .join(';');
  
      setUrl(
        `https://api.mapbox.com/directions/v5/mapbox/${mode}/${updatedCoordsStr}?alternatives=true&geometries=geojson&language=en&overview=full&steps=true&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
      );
    }, [safeOrigin, cleanDestinations, mode]);
  
    const mapRef = useRef(null);
  
    const { data, isError, isLoading, mutate } = useSWR([url, {}], fetcher, {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      errorRetryInterval: 3000000,
    });
  
    useEffect(() => {
      mutate();
    }, [url]);
  
    if (isLoading || isError) return <p>Loading</p>;
  
    const handleClick = (e) => {
      const coords = [e.lngLat.lng, e.lngLat.lat];
      setDestinations(prev => [...prev, coords]);
    };
  
    const handleHover = (e) => {
      const { features, lngLat } = e;
      const feature = features && features[0];
      if (feature) {
        const data = query(feature?.properties?.coords);
        if (data) {
          setPopupData({
            latitude: data.latitude,
            longitude: data.longitude,
            name: data.name,
            address: data.address,
            order: data.order,
          });
        }
      } else if (popupData != null) {
        setPopupData(null);
      }
    };
  
    const lineStyle = {
      id: "roadLayer",
      type: "line",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": "#6D31ED", "line-width": 4, "line-opacity": 0.95 },
    };
  
    const pointStyle = {
      id: "point",
      type: "circle",
      paint: {
        "circle-radius": 10,
        "circle-color": "#15ABFF",
      },
    };
  
    const numberStyle = {
      id: 'pointNumbers',
      type: 'symbol',
      layout: {
        'text-field': ['get', 'number'],
        'text-size': 12,
        'text-offset': [0, 1],
        'text-anchor': 'top',
      },
      paint: {
        'text-color': '#000000',
      },
    };
  
    return (
      <>
        <div className="absolute right-1 z-50 bg-white top-1/2 p-2 rounded-lg">
          <p>Distance: <span className='font-semibold'>{((data?.routes[0]?.distance) / 1000).toFixed(2)} Km</span></p>
          <p>Duration: <span className='font-semibold'>{((data?.routes[0]?.duration) / 60).toFixed(2)} m</span></p>
        </div>
  
        <SearchBox
          placeholder="Search apartment..."
          accessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
          onSelectionChange={(selection) => {
            setViewState({
              ...viewState,
              latitude: selection.center[1],
              longitude: selection.center[0],
            });
          }}
          map={mapRef.current}
          value={inputValue}
          onChange={setInputValue}
          options={{ country: "KE" }}
        />
  
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          onMouseMove={handleHover}
          interactiveLayerIds={['point']}
          onClick={handleClick}
          style={{ width: '100%', height: '100%', overflow: 'hidden' }}
          mapStyle="https://demotiles.maplibre.org/style.json"
          ref={mapRef}
        >
          <Source
            id="route"
            type="geojson"
            data={{
              type: 'Feature',
              geometry: data?.routes[0]?.geometry || { type: "LineString", coordinates: [] }
            }}
          >
            <Layer {...lineStyle} />
          </Source>
  
          <Source
            id="points"
            type="geojson"
            data={{
              type: 'FeatureCollection',
              features: cleanDestinations.map((destination, index) => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: destination },
                properties: {
                  number: index + 1,
                  coords: destination,
                },
              })),
            }}
          >
            <Layer {...pointStyle} />
            <Layer {...numberStyle} />
          </Source>
  
          <GeolocateControl />
          <FullscreenControl />
  
          {popupData && !isNaN(popupData.longitude) && !isNaN(popupData.latitude) && (
            <Popup
              longitude={popupData.longitude}
              latitude={popupData.latitude}
              closeButton={false}
              closeOnClick={false}
              anchor="top"
            >
              <div>
                <strong>{popupData.name}</strong>
                <p>{popupData.address}</p>
                <p>Order: {popupData.order}</p>
              </div>
            </Popup>
          )}
  
          {!isNaN(safeOrigin[0]) && !isNaN(safeOrigin[1]) && (
            <Marker latitude={safeOrigin[1]} longitude={safeOrigin[0]} />
          )}
        </Map>
      </>
    );
  }
  