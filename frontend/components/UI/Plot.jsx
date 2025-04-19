'use client';

import { useState, useRef, useEffect } from 'react';
import useSWR from "swr";
import { fetcher } from '../../app/lib/data';
import { Map, Popup, GeolocateControl, FullscreenControl, Source, Layer, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { SearchBox } from '@mapbox/search-js-react';
import Spinner from './Spinner';

// Ensure the Mapbox access token is available
if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
  throw new Error('Mapbox token is required. Please add NEXT_PUBLIC_MAPBOX_TOKEN to your environment variables.');
}

export  function Stats() {
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

export default function Plot({Destinations, Mode, Origin, query}) {
  let [inputValue, setInputValue] = useState("");
  let [origin, setOrigin] = Origin;
  let [destinations, setDestinations] = Destinations;
  let [mode, _] = Mode;
  const [viewState, setViewState] = useState({
    longitude: origin[0],
    latitude: origin[1],
    zoom: 14
  });
  let [url, setUrl] = useState(`https://api.mapbox.com/directions/v5/mapbox/${mode}/${(destinations.length==0?[origin, origin]:[origin, ...destinations]).map((d)=>d.join(",")).join(";")}?alternatives=true&geometries=geojson&language=en&overview=full&steps=true&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`);
  let [popupData, setPopupData] = useState(null);

  useEffect(() => {
    setUrl(`https://api.mapbox.com/directions/v5/mapbox/${mode}/${(destinations.length==0?[origin, origin]:[origin, ...destinations]).map((d)=>d.join(",")).join(";")}?alternatives=true&geometries=geojson&language=en&overview=full&steps=true&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`);
  }, [origin, destinations, mode]);
  
  useEffect(() => {
    mutate();
  }, [url]);
  
  let mapRef = useRef(null);

  // https://api.mapbox.com/directions/v5/{profile}/{coordinates}
  let { data, isError, isLoading, mutate } = useSWR([url,{}], fetcher,{
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      errorRetryInterval: 3000000
  });

//   if(isLoading || isError) return <div className='w-full h-full'><Spinner/></div>
  if(isLoading || isError) return <p>Loading</p>

  const handleClick = (e) => {
    let coords = e.lngLat;
    coords = Object.values(coords);
    setDestinations((prevDestinations) => [...prevDestinations, coords]);
  }

  const handleHover = (e) => {
    const { features, lngLat } = e;
    let coords = Object.values(lngLat);
    const feature = features && features[0];
    if(feature){
      let data = query(feature?.properties?.coords)
      setPopupData({
        latitude: data.latitude,
        longitude: data.longitude,
        name: data.name,
        address: data.address,
        order: data.order
      });
    } else if(popupData != null) setPopupData(null);
  }

  const lineStyle = {
    id: "roadLayer",
    type: "line",
    layout: {
      "line-join": "round",
      "line-cap": "round"
    },
    paint: {
      "line-color": "#6D31ED",
      "line-width": 4,
      "line-opacity": 0.95
    }
  };

  const pointStyle = {
    id: "point",
    type: "circle",
    source:{
      type: "geojson",
    },
    paint: {
      "circle-radius": 10,
      "circle-color": "#15ABFF"
    }
  };

  const numberStyle = {
    id: 'pointNumbers',
    type: 'symbol',
    layout: {
      'text-field': ['get', 'number'], // This will get the 'number' property from each feature
      'text-size': 12,                 // Adjust the size of the numbers
      'text-offset': [0, 1],           // Position the text slightly above the point
      'text-anchor': 'top',            // Anchor the text at the top
    },
    paint: {
      'text-color': '#000000',         // Choose a color for the numbers
    },
  };

  return (
    <>
    <div className="absolute right-1 z-50 bg-white top-1/2 p-2 rounded-lg">
      <p>Distance: <span className='font-semibold'>{((data?.routes[0]?.distance)/1000).toFixed(2)} Km</span></p>
      <p>Duration: <span className='font-semibold'>{((data?.routes[0]?.duration)/60).toFixed(2)} m</span></p>
    </div>
    <SearchBox
      placeholder="Search apartment..."
      accessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      onSelectionChange={(selection) => {
        setViewport({
          ...viewport,
          latitude: selection.center[1],
          longitude: selection.center[0],
        });
      }}
      map={mapRef.current}
      value={inputValue}
      onChange={(d) => {setInputValue(d)}}
      options={{
        country: "KE"
      }}
    />
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      {...viewState}
      onMove={evt => setViewState(evt.viewState)}
      onMouseMove={handleHover}
      interactiveLayerIds={['point']}
      onClick={handleClick}
      style={{ width: '100%', height: '100%', overflow: 'hidden' }}
      mapStyle="mapbox://styles/mapbox/streets-v9"
      ref={mapRef}
    >
      <Source id="route" type="geojson" data={{
        type: 'FeatureCollection',
        features: [
          {
            "type": "feature",
            "geometry": {
              "type": "LineString",
              "coordinates": data?.routes[0].geometry.coordinates
            }
          }
        ]
      }}>
        <Layer {...lineStyle}/>
      </Source>

      <Source
        id="points"
        type="geojson"
        data={{
          type: 'FeatureCollection',
          features: destinations.map((destination, index) => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: destination,
            },
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

      <GeolocateControl/>
      <FullscreenControl/>
      {
        popupData &&
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
      }
      <Marker latitude={origin[1]} longitude={origin[0]}/>
    </Map>
    </>
  );
}