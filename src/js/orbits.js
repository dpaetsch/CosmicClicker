import * as THREE from "three";
import { scene } from './scene.js';
import { scalingFactor } from "./main.js";

// Import planet positions
import planets from "../data/planet_properties.json";
import planet_positions_assembled from "../data/planet_positions_assembled.json";


let planetNames = Object.keys(planets);

// Remove sun since there is no data for it
planetNames = planetNames.filter(name => name !== "Sun");

// Creates orbits for each planet
const createPlanetPositionsObject = (planetPositions) => {
  const planet_orbits = {};
  for (let day in planetPositions) {
    for (let planet of planetNames) {
      if (planet_orbits[planet]) {
        planet_orbits[planet].push(planetPositions[day][planet]);
      } else {
        planet_orbits[planet] = [planetPositions[day][planet]];
      }
    }
  }
  return planet_orbits;
};

let planet_orbits = createPlanetPositionsObject(planet_positions_assembled);

const drawOrbitByPlanet = (planet, planet_orbits) => {
  const geometry = new THREE.BufferGeometry();

  // Flatten and scale the positions
  const positions = new Float32Array(
     planet_orbits[planet]
        .flat()
        .map(coord => coord / scalingFactor) // Scale each coordinate
  );


  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({ color: "gray" });
  const line = new THREE.Line(geometry, material);
  scene.add(line);
};

export const drawOrbits = () => {
  for (let planet of planetNames) drawOrbitByPlanet(planet, planet_orbits);
};
