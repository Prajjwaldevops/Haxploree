declare module 'react-map-gl' {
    import * as React from 'react';
    import type { MapboxMap, MapboxEvent, Marker as MapboxMarker } from 'mapbox-gl';

    export interface ViewState {
        latitude: number;
        longitude: number;
        zoom: number;
        bearing?: number;
        pitch?: number;
        padding?: { top: number; bottom: number; left: number; right: number };
    }

    export interface ViewStateChangeEvent {
        viewState: ViewState;
        target: MapboxMap;
        originalEvent?: Event;
    }

    export interface MarkerEvent<MarkerT = MapboxMarker, OriginalEventT = Event> {
        originalEvent: OriginalEventT;
        target: MarkerT;
    }

    export interface MapProps {
        mapboxAccessToken?: string;
        mapStyle?: string;
        style?: React.CSSProperties;
        longitude?: number;
        latitude?: number;
        zoom?: number;
        bearing?: number;
        pitch?: number;
        onMove?: (evt: ViewStateChangeEvent) => void;
        onClick?: (evt: MapboxEvent) => void;
        onLoad?: (evt: MapboxEvent) => void;
        children?: React.ReactNode;
        [key: string]: any;
    }

    export interface MarkerProps {
        longitude: number;
        latitude: number;
        anchor?: 'center' | 'left' | 'right' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
        offset?: [number, number];
        rotation?: number;
        onClick?: (evt: MarkerEvent) => void;
        children?: React.ReactNode;
        style?: React.CSSProperties;
        [key: string]: any;
    }

    export interface PopupProps {
        longitude: number;
        latitude: number;
        anchor?: 'center' | 'left' | 'right' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
        offset?: number | [number, number];
        closeButton?: boolean;
        closeOnClick?: boolean;
        onClose?: () => void;
        children?: React.ReactNode;
        className?: string;
        [key: string]: any;
    }

    export interface NavigationControlProps {
        position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
        showCompass?: boolean;
        showZoom?: boolean;
        visualizePitch?: boolean;
    }

    export interface GeolocateControlProps {
        position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
        trackUserLocation?: boolean;
        showUserHeading?: boolean;
        showUserLocation?: boolean;
        positionOptions?: PositionOptions;
    }

    export const Map: React.FC<MapProps>;
    export const Marker: React.FC<MarkerProps>;
    export const Popup: React.FC<PopupProps>;
    export const NavigationControl: React.FC<NavigationControlProps>;
    export const GeolocateControl: React.FC<GeolocateControlProps>;

    export default Map;
}
