// Philippine location data using third-party API
const PH_API_BASE = 'https://ph-locations-api.buonzz.com/v1';

// Cache for API responses to avoid repeated calls
const locationCache = {
  provinces: null,
  cities: {},
  barangays: {}
};

// Fetch all provinces
export const getProvinces = async () => {
  if (locationCache.provinces) {
    return locationCache.provinces;
  }

  try {
    const response = await fetch(`${PH_API_BASE}/provinces`);
    const data = await response.json();
    locationCache.provinces = data.data || data;
    return locationCache.provinces;
  } catch (error) {
    console.error('Error fetching provinces:', error);
    // Fallback to basic provinces list
    return [
      { id: 1, name: 'Metro Manila' },
      { id: 2, name: 'Rizal' },
      { id: 3, name: 'Bulacan' },
      { id: 4, name: 'Cavite' },
      { id: 5, name: 'Laguna' },
      { id: 6, name: 'Batangas' },
      { id: 7, name: 'Quezon' }
    ];
  }
};

// Fetch cities by province ID
export const getCitiesByProvince = async (provinceId) => {
  if (locationCache.cities[provinceId]) {
    return locationCache.cities[provinceId];
  }

  try {
    const response = await fetch(`${PH_API_BASE}/provinces/${provinceId}/cities`);
    const data = await response.json();
    locationCache.cities[provinceId] = data.data || data;
    return locationCache.cities[provinceId];
  } catch (error) {
    console.error('Error fetching cities:', error);
    
    // Fallback data for Metro Manila (ID: 1)
    if (provinceId === 1 || provinceId === '1') {
      return [
        { id: 1, name: 'Quezon City' },
        { id: 2, name: 'Manila' },
        { id: 3, name: 'Makati' },
        { id: 4, name: 'Pasig' },
        { id: 5, name: 'Caloocan' },
        { id: 6, name: 'Taguig' },
        { id: 7, name: 'Parañaque' },
        { id: 8, name: 'Las Piñas' },
        { id: 9, name: 'Muntinlupa' },
        { id: 10, name: 'Marikina' },
        { id: 11, name: 'Pasay' },
        { id: 12, name: 'Valenzuela' },
        { id: 13, name: 'Navotas' },
        { id: 14, name: 'Malabon' },
        { id: 15, name: 'Mandaluyong' },
        { id: 16, name: 'San Juan' },
        { id: 17, name: 'Pateros' }
      ];
    }
    return [];
  }
};

// Fetch barangays by city ID
export const getBarangaysByCity = async (cityId) => {
  if (locationCache.barangays[cityId]) {
    return locationCache.barangays[cityId];
  }

  try {
    const response = await fetch(`${PH_API_BASE}/cities/${cityId}/barangays`);
    const data = await response.json();
    locationCache.barangays[cityId] = data.data || data;
    return locationCache.barangays[cityId];
  } catch (error) {
    console.error('Error fetching barangays:', error);
    
    // Fallback data for Quezon City (ID: 1)
    if (cityId === 1 || cityId === '1') {
      return [
        { id: 1, name: 'Alicia' },
        { id: 2, name: 'Bagong Pag-asa' },
        { id: 3, name: 'Bahay Toro' },
        { id: 4, name: 'Balingasa' },
        { id: 5, name: 'Bungad' },
        { id: 6, name: 'Commonwealth' },
        { id: 7, name: 'Culiat' },
        { id: 8, name: 'Fairview' },
        { id: 9, name: 'Greater Lagro' },
        { id: 10, name: 'Holy Spirit' },
        { id: 11, name: 'Kaligayahan' },
        { id: 12, name: 'Nagkaisang Nayon' },
        { id: 13, name: 'North Fairview' },
        { id: 14, name: 'Novaliches Proper' },
        { id: 15, name: 'Pasong Putik Proper' },
        { id: 16, name: 'San Bartolome' },
        { id: 17, name: 'Tandang Sora' },
        { id: 18, name: 'Batasan Hills' },
        { id: 19, name: 'Payatas' },
        { id: 20, name: 'Bagong Silangan' },
        { id: 21, name: 'Don Manuel' },
        { id: 22, name: 'Gulod' }
      ];
    }
    return [];
  }
};

// Commonwealth-specific barangays for validation
export const commonwealthBarangays = [
  'Commonwealth', 'Batasan Hills', 'Holy Spirit', 'Fairview', 'Greater Lagro',
  'Novaliches Proper', 'North Fairview', 'Nagkaisang Nayon', 'Pasong Putik Proper',
  'Don Manuel', 'Gulod', 'Kaligayahan', 'San Bartolome', 'Tandang Sora'
];

// Check if location is from Commonwealth
export const isFromCommonwealth = (barangayName, cityName) => {
  if (cityName !== 'Quezon City') return false;
  return commonwealthBarangays.includes(barangayName);
};

// Legacy functions for backward compatibility
export const getCitiesByProvinceName = async (provinceName) => {
  const provinces = await getProvinces();
  const province = provinces.find(p => p.name === provinceName);
  if (!province) return [];
  return await getCitiesByProvince(province.code);
};

export const getBarangaysByCityName = async (cityName, provinceName = 'Metro Manila') => {
  const cities = await getCitiesByProvinceName(provinceName);
  const city = cities.find(c => c.name === cityName);
  if (!city) return [];
  return await getBarangaysByCity(city.code);
};

// Preload common data
export const preloadLocationData = async () => {
  try {
    // Preload provinces
    await getProvinces();
    
    // Preload Metro Manila cities
    const provinces = await getProvinces();
    const metroManila = provinces.find(p => p.name === 'Metro Manila');
    if (metroManila) {
      await getCitiesByProvince(metroManila.code);
      
      // Preload Quezon City barangays
      const cities = await getCitiesByProvince(metroManila.code);
      const quezoneCity = cities.find(c => c.name === 'Quezon City');
      if (quezoneCity) {
        await getBarangaysByCity(quezoneCity.code);
      }
    }
  } catch (error) {
    console.error('Error preloading location data:', error);
  }
};

// Export for legacy compatibility
export const philippineLocationData = {
  getProvinces,
  getCitiesByProvince: getCitiesByProvinceName,
  getBarangaysByCity: getBarangaysByCityName
};

const locationAPI = {
  getProvinces,
  getCitiesByProvince,
  getBarangaysByCity,
  getCitiesByProvinceName,
  getBarangaysByCityName,
  isFromCommonwealth,
  preloadLocationData
};

export default locationAPI;
