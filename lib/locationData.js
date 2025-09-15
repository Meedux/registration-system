// Philippine location data using PSGC API
const API_BASE = 'https://psgc.gitlab.io/api';

// Cache for API responses
let cachedRegions = null;
let cachedProvinces = {};
let cachedCities = {};
let cachedBarangays = {};

// Fetch all regions
export const getRegions = async () => {
  if (cachedRegions) {
    return cachedRegions;
  }

  try {
    const response = await fetch(`${API_BASE}/regions/`);
    if (!response.ok) throw new Error('Failed to fetch regions');
    
    const data = await response.json();
    // Map API response to expected format and sort alphabetically
    const formattedData = data.map(region => ({
      code: region.code,
      name: region.name,
      id: region.code // Use code as id for consistency
    })).sort((a, b) => a.name.localeCompare(b.name));
    cachedRegions = formattedData;
    return formattedData;
  } catch (error) {
    console.error('Error fetching regions:', error);
    // Return fallback data with proper PSGC codes, sorted alphabetically
    return [
      { code: '050000000', id: '050000000', name: 'Bicol Region (Region V)' },
      { code: '020000000', id: '020000000', name: 'Cagayan Valley (Region II)' },
      { code: '040000000', id: '040000000', name: 'Calabarzon (Region IV-A)' },
      { code: '030000000', id: '030000000', name: 'Central Luzon (Region III)' },
      { code: '010000000', id: '010000000', name: 'Ilocos Region (Region I)' },
      { code: '170000000', id: '170000000', name: 'Mimaropa (Region IV-B)' },
      { code: '130000000', id: '130000000', name: 'National Capital Region (NCR)' }
    ].sort((a, b) => a.name.localeCompare(b.name));
  }
};

// Fetch cities/municipalities by region code (skipping provinces)
export const getCitiesByRegion = async (regionCode) => {
  const cacheKey = `region_${regionCode}`;
  if (cachedCities[cacheKey]) {
    console.log(`Using cached cities for region: ${regionCode}`);
    return cachedCities[cacheKey];
  }

  console.log(`Fetching cities for region: ${regionCode}`);
  try {
    const response = await fetch(`${API_BASE}/regions/${regionCode}/cities-municipalities/`);
    if (!response.ok) throw new Error('Failed to fetch cities');
    
    const data = await response.json();
    // Map API response to expected format and sort alphabetically
    const formattedData = data.map(city => ({
      code: city.code,
      name: city.name,
      id: city.code // Use code as id for consistency
    })).sort((a, b) => a.name.localeCompare(b.name));
    cachedCities[cacheKey] = formattedData;
    console.log(`Fetched ${formattedData.length} cities for region: ${regionCode}`);
    return formattedData;
  } catch (error) {
    console.error('Error fetching cities:', error);
    
    // Fallback for NCR
    if (regionCode === '130000000' || regionCode === 'NCR') {
      const fallbackCities = [
        { code: '137405000', id: '137405000', name: 'Caloocan City' },
        { code: '137402000', id: '137402000', name: 'Makati City' },
        { code: '137401000', id: '137401000', name: 'Manila' },
        { code: '137407000', id: '137407000', name: 'Parañaque City' },
        { code: '137403000', id: '137403000', name: 'Pasig City' },
        { code: '137404000', id: '137404000', name: 'Quezon City' },
        { code: '137406000', id: '137406000', name: 'Taguig City' }
      ].sort((a, b) => a.name.localeCompare(b.name));
      cachedCities[cacheKey] = fallbackCities;
      return fallbackCities;
    }
    return [];
  }
};

// Legacy function - fetch all provinces (deprecated in favor of direct region-to-city)
export const getProvinces = async () => {
  console.warn('getProvinces() is deprecated. Use getCitiesByRegion() instead.');
  try {
    const regions = await getRegions();
    let allCities = [];
    
    for (const region of regions) {
      const cities = await getCitiesByRegion(region.code);
      allCities = [...allCities, ...cities];
    }
    
    return allCities;
  } catch (error) {
    console.error('Error fetching all cities:', error);
    return [];
  }
};

// Fetch cities/municipalities by province code (on-demand only)
export const getCitiesByProvince = async (provinceCode) => {
  const cacheKey = provinceCode;
  if (cachedCities[cacheKey]) {
    console.log(`Using cached cities for province: ${provinceCode}`);
    return cachedCities[cacheKey];
  }

  console.log(`Fetching cities for province: ${provinceCode}`);
  try {
    const response = await fetch(`${API_BASE}/provinces/${provinceCode}/cities-municipalities/`);
    if (!response.ok) throw new Error('Failed to fetch cities');
    
    const data = await response.json();
    // Map API response to expected format and sort alphabetically
    const formattedData = data.map(city => ({
      code: city.code,
      name: city.name,
      id: city.code // Use code as id for consistency
    })).sort((a, b) => a.name.localeCompare(b.name));
    cachedCities[cacheKey] = formattedData;
    console.log(`Fetched ${formattedData.length} cities for province: ${provinceCode}`);
    return formattedData;
  } catch (error) {
    console.error('Error fetching cities:', error);
    
    // Fallback for NCR
    if (provinceCode === '130000000' || provinceCode === 'NCR') {
      const fallbackCities = [
        { code: '137405000', id: '137405000', name: 'Caloocan City' },
        { code: '137402000', id: '137402000', name: 'Makati City' },
        { code: '137401000', id: '137401000', name: 'Manila' },
        { code: '137407000', id: '137407000', name: 'Parañaque City' },
        { code: '137403000', id: '137403000', name: 'Pasig City' },
        { code: '137404000', id: '137404000', name: 'Quezon City' },
        { code: '137406000', id: '137406000', name: 'Taguig City' }
      ].sort((a, b) => a.name.localeCompare(b.name));
      cachedCities[cacheKey] = fallbackCities;
      return fallbackCities;
    }
    return [];
  }
};

// Fetch barangays by city/municipality code (on-demand only)
export const getBarangaysByCity = async (cityCode) => {
  const cacheKey = cityCode;
  if (cachedBarangays[cacheKey]) {
    console.log(`Using cached barangays for city: ${cityCode}`);
    return cachedBarangays[cacheKey];
  }

  console.log(`Fetching barangays for city: ${cityCode}`);
  try {
    const response = await fetch(`${API_BASE}/cities-municipalities/${cityCode}/barangays/`);
    if (!response.ok) throw new Error('Failed to fetch barangays');
    
    const data = await response.json();
    // Map API response to expected format and sort alphabetically
    const formattedData = data.map(barangay => ({
      code: barangay.code,
      name: barangay.name,
      id: barangay.code // Use code as id for consistency
    })).sort((a, b) => a.name.localeCompare(b.name));
    cachedBarangays[cacheKey] = formattedData;
    console.log(`Fetched ${formattedData.length} barangays for city: ${cityCode}`);
    return formattedData;
  } catch (error) {
    console.error('Error fetching barangays:', error);
    
    // Fallback for Quezon City
    if (cityCode === '137404000' || cityCode === 'QUEZON CITY') {
      const fallbackBarangays = [
        { code: '137404015', id: '137404015', name: 'Bagong Silangan' },
        { code: '137404002', id: '137404002', name: 'Batasan Hills' },
        { code: '137404001', id: '137404001', name: 'Commonwealth' },
        { code: '137404014', id: '137404014', name: 'Don Manuel' },
        { code: '137404004', id: '137404004', name: 'Fairview' },
        { code: '137404005', id: '137404005', name: 'Greater Lagro' },
        { code: '137404013', id: '137404013', name: 'Gulod' },
        { code: '137404003', id: '137404003', name: 'Holy Spirit' },
        { code: '137404012', id: '137404012', name: 'Kaligayahan' },
        { code: '137404008', id: '137404008', name: 'Nagkaisang Nayon' },
        { code: '137404007', id: '137404007', name: 'North Fairview' },
        { code: '137404006', id: '137404006', name: 'Novaliches Proper' },
        { code: '137404009', id: '137404009', name: 'Pasong Putik Proper' },
        { code: '137404016', id: '137404016', name: 'Payatas' },
        { code: '137404010', id: '137404010', name: 'San Bartolome' },
        { code: '137404011', id: '137404011', name: 'Tandang Sora' }
      ].sort((a, b) => a.name.localeCompare(b.name));
      cachedBarangays[cacheKey] = fallbackBarangays;
      return fallbackBarangays;
    }
    return [];
  }
};

// Commonwealth area barangays in Quezon City
export const commonwealthBarangays = [
  { name: 'Commonwealth' },
  { name: 'Batasan Hills' },
  { name: 'Holy Spirit' },
  { name: 'Fairview' },
  { name: 'Greater Lagro' },
  { name: 'Novaliches Proper' },
  { name: 'North Fairview' },
  { name: 'Nagkaisang Nayon' },
  { name: 'Pasong Putik Proper' },
  { name: 'San Bartolome' },
  { name: 'Tandang Sora' },
  { name: 'Kaligayahan' },
  { name: 'Gulod' },
  { name: 'Don Manuel' },
  { name: 'Bagong Silangan' },
  { name: 'Payatas' },
  { name: 'Bagong Pag-asa' }
];

// Quezon City PSGC codes (multiple possible formats)
const QUEZON_CITY_CODES = ['137404000', '1374', '137404'];

// Check if location is from Commonwealth, Quezon City
export const isFromCommonwealth = async (barangayCode, cityCode) => {
  try {
    console.log('isFromCommonwealth called with:', { barangayCode, cityCode });
    
    // First, let's fetch the actual city and barangay names to understand what we're working with
    const cities = await getCitiesByRegion('130000000'); // NCR region code
    const city = cities.find(c => c.code === cityCode);
    console.log('Found city:', city);
    
    if (!city) {
      console.log('City not found with code:', cityCode);
      return false;
    }
    
    // Check if city name contains "Quezon"
    const cityName = city.name.toLowerCase();
    if (!cityName.includes('quezon')) {
      console.log(`City ${city.name} is not Quezon City`);
      return false;
    }
    
    // Now get barangays for this city
    const barangays = await getBarangaysByCity(cityCode);
    const barangay = barangays.find(b => b.code === barangayCode);
    console.log('Found barangay:', barangay);
    
    if (!barangay) {
      console.log('Barangay not found with code:', barangayCode);
      return false;
    }
    
    // Check if barangay name matches any Commonwealth area barangays
    const barangayName = barangay.name.toLowerCase().trim();
    const isCommonwealth = commonwealthBarangays.some(cb => {
      const cbName = cb.name.toLowerCase().trim();
      return (
        cbName === barangayName ||
        barangayName.includes(cbName) ||
        cbName.includes(barangayName) ||
        // Handle common variations
        (cbName === 'commonwealth' && barangayName.includes('commonwealth')) ||
        (cbName === 'holy spirit' && (barangayName.includes('holy') || barangayName.includes('spirit'))) ||
        (cbName === 'fairview' && barangayName.includes('fairview')) ||
        (cbName === 'batasan hills' && (barangayName.includes('batasan') || barangayName.includes('hills')))
      );
    });
    
    console.log(`Barangay "${barangay.name}" is ${isCommonwealth ? '' : 'not '}in Commonwealth area`);
    return isCommonwealth;
    
  } catch (error) {
    console.error('Error validating Commonwealth location:', error);
    return false;
  }
};

// Legacy compatibility functions
export const getCitiesByProvinceName = async (provinceName) => {
  const provinces = await getProvinces();
  const province = provinces.find(p => 
    p.name.toLowerCase().includes(provinceName.toLowerCase()) ||
    provinceName.toLowerCase().includes(p.name.toLowerCase())
  );
  if (!province) return [];
  return await getCitiesByProvince(province.code);
};

export const getBarangaysByCityName = async (cityName, provinceName = 'NCR') => {
  const cities = await getCitiesByProvinceName(provinceName);
  const city = cities.find(c => 
    c.name.toLowerCase().includes(cityName.toLowerCase()) ||
    cityName.toLowerCase().includes(c.name.toLowerCase())
  );
  if (!city) return [];
  return await getBarangaysByCity(city.code);
};

// Load location data on-demand only - no preloading
export const preloadLocationData = async () => {
  try {
    console.log('Initializing location service (on-demand loading)...');
    
    // Only preload regions since they're needed immediately
    await getRegions();
    
    console.log('Location service initialized - provinces, cities and barangays will load on selection');
  } catch (error) {
    console.error('Error initializing location service:', error);
  }
};

// Export legacy philippineLocationData object for backward compatibility
export const philippineLocationData = {
  getProvinces,
  getCitiesByProvince: getCitiesByProvinceName,
  getBarangaysByCity: getBarangaysByCityName
};

const locationService = {
  getRegions,
  getCitiesByRegion,
  getBarangaysByCity,
  // Legacy functions (deprecated)
  getProvinces,
  getCitiesByProvince,
  getCitiesByProvinceName,
  getBarangaysByCityName,
  isFromCommonwealth,
  preloadLocationData,
  commonwealthBarangays
};

export default locationService;
