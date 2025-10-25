// Google Maps JavaScript API TypeScript definitions
// This extends the window object with Google Maps types

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: typeof google.maps.places;
        event?: typeof google.maps.event;
        TravelMode?: typeof google.maps.TravelMode;
      };
    };
  }
}

export {};
