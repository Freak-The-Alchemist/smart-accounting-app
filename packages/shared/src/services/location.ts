interface Location {
  latitude: number;
  longitude: number;
}

export const getCurrentLocation = async (): Promise<Location> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  });
};

export const watchLocation = (
  onLocationChange: (location: Location) => void,
  onError: (error: Error) => void
): number => {
  if (!navigator.geolocation) {
    onError(new Error('Geolocation is not supported by your browser'));
    return -1;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      onLocationChange({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    },
    (error) => {
      onError(error);
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    }
  );
};

export const clearLocationWatch = (watchId: number): void => {
  if (watchId !== -1) {
    navigator.geolocation.clearWatch(watchId);
  }
}; 