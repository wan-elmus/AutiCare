'use client'
import { useState, useRef, useEffect } from 'react'
import Map, { Popup, GeolocateControl, FullscreenControl, Source, Layer, Marker } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
  console.error('Mapbox token is missing. Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local')
  throw new Error('Mapbox token is required')
}

export default function Plot() {
  const [viewState, setViewState] = useState({
    longitude: 36.825363,
    latitude: -1.284919,
    zoom: 11,
  })
  const [isClient, setIsClient] = useState(false)
  const [mapError, setMapError] = useState(null)
  const mapRef = useRef(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleMapLoad = () => {
    console.log('Plot: Map loaded successfully')
  }

  const handleMapError = (error) => {
    console.error('Plot: Map error:', error)
    setMapError(error.message)
  }

  if (!isClient) return null

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {mapError && <div style={{ color: 'red', position: 'absolute', top: 10, left: 10, zIndex: 10 }}>{mapError}</div>}
      <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v9"
        ref={mapRef}
        onLoad={handleMapLoad}
        onError={handleMapError}
        mapboxTelemetry={false}
      >
        <FullscreenControl />
        <GeolocateControl />
      </Map>
    </div>
  )
}




