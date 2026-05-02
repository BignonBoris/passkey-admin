export {};

declare global {
  interface Window {
  google?: typeof google;
}
}

declare namespace google {
  namespace maps {
    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    interface MapOptions {
      center?: LatLngLiteral;
      zoom?: number;
      disableDefaultUI?: boolean;
      styles?: Array<Record<string, unknown>>;
    }

    class Map {
      constructor(element: HTMLElement, options?: MapOptions);
      setOptions(options: MapOptions): void;
      setCenter(latLng: LatLngLiteral): void;
      setZoom(zoom: number): void;
      fitBounds(bounds: LatLngBounds): void;
    }

    interface MarkerOptions {
      position?: LatLngLiteral;
      map?: Map | null;
      title?: string;
      icon?: string | MarkerIcon;
      label?: string | MarkerLabel;
    }

    interface MarkerLabel {
      text: string;
      color?: string;
      fontSize?: string;
    }

    interface MarkerIcon {
      path: string;
      fillColor?: string;
      fillOpacity?: number;
      strokeColor?: string;
      strokeWeight?: number;
      scale?: number;
    }

    class Marker {
      constructor(options?: MarkerOptions);
      setMap(map: Map | null): void;
      setPosition(position: LatLngLiteral): void;
    }

    class LatLngBounds {
      constructor();
      extend(latLng: LatLngLiteral): LatLngBounds;
    }

    interface PolylineOptions {
      path?: LatLngLiteral[];
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
      map?: Map | null;
    }

    class Polyline {
      constructor(options?: PolylineOptions);
      setMap(map: Map | null): void;
      setPath(path: LatLngLiteral[]): void;
    }

    interface GeocoderRequest {
      address?: string;
      placeId?: string;
    }

    interface GeocoderAddressComponent {
      long_name: string;
      short_name: string;
      types: string[];
    }

    interface GeocoderResult {
      formatted_address: string;
      address_components: GeocoderAddressComponent[];
      geometry: {
        location: {
          lat(): number;
          lng(): number;
        };
      };
      place_id: string;
    }

    class Geocoder {
      geocode(
        request: GeocoderRequest,
        callback: (results: GeocoderResult[] | null, status: string) => void
      ): void;
    }

    namespace places {
      interface AutocompletionRequest {
        input: string;
        componentRestrictions?: {
          country: string | string[];
        };
      }

      interface AutocompletePrediction {
        description: string;
        place_id: string;
      }

      class AutocompleteService {
        getPlacePredictions(
          request: AutocompletionRequest,
          callback: (predictions: AutocompletePrediction[] | null, status: string) => void
        ): void;
      }
    }
  }
}
