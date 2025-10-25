// Database of major US cities, neighborhoods, and boroughs
export const US_CITIES = [
  // California - Los Angeles Area
  { city: 'Los Angeles', state: 'CA', display: 'Los Angeles, CA' },
  { city: 'Downtown LA', state: 'CA', display: 'Downtown LA, CA' },
  { city: 'Hollywood', state: 'CA', display: 'Hollywood, CA' },
  { city: 'Santa Monica', state: 'CA', display: 'Santa Monica, CA' },
  { city: 'Venice', state: 'CA', display: 'Venice, CA' },
  { city: 'Beverly Hills', state: 'CA', display: 'Beverly Hills, CA' },
  { city: 'West Hollywood', state: 'CA', display: 'West Hollywood, CA' },
  { city: 'Pasadena', state: 'CA', display: 'Pasadena, CA' },
  { city: 'Glendale', state: 'CA', display: 'Glendale, CA' },
  { city: 'Burbank', state: 'CA', display: 'Burbank, CA' },
  { city: 'Long Beach', state: 'CA', display: 'Long Beach, CA' },
  { city: 'Culver City', state: 'CA', display: 'Culver City, CA' },

  // California - San Francisco Bay Area
  { city: 'San Francisco', state: 'CA', display: 'San Francisco, CA' },
  { city: 'Downtown SF', state: 'CA', display: 'Downtown SF, CA' },
  { city: 'SOMA', state: 'CA', display: 'SOMA, San Francisco, CA' },
  { city: 'Mission District', state: 'CA', display: 'Mission District, San Francisco, CA' },
  { city: 'Marina District', state: 'CA', display: 'Marina District, San Francisco, CA' },
  { city: 'Oakland', state: 'CA', display: 'Oakland, CA' },
  { city: 'Berkeley', state: 'CA', display: 'Berkeley, CA' },
  { city: 'Palo Alto', state: 'CA', display: 'Palo Alto, CA' },
  { city: 'San Jose', state: 'CA', display: 'San Jose, CA' },
  { city: 'Santa Clara', state: 'CA', display: 'Santa Clara, CA' },
  { city: 'Mountain View', state: 'CA', display: 'Mountain View, CA' },
  { city: 'Sunnyvale', state: 'CA', display: 'Sunnyvale, CA' },
  { city: 'Fremont', state: 'CA', display: 'Fremont, CA' },

  // California - San Diego Area
  { city: 'San Diego', state: 'CA', display: 'San Diego, CA' },
  { city: 'La Jolla', state: 'CA', display: 'La Jolla, San Diego, CA' },
  { city: 'Pacific Beach', state: 'CA', display: 'Pacific Beach, San Diego, CA' },
  { city: 'Gaslamp Quarter', state: 'CA', display: 'Gaslamp Quarter, San Diego, CA' },

  // California - Other Cities
  { city: 'Sacramento', state: 'CA', display: 'Sacramento, CA' },
  { city: 'Fresno', state: 'CA', display: 'Fresno, CA' },
  { city: 'Irvine', state: 'CA', display: 'Irvine, CA' },
  { city: 'Anaheim', state: 'CA', display: 'Anaheim, CA' },

  // New York - NYC Boroughs & Neighborhoods
  { city: 'New York', state: 'NY', display: 'New York, NY' },
  { city: 'Manhattan', state: 'NY', display: 'Manhattan, NY' },
  { city: 'Brooklyn', state: 'NY', display: 'Brooklyn, NY' },
  { city: 'Queens', state: 'NY', display: 'Queens, NY' },
  { city: 'Bronx', state: 'NY', display: 'Bronx, NY' },
  { city: 'Staten Island', state: 'NY', display: 'Staten Island, NY' },
  { city: 'Williamsburg', state: 'NY', display: 'Williamsburg, Brooklyn, NY' },
  { city: 'Park Slope', state: 'NY', display: 'Park Slope, Brooklyn, NY' },
  { city: 'DUMBO', state: 'NY', display: 'DUMBO, Brooklyn, NY' },
  { city: 'Astoria', state: 'NY', display: 'Astoria, Queens, NY' },
  { city: 'Flushing', state: 'NY', display: 'Flushing, Queens, NY' },
  { city: 'Harlem', state: 'NY', display: 'Harlem, Manhattan, NY' },
  { city: 'Upper East Side', state: 'NY', display: 'Upper East Side, Manhattan, NY' },
  { city: 'Upper West Side', state: 'NY', display: 'Upper West Side, Manhattan, NY' },
  { city: 'Greenwich Village', state: 'NY', display: 'Greenwich Village, Manhattan, NY' },
  { city: 'SoHo', state: 'NY', display: 'SoHo, Manhattan, NY' },
  { city: 'Tribeca', state: 'NY', display: 'Tribeca, Manhattan, NY' },
  { city: 'Chelsea', state: 'NY', display: 'Chelsea, Manhattan, NY' },
  { city: 'Midtown', state: 'NY', display: 'Midtown, Manhattan, NY' },
  { city: 'Lower East Side', state: 'NY', display: 'Lower East Side, Manhattan, NY' },
  { city: 'East Village', state: 'NY', display: 'East Village, Manhattan, NY' },
  { city: 'West Village', state: 'NY', display: 'West Village, Manhattan, NY' },

  // New York - Other Cities
  { city: 'Buffalo', state: 'NY', display: 'Buffalo, NY' },
  { city: 'Rochester', state: 'NY', display: 'Rochester, NY' },
  { city: 'Albany', state: 'NY', display: 'Albany, NY' },
  { city: 'Syracuse', state: 'NY', display: 'Syracuse, NY' },

  // Texas - Houston Area
  { city: 'Houston', state: 'TX', display: 'Houston, TX' },
  { city: 'Downtown Houston', state: 'TX', display: 'Downtown Houston, TX' },
  { city: 'Midtown Houston', state: 'TX', display: 'Midtown Houston, TX' },
  { city: 'The Heights', state: 'TX', display: 'The Heights, Houston, TX' },
  { city: 'Montrose', state: 'TX', display: 'Montrose, Houston, TX' },

  // Texas - Dallas/Fort Worth Area
  { city: 'Dallas', state: 'TX', display: 'Dallas, TX' },
  { city: 'Downtown Dallas', state: 'TX', display: 'Downtown Dallas, TX' },
  { city: 'Uptown Dallas', state: 'TX', display: 'Uptown Dallas, TX' },
  { city: 'Deep Ellum', state: 'TX', display: 'Deep Ellum, Dallas, TX' },
  { city: 'Fort Worth', state: 'TX', display: 'Fort Worth, TX' },
  { city: 'Plano', state: 'TX', display: 'Plano, TX' },

  // Texas - Austin Area
  { city: 'Austin', state: 'TX', display: 'Austin, TX' },
  { city: 'Downtown Austin', state: 'TX', display: 'Downtown Austin, TX' },
  { city: 'South Congress', state: 'TX', display: 'South Congress, Austin, TX' },
  { city: 'East Austin', state: 'TX', display: 'East Austin, TX' },
  { city: 'Zilker', state: 'TX', display: 'Zilker, Austin, TX' },

  // Texas - Other Cities
  { city: 'San Antonio', state: 'TX', display: 'San Antonio, TX' },
  { city: 'El Paso', state: 'TX', display: 'El Paso, TX' },

  // Florida - Miami Area
  { city: 'Miami', state: 'FL', display: 'Miami, FL' },
  { city: 'Miami Beach', state: 'FL', display: 'Miami Beach, FL' },
  { city: 'South Beach', state: 'FL', display: 'South Beach, Miami, FL' },
  { city: 'Brickell', state: 'FL', display: 'Brickell, Miami, FL' },
  { city: 'Wynwood', state: 'FL', display: 'Wynwood, Miami, FL' },
  { city: 'Coconut Grove', state: 'FL', display: 'Coconut Grove, Miami, FL' },
  { city: 'Coral Gables', state: 'FL', display: 'Coral Gables, FL' },
  { city: 'Fort Lauderdale', state: 'FL', display: 'Fort Lauderdale, FL' },

  // Florida - Other Cities
  { city: 'Orlando', state: 'FL', display: 'Orlando, FL' },
  { city: 'Tampa', state: 'FL', display: 'Tampa, FL' },
  { city: 'Jacksonville', state: 'FL', display: 'Jacksonville, FL' },

  // Illinois - Chicago Area
  { city: 'Chicago', state: 'IL', display: 'Chicago, IL' },
  { city: 'Downtown Chicago', state: 'IL', display: 'Downtown Chicago, IL' },
  { city: 'The Loop', state: 'IL', display: 'The Loop, Chicago, IL' },
  { city: 'Lincoln Park', state: 'IL', display: 'Lincoln Park, Chicago, IL' },
  { city: 'Wicker Park', state: 'IL', display: 'Wicker Park, Chicago, IL' },
  { city: 'Wrigleyville', state: 'IL', display: 'Wrigleyville, Chicago, IL' },
  { city: 'River North', state: 'IL', display: 'River North, Chicago, IL' },
  { city: 'West Loop', state: 'IL', display: 'West Loop, Chicago, IL' },
  { city: 'Lakeview', state: 'IL', display: 'Lakeview, Chicago, IL' },
  { city: 'Gold Coast', state: 'IL', display: 'Gold Coast, Chicago, IL' },
  { city: 'Aurora', state: 'IL', display: 'Aurora, IL' },
  { city: 'Naperville', state: 'IL', display: 'Naperville, IL' },

  // Pennsylvania - Philadelphia Area
  { city: 'Philadelphia', state: 'PA', display: 'Philadelphia, PA' },
  { city: 'Center City', state: 'PA', display: 'Center City, Philadelphia, PA' },
  { city: 'Old City', state: 'PA', display: 'Old City, Philadelphia, PA' },
  { city: 'University City', state: 'PA', display: 'University City, Philadelphia, PA' },
  { city: 'Fishtown', state: 'PA', display: 'Fishtown, Philadelphia, PA' },
  { city: 'Pittsburgh', state: 'PA', display: 'Pittsburgh, PA' },

  // Arizona - Phoenix Area
  { city: 'Phoenix', state: 'AZ', display: 'Phoenix, AZ' },
  { city: 'Downtown Phoenix', state: 'AZ', display: 'Downtown Phoenix, AZ' },
  { city: 'Scottsdale', state: 'AZ', display: 'Scottsdale, AZ' },
  { city: 'Tempe', state: 'AZ', display: 'Tempe, AZ' },
  { city: 'Mesa', state: 'AZ', display: 'Mesa, AZ' },
  { city: 'Tucson', state: 'AZ', display: 'Tucson, AZ' },

  // Washington - Seattle Area
  { city: 'Seattle', state: 'WA', display: 'Seattle, WA' },
  { city: 'Downtown Seattle', state: 'WA', display: 'Downtown Seattle, WA' },
  { city: 'Capitol Hill', state: 'WA', display: 'Capitol Hill, Seattle, WA' },
  { city: 'Fremont', state: 'WA', display: 'Fremont, Seattle, WA' },
  { city: 'Ballard', state: 'WA', display: 'Ballard, Seattle, WA' },
  { city: 'Queen Anne', state: 'WA', display: 'Queen Anne, Seattle, WA' },
  { city: 'Bellevue', state: 'WA', display: 'Bellevue, WA' },
  { city: 'Tacoma', state: 'WA', display: 'Tacoma, WA' },
  { city: 'Spokane', state: 'WA', display: 'Spokane, WA' },

  // Massachusetts - Boston Area
  { city: 'Boston', state: 'MA', display: 'Boston, MA' },
  { city: 'Downtown Boston', state: 'MA', display: 'Downtown Boston, MA' },
  { city: 'Back Bay', state: 'MA', display: 'Back Bay, Boston, MA' },
  { city: 'South End', state: 'MA', display: 'South End, Boston, MA' },
  { city: 'Beacon Hill', state: 'MA', display: 'Beacon Hill, Boston, MA' },
  { city: 'North End', state: 'MA', display: 'North End, Boston, MA' },
  { city: 'Seaport', state: 'MA', display: 'Seaport, Boston, MA' },
  { city: 'Cambridge', state: 'MA', display: 'Cambridge, MA' },
  { city: 'Somerville', state: 'MA', display: 'Somerville, MA' },
  { city: 'Brookline', state: 'MA', display: 'Brookline, MA' },
  { city: 'Worcester', state: 'MA', display: 'Worcester, MA' },

  // Colorado - Denver Area
  { city: 'Denver', state: 'CO', display: 'Denver, CO' },
  { city: 'Downtown Denver', state: 'CO', display: 'Downtown Denver, CO' },
  { city: 'LoDo', state: 'CO', display: 'LoDo, Denver, CO' },
  { city: 'Capitol Hill Denver', state: 'CO', display: 'Capitol Hill, Denver, CO' },
  { city: 'RiNo', state: 'CO', display: 'RiNo, Denver, CO' },
  { city: 'Boulder', state: 'CO', display: 'Boulder, CO' },
  { city: 'Colorado Springs', state: 'CO', display: 'Colorado Springs, CO' },

  // Michigan
  { city: 'Detroit', state: 'MI', display: 'Detroit, MI' },
  { city: 'Grand Rapids', state: 'MI', display: 'Grand Rapids, MI' },
  { city: 'Ann Arbor', state: 'MI', display: 'Ann Arbor, MI' },

  // Georgia - Atlanta Area
  { city: 'Atlanta', state: 'GA', display: 'Atlanta, GA' },
  { city: 'Downtown Atlanta', state: 'GA', display: 'Downtown Atlanta, GA' },
  { city: 'Midtown Atlanta', state: 'GA', display: 'Midtown Atlanta, GA' },
  { city: 'Buckhead', state: 'GA', display: 'Buckhead, Atlanta, GA' },
  { city: 'Virginia Highland', state: 'GA', display: 'Virginia Highland, Atlanta, GA' },
  { city: 'Decatur', state: 'GA', display: 'Decatur, GA' },
  { city: 'Savannah', state: 'GA', display: 'Savannah, GA' },
  { city: 'Augusta', state: 'GA', display: 'Augusta, GA' },

  // North Carolina - Charlotte/Raleigh Area
  { city: 'Charlotte', state: 'NC', display: 'Charlotte, NC' },
  { city: 'Uptown Charlotte', state: 'NC', display: 'Uptown Charlotte, NC' },
  { city: 'NoDa', state: 'NC', display: 'NoDa, Charlotte, NC' },
  { city: 'Raleigh', state: 'NC', display: 'Raleigh, NC' },
  { city: 'Durham', state: 'NC', display: 'Durham, NC' },

  // Oregon - Portland Area
  { city: 'Portland', state: 'OR', display: 'Portland, OR' },
  { city: 'Downtown Portland', state: 'OR', display: 'Downtown Portland, OR' },
  { city: 'Pearl District', state: 'OR', display: 'Pearl District, Portland, OR' },
  { city: 'Alberta Arts', state: 'OR', display: 'Alberta Arts, Portland, OR' },
  { city: 'Hawthorne', state: 'OR', display: 'Hawthorne, Portland, OR' },
  { city: 'Eugene', state: 'OR', display: 'Eugene, OR' },

  // Nevada
  { city: 'Las Vegas', state: 'NV', display: 'Las Vegas, NV' },
  { city: 'Reno', state: 'NV', display: 'Reno, NV' },

  // Tennessee
  { city: 'Nashville', state: 'TN', display: 'Nashville, TN' },
  { city: 'Memphis', state: 'TN', display: 'Memphis, TN' },

  // Washington DC Area
  { city: 'Washington', state: 'DC', display: 'Washington, DC' },
  { city: 'Downtown DC', state: 'DC', display: 'Downtown DC' },
  { city: 'Georgetown', state: 'DC', display: 'Georgetown, DC' },
  { city: 'Dupont Circle', state: 'DC', display: 'Dupont Circle, DC' },
  { city: 'Adams Morgan', state: 'DC', display: 'Adams Morgan, DC' },
  { city: 'U Street', state: 'DC', display: 'U Street, DC' },
  { city: 'Capitol Hill DC', state: 'DC', display: 'Capitol Hill, DC' },
  { city: 'Navy Yard', state: 'DC', display: 'Navy Yard, DC' },
  { city: 'Arlington', state: 'VA', display: 'Arlington, VA' },
  { city: 'Alexandria', state: 'VA', display: 'Alexandria, VA' },

  // Maryland - Baltimore Area
  { city: 'Baltimore', state: 'MD', display: 'Baltimore, MD' },
  { city: 'Inner Harbor', state: 'MD', display: 'Inner Harbor, Baltimore, MD' },
  { city: 'Fells Point', state: 'MD', display: 'Fells Point, Baltimore, MD' },

  // Wisconsin
  { city: 'Milwaukee', state: 'WI', display: 'Milwaukee, WI' },
  { city: 'Madison', state: 'WI', display: 'Madison, WI' },

  // Minnesota
  { city: 'Minneapolis', state: 'MN', display: 'Minneapolis, MN' },
  { city: 'Saint Paul', state: 'MN', display: 'Saint Paul, MN' },

  // Missouri
  { city: 'Kansas City', state: 'MO', display: 'Kansas City, MO' },
  { city: 'St. Louis', state: 'MO', display: 'St. Louis, MO' },

  // Louisiana
  { city: 'New Orleans', state: 'LA', display: 'New Orleans, LA' },
  { city: 'Baton Rouge', state: 'LA', display: 'Baton Rouge, LA' },

  // Ohio
  { city: 'Columbus', state: 'OH', display: 'Columbus, OH' },
  { city: 'Cleveland', state: 'OH', display: 'Cleveland, OH' },
  { city: 'Cincinnati', state: 'OH', display: 'Cincinnati, OH' },

  // Indiana
  { city: 'Indianapolis', state: 'IN', display: 'Indianapolis, IN' },

  // Virginia
  { city: 'Virginia Beach', state: 'VA', display: 'Virginia Beach, VA' },
  { city: 'Richmond', state: 'VA', display: 'Richmond, VA' },

  // Connecticut
  { city: 'New Haven', state: 'CT', display: 'New Haven, CT' },
  { city: 'Hartford', state: 'CT', display: 'Hartford, CT' },

  // Utah
  { city: 'Salt Lake City', state: 'UT', display: 'Salt Lake City, UT' },

  // New Mexico
  { city: 'Albuquerque', state: 'NM', display: 'Albuquerque, NM' },

  // Oklahoma
  { city: 'Oklahoma City', state: 'OK', display: 'Oklahoma City, OK' },

  // Kansas
  { city: 'Wichita', state: 'KS', display: 'Wichita, KS' },

  // Nebraska
  { city: 'Omaha', state: 'NE', display: 'Omaha, NE' },

  // Hawaii
  { city: 'Honolulu', state: 'HI', display: 'Honolulu, HI' },

  // Alaska
  { city: 'Anchorage', state: 'AK', display: 'Anchorage, AK' },
];

export function searchCities(query: string, limit: number = 10) {
  if (!query.trim()) return [];

  const normalizedQuery = query.toLowerCase().trim();

  return US_CITIES
    .filter(city =>
      city.city.toLowerCase().includes(normalizedQuery) ||
      city.state.toLowerCase().includes(normalizedQuery) ||
      city.display.toLowerCase().includes(normalizedQuery)
    )
    .slice(0, limit);
}
