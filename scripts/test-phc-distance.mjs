import assert from 'node:assert/strict';
import { sortByDistance } from '../lib/location/distance.ts';

// Coordinate fixtures exercise ordering across Indian states; they are test
// points only and are never used as application fallback locations.
const facilities = [
  { name: 'Test facility in Maharashtra', state: 'Maharashtra', latitude: 19.0760, longitude: 72.8777 },
  { name: 'Test facility in West Bengal', state: 'West Bengal', latitude: 22.5726, longitude: 88.3639 },
  { name: 'Test facility in Tamil Nadu', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707 },
  { name: 'Test facility in Delhi', state: 'Delhi', latitude: 28.6139, longitude: 77.2090 },
  { name: 'Second test facility near Mumbai', state: 'Maharashtra', latitude: 19.1760, longitude: 72.8777 },
];

const origins = [
  { label: 'Delhi', latitude: 28.6139, longitude: 77.2090, expected: 'Test facility in Delhi' },
  { label: 'Mumbai', latitude: 19.0760, longitude: 72.8777, expected: 'Test facility in Maharashtra' },
  { label: 'Chennai', latitude: 13.0827, longitude: 80.2707, expected: 'Test facility in Tamil Nadu' },
  { label: 'Kolkata', latitude: 22.5726, longitude: 88.3639, expected: 'Test facility in West Bengal' },
];

for (const origin of origins) {
  const sorted = sortByDistance(origin, facilities);
  assert.equal(sorted[0].name, origin.expected, `${origin.label} should rank its nearest facility first`);
  assert.ok(sorted.every((facility, index) => index === 0 || sorted[index - 1].distanceKm <= facility.distanceKm), 'results must be sorted by increasing distance');
  assert.equal(sorted[0].distanceKm, 0, `${origin.label} fixture at origin should have zero distance`);
}

const firstNearestByOrigin = origins.map(origin => sortByDistance(origin, facilities)[0].name);
assert.equal(new Set(firstNearestByOrigin).size, origins.length, 'nearest result should change across tested states');
console.log(`PHC distance ordering passed for ${origins.map(origin => origin.label).join(', ')}.`);
