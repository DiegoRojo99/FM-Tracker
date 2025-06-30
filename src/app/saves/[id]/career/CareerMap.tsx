'use client';

import { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { Tile as TileLayer } from 'ol/layer';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control';
import { defaults as defaultInteractions } from 'ol/interaction';
import { SaveWithChildren } from '@/lib/types/Save';
import FootballLoader from '@/app/components/FootBallLoader';
import { Team } from '@/lib/types/Team';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { Style, Icon } from 'ol/style';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';

type TeamLocationPickerProps = {
  saveDetails: SaveWithChildren;
};

export default function TeamLocationPicker({
  saveDetails,
}: TeamLocationPickerProps) {
  const career = saveDetails.career || [];
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  if (career.length === 0) {
    return <div className="text-center text-gray-500">No career data available.</div>;
  }
  
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<Map | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      if (career.length === 0) return;

      await fetch(`/api/teams/coords?ids=${career.map(stint => stint.teamId).join(',')}`)
        .then(response => response.json())
        .then(data => {
          setTeams(data.teams);
          setLoading(false);
        });
    };

    fetchTeams();
  }, [career]);

  useEffect(() => {
    if (!teams.length) return;
    if (!mapRef.current) return;

    const careerTeamsWithCoords = career.map(stint => {
      const team = teams.find(t => String(t.id) === String(stint.teamId));
      const hasCoords = team?.coordinates && team.coordinates.lat && team.coordinates.lng;
      if (!hasCoords) return null;
      return team;
    }).filter(team => team !== null) as Team[];

    const careerTeamsNumber = careerTeamsWithCoords.length;

    if (!careerTeamsNumber) {
      console.warn('No valid coordinates found in career data.');
      return;
    }

    const firstTeam = careerTeamsWithCoords[0];
    const firstTeamCoords = [
      firstTeam.coordinates.lng,
      firstTeam.coordinates.lat
    ] as [number, number];

    const defaultCoords = firstTeam?.coordinates ? firstTeamCoords : [-0.1276, 51.5074]; // London coordinates
    const view = new View({
      center: fromLonLat(firstTeamCoords || defaultCoords),
      zoom: careerTeamsNumber > 1 ? 4 : 8,
    });

    // Create features for each team with coordinates
    const features = careerTeamsWithCoords.map((team: Team) => {
      const { lng, lat } = team.coordinates;
      if (!lng || !lat) {
        console.warn(`Team ${team.name} does not have valid coordinates.`);
        return null;
      }
      return new Feature({
        geometry: new Point(fromLonLat([lng, lat])),
        name: team.name,
        teamLogo: team.logo,
      });
    }).filter(feature => feature !== null) as Feature[];

    // Set a style with the team logo as marker
    features.forEach(feature => {
      const logoUrl = feature.get('teamLogo');
      feature.setStyle(
        new Style({
          image: new Icon({
            src: logoUrl || '/glove.svg',
            scale: 0.25,
            anchor: [0.5, 1],
          }),
        })
      );
    });

    const vectorSource = new VectorSource({
      features,
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
    });

    const layers = [
      new TileLayer({
        source: new OSM(),
      }),
      vectorLayer,
    ];

    const map = new Map({
      target: mapRef.current,
      layers: layers,
      view,
      controls: defaultControls({ attribution: false, rotate: false }),
      interactions: defaultInteractions(),
    });

    mapInstanceRef.current = map;

    return () => {
      map.setTarget(undefined);
    };
  }, [career, teams]);

  if (loading) {
    return <FootballLoader />;
  }

  return (
    <div
      ref={mapRef}
      className="w-full h-96 rounded-lg border border-gray-300 dark:border-zinc-700"
    />
  );
}
