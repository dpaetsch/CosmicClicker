import * as THREE from 'three';
import planet_positions from "../data/planet_positions_assembled.json";
import { planetVisibilityDistance, planetGroups, scalingFactor } from './main';


// --------------- SUN ----------------
// Function to create planet positions object
export const createSunGroup = (sunRadius) => {
  //const sunRadius = 1e7; // Sun radius in meters
  // Sphere representation (for close-up)
  const sunGeometry = new THREE.SphereGeometry(sunRadius, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);

  // Point representation (for far away)
  const pointMaterial = new THREE.PointsMaterial({ size: 10, color: 0xff0000, sizeAttenuation: false });
  const pointGeometry = new THREE.BufferGeometry();
  pointGeometry.setAttribute( "position", new THREE.BufferAttribute(new Float32Array(3), 3) );
  const sunPoint = new THREE.Points(pointGeometry, pointMaterial);

  // Outline representation (for selection)
  const outlineGeometry = new THREE.SphereGeometry(sunRadius * 1.1, 32, 32);
  const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.BackSide });
  const sunOutline = new THREE.Mesh(outlineGeometry, outlineMaterial);
  sunOutline.visible = false; // Hidden by default
  sunOutline.isOutline = true; // Tag the outline mesh (for updatePlanetVisibility)
  
  // Group to hold all representations
  const group = new THREE.Group();
  group.add(sunMesh);
  group.add(sunPoint);
  group.add(sunOutline);
  group.planetName = "Sun"; // Store planet name in group

  group.position.set(0, 0, 0); // Set group position  

  return group;
};


// --------------- PLANETS ----------------


// Function to create planet representations
export const createPlanetGroup = ( planetName, radius) => {
  // Sphere representation (for close-up)
  const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32);
  const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.FrontSide, transparent: false, opacity: 1, wireframe: false });
  const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);

  // Point representation (for far away)
  const pointMaterial = new THREE.PointsMaterial({ size: 10, color: 0xffffff, sizeAttenuation: false });
  const pointGeometry = new THREE.BufferGeometry();
  pointGeometry.setAttribute( "position", new THREE.BufferAttribute(new Float32Array(3), 3) );
  const pointMesh = new THREE.Points(pointGeometry, pointMaterial);

  // Outline representation (for selection)
  const outlineGeometry = new THREE.SphereGeometry(radius * 1.1, 32, 32);
  const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.BackSide });
  const planetOutline = new THREE.Mesh(outlineGeometry, outlineMaterial);
  planetOutline.visible = false; // Hidden by default
  planetOutline.isOutline = true; // Tag the outline mesh (for updatePlanetVisibility)

  // Group to hold all representations
  const group = new THREE.Group();
  group.add(sphereMesh);
  group.add(pointMesh);
  group.add(planetOutline);
  group.planetName = planetName; // Store planet name in group


  group.position.set(0, 0, 0); // Set group position

  return group;
};







// Update visibility based on distance 
export const updatePlanetVisibility = (group, camera) => {
  const distance = camera.position.distanceTo(group.position);

  const transitionDistance = planetVisibilityDistance / scalingFactor; // Transition between sphere and point representation


  group.children.forEach((child) => {
    if (child.isOutline) return;

    if (child.isMesh || child.isPoints) {
        if (distance < transitionDistance) {
            if (child.geometry instanceof THREE.SphereGeometry) {
                child.visible = true; // Show sphere mesh
            } else {
                child.visible = false; // Hide point representation
            }
        } else {
            if (child.geometry instanceof THREE.SphereGeometry) {
                child.visible = false; // Hide sphere mesh
            } else {
                child.visible = true; // Show point representation
            }
        }
    }
  });
};





export const updatePositions = (date) => {
  const dayKey = date.toISOString().split("T")[0];  // Get the key for the current day
  const planetPositions = planet_positions;

  // Iterate over each planetGroup (using the keys as planetNames)
  for (let planetName in planetGroups) {
    if(planetName === "Sun") continue;  // Skip the Sun
    const planetGroup = planetGroups[planetName];  // Access the group for the current planet

    // Check if the planet's position is available for the given day
    if (planetPositions[dayKey] && planetPositions[dayKey][planetName]) {
      planetGroup.visible = true;  // Make the group visible if position is available
      planetGroup.position.x = planetPositions[dayKey][planetName][0] / scalingFactor;  // Update the X position
      planetGroup.position.y = planetPositions[dayKey][planetName][1] / scalingFactor;  // Update the Y position
      planetGroup.position.z = planetPositions[dayKey][planetName][2] / scalingFactor;  // Update the Z position
    } else {
      planetGroup.visible = false;  // Hide the group if no position data is available
    }
  }
};