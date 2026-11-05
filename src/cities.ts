// name, country, latitude, longitude (east +), standard UTC offset in hours
export type City = { name: string; cc: string; lat: number; lon: number; tz: number };

export const CITIES: City[] = [
  // Cameroon
  { name: 'Douala', cc: 'CM', lat: 4.05, lon: 9.77, tz: 1 }, { name: 'Yaoundé', cc: 'CM', lat: 3.87, lon: 11.52, tz: 1 },
  { name: 'Bafoussam', cc: 'CM', lat: 5.48, lon: 10.42, tz: 1 }, { name: 'Bamenda', cc: 'CM', lat: 5.96, lon: 10.15, tz: 1 },
  { name: 'Dschang', cc: 'CM', lat: 5.45, lon: 10.07, tz: 1 }, { name: 'Bangangté', cc: 'CM', lat: 5.15, lon: 10.52, tz: 1 },
  { name: 'Foumban', cc: 'CM', lat: 5.72, lon: 10.90, tz: 1 }, { name: 'Mbouda', cc: 'CM', lat: 5.63, lon: 10.25, tz: 1 },
  { name: 'Bafang', cc: 'CM', lat: 5.16, lon: 10.18, tz: 1 }, { name: 'Nkongsamba', cc: 'CM', lat: 4.95, lon: 9.94, tz: 1 },
  { name: 'Edéa', cc: 'CM', lat: 3.80, lon: 10.13, tz: 1 }, { name: 'Kribi', cc: 'CM', lat: 2.94, lon: 9.91, tz: 1 },
  { name: 'Limbé', cc: 'CM', lat: 4.02, lon: 9.20, tz: 1 }, { name: 'Buea', cc: 'CM', lat: 4.15, lon: 9.29, tz: 1 },
  { name: 'Kumba', cc: 'CM', lat: 4.64, lon: 9.45, tz: 1 }, { name: 'Ebolowa', cc: 'CM', lat: 2.92, lon: 11.15, tz: 1 },
  { name: 'Bertoua', cc: 'CM', lat: 4.58, lon: 13.68, tz: 1 }, { name: 'Ngaoundéré', cc: 'CM', lat: 7.32, lon: 13.58, tz: 1 },
  { name: 'Garoua', cc: 'CM', lat: 9.30, lon: 13.40, tz: 1 }, { name: 'Maroua', cc: 'CM', lat: 10.59, lon: 14.32, tz: 1 },
  // Italy
  { name: 'Rome', cc: 'IT', lat: 41.90, lon: 12.50, tz: 1 }, { name: 'Milan', cc: 'IT', lat: 45.46, lon: 9.19, tz: 1 },
  { name: 'Naples', cc: 'IT', lat: 40.85, lon: 14.27, tz: 1 }, { name: 'Turin', cc: 'IT', lat: 45.07, lon: 7.69, tz: 1 },
  { name: 'Bologna', cc: 'IT', lat: 44.49, lon: 11.34, tz: 1 }, { name: 'Florence', cc: 'IT', lat: 43.77, lon: 11.26, tz: 1 },
  { name: 'Venice', cc: 'IT', lat: 45.44, lon: 12.32, tz: 1 }, { name: 'Genoa', cc: 'IT', lat: 44.41, lon: 8.93, tz: 1 },
  { name: 'Palermo', cc: 'IT', lat: 38.12, lon: 13.36, tz: 1 }, { name: 'Bari', cc: 'IT', lat: 41.12, lon: 16.87, tz: 1 },
  { name: 'Verona', cc: 'IT', lat: 45.44, lon: 10.99, tz: 1 }, { name: 'Padua', cc: 'IT', lat: 45.41, lon: 11.88, tz: 1 },
  // Africa
  { name: 'Lagos', cc: 'NG', lat: 6.52, lon: 3.38, tz: 1 }, { name: 'Abuja', cc: 'NG', lat: 9.06, lon: 7.49, tz: 1 },
  { name: 'Accra', cc: 'GH', lat: 5.60, lon: -0.19, tz: 0 }, { name: 'Abidjan', cc: 'CI', lat: 5.36, lon: -4.01, tz: 0 },
  { name: 'Dakar', cc: 'SN', lat: 14.69, lon: -17.45, tz: 0 }, { name: 'Libreville', cc: 'GA', lat: 0.39, lon: 9.45, tz: 1 },
  { name: 'Brazzaville', cc: 'CG', lat: -4.27, lon: 15.28, tz: 1 }, { name: 'Kinshasa', cc: 'CD', lat: -4.44, lon: 15.27, tz: 1 },
  { name: 'Malabo', cc: 'GQ', lat: 3.75, lon: 8.78, tz: 1 }, { name: "N'Djamena", cc: 'TD', lat: 12.13, lon: 15.05, tz: 1 },
  { name: 'Bangui', cc: 'CF', lat: 4.36, lon: 18.56, tz: 1 }, { name: 'Nairobi', cc: 'KE', lat: -1.29, lon: 36.82, tz: 3 },
  { name: 'Addis Ababa', cc: 'ET', lat: 9.03, lon: 38.74, tz: 3 }, { name: 'Cairo', cc: 'EG', lat: 30.04, lon: 31.24, tz: 2 },
  { name: 'Johannesburg', cc: 'ZA', lat: -26.20, lon: 28.05, tz: 2 }, { name: 'Casablanca', cc: 'MA', lat: 33.57, lon: -7.59, tz: 1 },
  { name: 'Tunis', cc: 'TN', lat: 36.81, lon: 10.18, tz: 1 }, { name: 'Algiers', cc: 'DZ', lat: 36.75, lon: 3.06, tz: 1 },
  // Europe
  { name: 'Paris', cc: 'FR', lat: 48.86, lon: 2.35, tz: 1 }, { name: 'Marseille', cc: 'FR', lat: 43.30, lon: 5.37, tz: 1 },
  { name: 'Brussels', cc: 'BE', lat: 50.85, lon: 4.35, tz: 1 }, { name: 'London', cc: 'GB', lat: 51.51, lon: -0.13, tz: 0 },
  { name: 'Berlin', cc: 'DE', lat: 52.52, lon: 13.40, tz: 1 }, { name: 'Madrid', cc: 'ES', lat: 40.42, lon: -3.70, tz: 1 },
  { name: 'Lisbon', cc: 'PT', lat: 38.72, lon: -9.14, tz: 0 }, { name: 'Amsterdam', cc: 'NL', lat: 52.37, lon: 4.90, tz: 1 },
  { name: 'Geneva', cc: 'CH', lat: 46.20, lon: 6.14, tz: 1 }, { name: 'Moscow', cc: 'RU', lat: 55.76, lon: 37.62, tz: 3 },
  { name: 'Istanbul', cc: 'TR', lat: 41.01, lon: 28.98, tz: 3 },
  // Americas
  { name: 'New York', cc: 'US', lat: 40.71, lon: -74.01, tz: -5 }, { name: 'Washington', cc: 'US', lat: 38.91, lon: -77.04, tz: -5 },
  { name: 'Atlanta', cc: 'US', lat: 33.75, lon: -84.39, tz: -5 }, { name: 'Houston', cc: 'US', lat: 29.76, lon: -95.37, tz: -6 },
  { name: 'Los Angeles', cc: 'US', lat: 34.05, lon: -118.24, tz: -8 }, { name: 'Montreal', cc: 'CA', lat: 45.50, lon: -73.57, tz: -5 },
  { name: 'Toronto', cc: 'CA', lat: 43.65, lon: -79.38, tz: -5 }, { name: 'São Paulo', cc: 'BR', lat: -23.55, lon: -46.63, tz: -3 },
  { name: 'Port-au-Prince', cc: 'HT', lat: 18.54, lon: -72.34, tz: -5 },
  // Asia
  { name: 'Dubai', cc: 'AE', lat: 25.20, lon: 55.27, tz: 4 }, { name: 'Mumbai', cc: 'IN', lat: 19.08, lon: 72.88, tz: 5.5 },
  { name: 'Delhi', cc: 'IN', lat: 28.61, lon: 77.21, tz: 5.5 }, { name: 'Beijing', cc: 'CN', lat: 39.90, lon: 116.41, tz: 8 },
  { name: 'Shanghai', cc: 'CN', lat: 31.23, lon: 121.47, tz: 8 }, { name: 'Tokyo', cc: 'JP', lat: 35.68, lon: 139.69, tz: 9 },
];

export function searchCities(q: string, max = 6): City[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  const norm = (x: string) => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const t = norm(s);
  return CITIES.filter(c => norm(c.name).includes(t)).slice(0, max);
}
