'use client';

import { useEffect, useRef } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { Tile as TileLayer } from 'ol/layer';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control';
import { defaults as defaultInteractions } from 'ol/interaction';

type TeamLocationPickerProps = {
  initialCoords?: [number, number]; // [lon, lat]
  onSelect: (coords: [number, number]) => void;
};

export default function TeamLocationPicker({
  initialCoords = [0, 0],
  onSelect,
}: TeamLocationPickerProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const view = new View({
      center: fromLonLat(initialCoords),
      zoom: 4,
    });

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view,
      controls: defaultControls({ attribution: false, rotate: false }),
      interactions: defaultInteractions(),
    });

    map.on('click', (event) => {
      const clickedCoords = toLonLat(event.coordinate) as [number, number];
      onSelect(clickedCoords);
    });

    mapInstanceRef.current = map;

    return () => {
      map.setTarget(undefined);
    };
  }, [initialCoords, onSelect]);

  return (
    <div
      ref={mapRef}
      className="w-full h-96 rounded-lg border border-gray-300 dark:border-zinc-700"
    />
  );
}
