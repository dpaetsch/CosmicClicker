import * as THREE from 'three';
import { scene, camera, renderer, controls, setCameraPosition } from './scene.js';
import { createSunGroup, createPlanetGroup, updatePlanetVisibility, updatePositions} from './planet.js';
import { drawOrbits } from './orbits.js';

// CONTROLS 
import { createDateSlider, createDateDisplay, updateDateDisplay, getDateFromSliderValue , validDates} from './controls/dateSlider.js';
import { createPlayButton } from './controls/playButton.js';
import { createSpeedSlider, createSpeedDisplay } from './controls/speedSlider.js';
import { createDistanceButton, displayDistance } from './controls/distanceCalculator.js';

// DATA
import planet_properties from "../data/planet_properties.json";



//------ META PARAMETERS --------\

export const planetVisibilityDistance = 5e9; // Distance at which to switch between sphere and point representation
export const scalingFactor = 1e6; // Scaling factor for everything that has size or position
setCameraPosition(0, -1e10 / scalingFactor, 1e10 / scalingFactor); // Set initial camera position
const isTextBorderVisible = false; // Flag to toggle text border visibility



// ------  CREATE PLANETS: --------

// Initialize planets
const sunRadius = 1e7 / scalingFactor;
const planetNames = Object.keys(planet_properties);
export const planetGroups = {};  // Groups { sphereMesh, pointMesh, Name of Planet } for each planet (and Sun)
for (let planetName of planetNames) {
  if(planetName === "Sun"){
    const sunGroup = createSunGroup(sunRadius); 
    scene.add(sunGroup);  
    planetGroups[planetName] = sunGroup;
    continue;
  }
  const planetRadius = 1e7 /  scalingFactor;
  planetGroups[planetName] = createPlanetGroup(planetName, planetRadius);
  scene.add(planetGroups[planetName]);
}

// Draw orbits of all planets in the scene
drawOrbits(); 


//  ------------ SLIDERS AND BUTTONS ----------------
// Create Slider for Dates
export const dateSlider = createDateSlider();
export const dateDisplay = createDateDisplay();

// Set initial date:
const initialDate = getDateFromSliderValue(dateSlider.value);
updateDateDisplay(dateDisplay, initialDate);
updatePositions(initialDate);

// Create Play Button
export const playButton = createPlayButton();
export let isPlaying = false; // Flag to track play state
export let playInterval = null; // Used for playing back interval 

// Speed Slider
const stepSizeSlider = createSpeedSlider();
const stepSizeLabel = createSpeedDisplay(stepSizeSlider);
export let currentStepSize = parseInt(stepSizeSlider.value, 10) * 5; // Initial step size in days


// Distance Calculator Button
let distance = 0;
let distanceLine = null;
const distanceLineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
const distanceButton = createDistanceButton();
let distanceText = displayDistance(distance);
let isCalculatingDistance = false;
let selectedPlanets = [];
let distanceTextSprite = null;
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let textScale = 4;




// Collection of all spherical meshes (NOT outlines)
const sphereMeshes = [];
const outlineMeshes = [];
for (const planetGroup of Object.values(planetGroups)) {
    planetGroup.children.forEach((child) => {
        if (child.geometry instanceof THREE.SphereGeometry && !child.isOutline) {
          sphereMeshes.push(child);
        }
        if (child.isOutline) {
          outlineMeshes.push(child);
        }
    });
}



const resetOutlineMeshes = (outlineMeshes) => {
  for (const outlineMesh of outlineMeshes) {
    outlineMesh.visible = false;
  }
}

const removeDistanceLine = () => {
  if (distanceLine) {
    scene.remove(distanceLine);
    distanceLine = null; // Updates the global variable
  }
  if (distanceTextSprite) {
    scene.remove(distanceTextSprite);
    distanceTextSprite = null; // Updates the global variable
  }
};


// Highlight the selected planet
const getOutlineMesh = (planetName) => {
  const planetGroup = planetGroups[planetName];
  if (!planetGroup) return null;

  // Look for the child with isOutline = true
  const outlineMesh = planetGroup.children.find(child => child.isMesh && child.isOutline);
  return outlineMesh || null; // Return null if not found
};





const updateDistanceLine = (selectedPlanets, distanceLine, distance, distanceTextSprite) => {
  if (selectedPlanets.length !== 2) return { distanceLine, distanceTextSprite, distance };
  
  const planet1 = planetGroups[selectedPlanets[0]].position;
  const planet2 = planetGroups[selectedPlanets[1]].position;

  // Create or update the distance line
  if (distanceLine) scene.remove(distanceLine); // Remove existing line
  const geometry = new THREE.BufferGeometry().setFromPoints([planet1, planet2]);
  distanceLine = new THREE.Line(geometry, distanceLineMaterial);
  scene.add(distanceLine);

  // Calculate distance
  distance = planet1.distanceTo(planet2);

  // Create text sprite for distance
  if (distanceTextSprite) scene.remove(distanceTextSprite); // Remove existing sprite
  const midpoint = new THREE.Vector3().addVectors(planet1, planet2).divideScalar(2);
  midpoint.y += 5; // Offset above the line

  // Adjust the text size based on distance
  //const textSize = Math.min(50, distance * 10); 
  //distanceTextSprite = createTextSprite(`${(distance).toFixed(2)} Million km`, { fontsize: textSize });
  textScale = Math.max(4 , distance * distance / 100); // Scale the text based on distance
  //console.log(textScale + " " + distance * distance / 100);
  distanceTextSprite = createTextSprite(`${(distance).toFixed(2)} Million km`);
  distanceTextSprite.position.copy(midpoint);


  scene.add(distanceTextSprite);

  return { distanceLine, distanceTextSprite, distance};
};




// // Function to create a sprite for text
function createTextSprite(message, parameters = {}) {
    const fontface = parameters.fontface || "Arial";
    const fontsize = parameters.fontsize || 24;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // Set canvas size for crisp text
    const scaleFactor = 4; 
    canvas.width = 256 * scaleFactor;
    canvas.height = 128 * scaleFactor;


    context.font = `${fontsize * scaleFactor}px ${fontface}`;

    console.log(context.font);


    // ---- BORDER ----
    if(isTextBorderVisible){
      // Draw border around the canvas
      const borderColor = parameters.borderColor || "white";
      const borderWidth = parameters.borderWidth || 4 * scaleFactor;

      context.lineWidth = borderWidth;
      context.strokeStyle = borderColor;

      // Adjust the border rectangle to fit within the canvas
      const halfBorder = borderWidth / 2;
      context.strokeRect(halfBorder, halfBorder, canvas.width - borderWidth, canvas.height - borderWidth);
    }


    context.fillStyle = parameters.color || "white";
    context.textAlign = "center";
    context.textBaseline = "middle";

    // Draw text
    const padding = canvas.width * 0.1; // 10% padding
    context.fillText(message, canvas.width / 2, canvas.height / 2 -  padding);

    // Create texture and sprite
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);

    // Scale sprite to match text size
    //sprite.scale.set(50, 20, 10); // Adjust scale for desired size
    sprite.scale.set(100000000 / scalingFactor, 50000000/scalingFactor, 10); // Adjust the scale to make the text more prominent

    return sprite;
}

// function createTextSprite(message, parameters = {}) {
//   const fontface = parameters.fontface || "Arial";
//   const fontsize = parameters.fontsize || 24; // Default font size
//   const canvas = document.createElement('canvas');
//   const context = canvas.getContext('2d');

//   // Set canvas size for crisp text
//   const scaleFactor = 5;
//   canvas.width = 256 * scaleFactor;
//   canvas.height = 128 * scaleFactor;




//   context.font = `${fontsize * scaleFactor}px ${fontface}`;

//   console.log(context.font);

//   context.fillStyle = parameters.color || "white";
//   context.textAlign = "center";
//   context.textBaseline = "middle";

//   // Draw text
//   const padding = canvas.width * 0.1; // 10% padding
//   context.fillText(message, canvas.width / 2, canvas.height / 2 - padding);

//   // Create texture and sprite
//   const texture = new THREE.CanvasTexture(canvas);
//   const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
//   const sprite = new THREE.Sprite(material);

//   // Scale sprite based on font size
//   //const scale = fontsize / scalingFactor; // Scale relative to font size and the scaling factor
//   const scale = fontsize; // Scale relative to font size and the scaling factor
//   sprite.scale.set(scale, scale / 2, 1);

//   return sprite;
// }




const togglePlayback = (isPlaying) => {
  console.log(isPlaying);
  if (isPlaying) {
    clearInterval(playInterval);
    playButton.innerText = "Play";
    isPlaying = false;
  } else {
    playButton.innerText = "Pause";
    isPlaying = true;

    // Start the interval for playback (every 100ms)
    playInterval = setInterval(() => {
      const currentValue = parseInt(dateSlider.value, 10);
      const nextValue = currentValue + Math.ceil(currentStepSize / 5); // Step size in slider units

      if (nextValue < validDates.length) {
        dateSlider.value = nextValue;
      
        // Get the updated date and manually trigger updates
        const selectedDate = getDateFromSliderValue(nextValue);
        updateDateDisplay(dateDisplay, selectedDate); // Ensure `dateDisplay` is passed correctly
        updatePositions(selectedDate);
      } else {
        togglePlayback(); // Stop playback when the end of dates is reached
      }
    }, 100); // interval speed 
  }
  return {isPlaying, playInterval};
};














// --------------- RENDER LOOP -----------------

const renderloop = () => {
  controls.update();

  distance = 0;

  // ---- Update Functions ----

  // Updates whether or not the planets are visible based on distances
  for (let planetGroup of Object.values(planetGroups)) updatePlanetVisibility(planetGroup, camera);
  
  if (distanceLine) {
    const result = updateDistanceLine(selectedPlanets, distanceLine, distance, distanceTextSprite);
    distanceLine = result.distanceLine;
    distanceTextSprite = result.distanceTextSprite;
    distance = result.distance;
  }

  //updateDisplayDistance(distanceText, distance);

  distanceText.textContent = `Distance: ${distance.toFixed(2)} Million km`;

  // ---------------------------

  renderer.render(scene, camera);
  window.requestAnimationFrame(renderloop);
};

renderloop();







// --------------- EVENT LISTENERS -----------------

// Date Slider
dateSlider.addEventListener("input", () => {
  const selectedDate = getDateFromSliderValue(dateSlider.value);
  updateDateDisplay(dateDisplay, selectedDate);
  updatePositions(selectedDate);
});

// Play Button
playButton.addEventListener("click", () => {
  console.log("Play Button Clicked: " + isPlaying);
  const returnThings = togglePlayback(isPlaying);
  isPlaying = returnThings.isPlaying;
  playInterval = returnThings.playInterval;
});


// Update the label and step size when the slider changes
stepSizeSlider.addEventListener("input", () => {
  currentStepSize = parseInt(stepSizeSlider.value, 10) * 5; // Multiply by 5 to get the step size in days
  stepSizeLabel.innerText = `Step Size: ${currentStepSize} days`;
});



// Distance Calculator Button
distanceButton.addEventListener('click', () => {
    isCalculatingDistance = !isCalculatingDistance;
    selectedPlanets = [];
    
    resetOutlineMeshes(outlineMeshes);
    removeDistanceLine();
    
    distanceButton.style.background = isCalculatingDistance  ? 'rgba(0, 255, 0, 0.7)' : 'rgba(0, 0, 0, 0.7)';
});




// Add click event listener for selecting planets
window.addEventListener('click', (event) => {
  if (!isCalculatingDistance) return;

  // Convert mouse position to normalized device coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Use raycaster to detect intersections
  raycaster.setFromCamera(mouse, camera);

  // Use raycaster to detect intersections with sphereMeshes
  const intersects = raycaster.intersectObjects(sphereMeshes);

  if (intersects.length > 0) {
    const intersectedMesh = intersects[0].object;

    // Find the planet group that contains the intersected mesh
    const planetName = Object.keys(planetGroups).find((name) =>
        planetGroups[name].children.includes(intersectedMesh)
    );

    if (planetName) {
        console.log("Selected Planet: " + planetName);

        if(selectedPlanets.includes(planetName)){
          selectedPlanets = [];
          resetOutlineMeshes(outlineMeshes);
          removeDistanceLine();
          return;
        }


        // There are already 2 selected planets -> reset and add new one
        if(selectedPlanets.length === 2){
          selectedPlanets = [];
          resetOutlineMeshes(outlineMeshes);
          removeDistanceLine();
          
          selectedPlanets.push(planetName);
          const outlineMesh = getOutlineMesh(planetName);
          if (outlineMesh) outlineMesh.visible = true;
          return;
        }

        selectedPlanets.push(planetName);
        const outlineMesh = getOutlineMesh(planetName);
        if (outlineMesh) outlineMesh.visible = true;

        if (selectedPlanets.length === 2) {
          if (!distanceLine) {
            const result = updateDistanceLine(selectedPlanets, distanceLine, distance, distanceTextSprite);
            distanceLine = result.distanceLine;
            distanceTextSprite = result.distanceTextSprite;
            distance = result.distance;
          }
        }
    }
  }
});











// --------------------------------------------------




// Add objects to the scene
// const positions = new Float32Array(1 * 3); // Un punto en 3D
// const pointGeometry = new THREE.BufferGeometry();
// pointGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

// const sunMaterial = new THREE.PointsMaterial({size: 8, color: "orange",sizeAttenuation: false,});


// //const radius = 5e6;


// const sun = new THREE.Points(pointGeometry, sunMaterial);
// const planetMaterial = new THREE.PointsMaterial({ size: 10,color: 0xffffff,sizeAttenuation: false,});



// const radiusSun = 1e7;
//const sunGeometry = new THREE.SphereGeometry( radiusSun, 100, 100 ); // radius, width segments, height segments
// const sunMaterial = new THREE.MeshStandardMaterial( {color: 0x00ff00,
//     side: THREE.FrontSide, // Render only front faces
//     transparent: false,    // Ensure material is not transparent
//     opacity: 1,
//     wireframe: false

//   } );
// const sun = new THREE.Mesh( sunGeometry, sunMaterial )

// scene.add(sun);
// sun.position.set(0, 0, 0);


// const createPlanet = (radius) => {
//   const planetPoints = new THREE.Points(pointGeometry, planetMaterial);
  //const planetSpheres = new THREE.SphereGeometry( radius, 100, 100 );
//   const planetMaterial = new THREE.MeshStandardMaterial( {
//     color: 0xff0000,
//     side: THREE.FrontSide, // Render only front faces
//     transparent: false,    // Ensure material is not transparent
//     opacity: 1,            // Fully opaque
//     wireframe: false        // Render wireframe
// });

  //const planetPoints = new THREE.Mesh( planetSpheres, planetMaterial );
//   return planetPoints;
// };

// const planetNames = Object.keys(planets);
// const planetMeshes = {};
// for (let planet of planetNames) {
//   const planetRadius = 5e6;// planets[planet].radius;
//   planetMeshes[planet] = createPlanet(planetRadius);
//   scene.add(planetMeshes[planet]);
// }



// Initialize planets
//const planetNames = Object.keys(planets);
//const planetObjects = {};

// for (let planet of planetNames) {
//   const planetRadius = 5e6; // Replace with planets[planet].radius if available
//   const { sphereMesh, pointMesh } = createPlanetRepresentation(planetRadius);

//   const planetGroup = new THREE.Group();
//   planetGroup.add(sphereMesh); // Add both representations to a parent group
//   planetGroup.add(pointMesh);

//   sphereMesh.visible = false; // Start with point representation
//   pointMesh.visible = true;

//   planetObjects[planet] = { group: planetGroup, sphereMesh, pointMesh };
//   scene.add(planetGroup);
// }











///--------- SLIDER FOR DATES ----------------------------
// Precompute valid dates (every 5 days from 1800-01-03 to 2099-12-27)
// const startDate = new Date("1800-01-03");
// const endDate = new Date("2099-12-27");
// const validDates = [];
// // for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 5)) {
// //   validDates.push(new Date(date)); // Clone to avoid reference issues
// // }
// for (let date = new Date(startDate); date <= endDate; date.setUTCDate(date.getUTCDate() + 5)) {
//     validDates.push(new Date(date.getTime())); // Clone to avoid reference issues
// }

// // Create the slider
// const dateSlider = document.createElement("input");
// dateSlider.type = "range";
// dateSlider.min = 0; // First index in validDates
// dateSlider.max = validDates.length - 1; // Last index in validDates
// // dateSlider.value = Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24 * 5)); // Closest index to today
// const currentUTCDate = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate())); // Current UTC date
// dateSlider.value = validDates.findIndex((date) => date.getTime() === currentUTCDate.getTime()); // Find closest index in validDates
// dateSlider.style.position = "absolute";
// dateSlider.style.bottom = "40px";
// dateSlider.style.left = "50%";
// dateSlider.style.transform = "translateX(-50%)";
// dateSlider.style.width = "80%"; // Make the slider wider
// document.body.appendChild(dateSlider);


// Create a text box to display the selected date
// const dateDisplay = document.createElement("input");
// dateDisplay.type = "text";
// dateDisplay.readOnly = true; // Make the text box read-only
// dateDisplay.style.position = "absolute";
// dateDisplay.style.bottom = "10px";
// dateDisplay.style.left = "50%";
// dateDisplay.style.transform = "translateX(-50%)";
// dateDisplay.style.textAlign = "center";
// dateDisplay.style.width = "200px"; // Adjust width for better readability
// document.body.appendChild(dateDisplay);

// Convert slider value to date
// const getDateFromSliderValue = (value) => validDates[value];

// Function to update the displayed date
// const updateDateDisplay = (date) => {
//     dateDisplay.value = date.toISOString().split("T")[0]; // Format as "YYYY-MM-DD"
// };





// // Update planet positions
// const updatePositions = (date) => {
//   const dayKey = date.toISOString().split("T")[0]; // Format date as "YYYY-MM-DD"
//   const planetPositions = planet_positions;

//   for (let planet of planetNames) {
//     let currentPlanetMesh = planetMeshes[planet];
//     if (planetPositions[dayKey]) {
//       if (planetPositions[dayKey][planet]) {
//         currentPlanetMesh.visible = true;
//         currentPlanetMesh.position.x = planetPositions[dayKey][planet][0];
//         currentPlanetMesh.position.y = planetPositions[dayKey][planet][1];
//         currentPlanetMesh.position.z = planetPositions[dayKey][planet][2];
//       } else {
//         currentPlanetMesh.visible = false;
//       }
//     }
//   }
// };

// Event listener for slider
// dateSlider.addEventListener("input", () => {
//   const selectedDate = getDateFromSliderValue(dateSlider.value);
//   updateDateDisplay(selectedDate);
//   updatePositions(selectedDate);
// });

// // Initial position update
// const initialDate = getDateFromSliderValue(dateSlider.value);
// updateDateDisplay(initialDate);
// updatePositions(initialDate);



// ------ BUTTON FOR AUTOMATIC LOOP --------
// Create a play button
// const playButton = document.createElement("button");
// playButton.innerText = "Play";
// playButton.style.position = "absolute";
// playButton.style.bottom = "70px";
// playButton.style.left = "50%";
// playButton.style.transform = "translateX(-50%)";
// playButton.style.padding = "10px 20px";
// playButton.style.cursor = "pointer";
// document.body.appendChild(playButton);

// let isPlaying = false; // Flag to track play state
// let playInterval = null; // Variable to store the interval


// -----------   SLIDER FOR SPEED -------
// Create a step size slider
// const stepSizeSlider = document.createElement("input");
// stepSizeSlider.type = "range";
// stepSizeSlider.min = 1; // Minimum step size (5 days)
// stepSizeSlider.max = 20; // Maximum step size (100 days)
// stepSizeSlider.value = 1; // Default step size (5 days)
// stepSizeSlider.style.position = "absolute";
// stepSizeSlider.style.bottom = "110px";
// stepSizeSlider.style.left = "50%";
// stepSizeSlider.style.transform = "translateX(-50%)";
// stepSizeSlider.style.width = "80%";
// document.body.appendChild(stepSizeSlider);

// // Label for the step size slider
// const stepSizeLabel = document.createElement("div");
// stepSizeLabel.innerText = `Step Size: ${stepSizeSlider.value * 5} days`;
// stepSizeLabel.style.position = "absolute";
// stepSizeLabel.style.bottom = "140px";
// stepSizeLabel.style.left = "50%";
// stepSizeLabel.style.transform = "translateX(-50%)";
// stepSizeLabel.style.textAlign = "center";
// document.body.appendChild(stepSizeLabel);

// let currentStepSize = parseInt(stepSizeSlider.value, 10) * 5;

// // Update the label and step size when the slider changes
// stepSizeSlider.addEventListener("input", () => {
//   currentStepSize = parseInt(stepSizeSlider.value, 10) * 5; // Multiply by 5 to get the step size in days
//   stepSizeLabel.innerText = `Step Size: ${currentStepSize} days`;
// });




// playButton.addEventListener("click", () => {
//   if (isPlaying) {
//     clearInterval(playInterval);
//     playButton.innerText = "Play";
//     isPlaying = false;
//   } else {
//     playButton.innerText = "Pause";
//     isPlaying = true;
//     playInterval = setInterval(() => {
//       const currentValue = parseInt(dateSlider.value, 10);
//       const nextValue = currentValue + Math.ceil(currentStepSize / 5); // Calculate step in slider units
//       if (nextValue < validDates.length) {
//         dateSlider.value = nextValue;
//         const selectedDate = getDateFromSliderValue(dateSlider.value);
//         updateDateDisplay(selectedDate);
//         updatePositions(selectedDate);
//       } else {
//         togglePlayback(); // Stop if we reach the end
//       }
//     }, 100); // Adjust speed independently of the step size
//   }
// });


//-------------- PLANET REPRESENTATION ----------------
// Create both representations for a planet
// const createPlanetRepresentation = (radius) => {
//   // Sphere representation (for close-up)
//   const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32);
//   const sphereMaterial = new THREE.MeshStandardMaterial({
//     color: 0x00ff00,
//     side: THREE.FrontSide,
//     transparent: false,
//     opacity: 1,
//     wireframe: false,
//   });
//   const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);

//   // Point representation (for far away)
//   const pointMaterial = new THREE.PointsMaterial({
//     size: 10,
//     color: 0xffffff,
//     sizeAttenuation: false,
//   });
//   const pointGeometry = new THREE.BufferGeometry();
//   pointGeometry.setAttribute(
//     "position",
//     new THREE.BufferAttribute(new Float32Array(3), 3)
//   );
//   const pointMesh = new THREE.Points(pointGeometry, pointMaterial);

//   return { sphereMesh, pointMesh };
// };
 


// // Update visibility based on distance
// const transitionDistance = 5e8; // Adjust as necessary for when to switch
// const updatePlanetVisibility = () => {
//   for (let planet of planetNames) {
//     const { group, sphereMesh, pointMesh } = planetObjects[planet];
//     const distance = camera.position.distanceTo(group.position);

//     if (distance < transitionDistance) {
//       sphereMesh.visible = true;
//       pointMesh.visible = false;
//     } else {
//       sphereMesh.visible = false;
//       pointMesh.visible = true;
//     }
//   }
// };













// const renderloop = () => {
//     controls.update();
//     // const sunDistance = camera.position.distanceTo(sun.position);
//     // const sunSize = 5e7 / sunDistance;
//     // sun.geometry.attributes.position.array[0] = sunSize;
//     // sun.geometry.attributes.position.needsUpdate = true;
  
//     // for (let planet of planetNames) {
//     //   let currentPlanetMesh = planetMeshes[planet];
  
//     //   const distance = camera.position.distanceTo(currentPlanetMesh.position);
//     //   const pointSize = 5e7 / distance;
//     //   currentPlanetMesh.geometry.attributes.position.array[0] = pointSize;
//     //   currentPlanetMesh.geometry.attributes.position.needsUpdate = true;
//     // }

//     //updatePlanetVisibility();
  
//     renderer.render(scene, camera);
//     window.requestAnimationFrame(renderloop);
// };
  
// renderloop();





//===========







// // - -----------SLIDER FOR SPEED CONTROL-----------------
// // Slider for speed control
// const sliderContainer = document.createElement('div');
// sliderContainer.style.position = 'absolute';
// sliderContainer.style.bottom = '10px';
// sliderContainer.style.right = '10px';
// sliderContainer.style.background = 'rgba(0, 0, 0, 0.7)';
// sliderContainer.style.padding = '10px';
// sliderContainer.style.borderRadius = '5px';
// sliderContainer.style.color = 'white';
// sliderContainer.style.fontFamily = 'Arial, sans-serif';

// const sliderLabel = document.createElement('label');
// sliderLabel.textContent = 'Speed Multiplier: ';
// sliderLabel.style.marginRight = '10px';
// sliderLabel.style.fontSize = '20px';

// const speedSlider = document.createElement('input');
// speedSlider.type = 'range';
// speedSlider.min = '0';
// speedSlider.max = '1';
// speedSlider.step = '0.001';
// speedSlider.value = '0.5'; // Default value
// sliderContainer.appendChild(sliderLabel);
// sliderContainer.appendChild(speedSlider);
// document.body.appendChild(sliderContainer);

// let multiplierSpeed = parseFloat(speedSlider.value);
// speedSlider.addEventListener('input', () => {
//     multiplierSpeed = parseFloat(speedSlider.value);
// });
// // ------------------------------


// // ------------ DISTANCE CALCULATOR ---------------
// // Create a distance calculator button
// const distanceButton = document.createElement('button');
// distanceButton.textContent = 'Distance Calculator';
// distanceButton.style.fontSize = '20px';
// distanceButton.style.position = 'absolute';
// distanceButton.style.bottom = '10px';
// distanceButton.style.left = '10px';
// distanceButton.style.background = 'rgba(0, 0, 0, 0.7)';
// distanceButton.style.color = 'white';
// distanceButton.style.padding = '10px';
// distanceButton.style.borderRadius = '5px';
// distanceButton.style.border = 'none';
// distanceButton.style.cursor = 'pointer';
// distanceButton.style.fontFamily = 'Arial, sans-serif';
// document.body.appendChild(distanceButton);

// // Variables for distance calculation
// let isCalculatingDistance = false;
// let selectedPlanets = [];
// const distanceLineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
// let distanceLine = null;
// let distance = 0;


// // Display the distance
// const distancePopup = document.createElement('div');
// distancePopup.style.position = 'absolute';
// distancePopup.style.background = 'rgba(0, 0, 0, 0.7)';
// distancePopup.style.color = 'white';
// distancePopup.style.padding = '10px';
// distancePopup.style.borderRadius = '5px';
// distancePopup.style.fontFamily = 'Arial, sans-serif';
// distancePopup.textContent = `Distance: ${distance.toFixed(2)} units`;
// distancePopup.style.bottom = '60px';
// distancePopup.style.left = '10px';
// document.body.appendChild(distancePopup);



// let distanceTextSprite = null;


// // ------------------------------------------------



// export renderSolarSystem = (date, multiplierSpeed, mobile, onClick) => {


// };








// // Meta:
// const isWireframe = false;
// const resolution = 50;



// // Planets:
// //Sun:
// const sunRadius = 25;
// const sunGeometry = new THREE.SphereGeometry( sunRadius, resolution, resolution ); // radius, width segments, height segments
// const sunMaterial = new THREE.MeshBasicMaterial( {color: 0xffff00, wireframe: isWireframe} ); // yellow, wireframe (no fill)
// const sun = new THREE.Mesh( sunGeometry, sunMaterial ); // combine geometry and material
// scene.add( sun );

// //Mercury:
// const mercuryRadius = 2;
// const mercuryGeometry = new THREE.SphereGeometry( mercuryRadius, resolution, resolution ); // radius, width segments, height segments
// const mercuryMaterial = new THREE.MeshBasicMaterial( {color: 0x00ff00, wireframe: isWireframe} ); // yellow, wireframe (no fill)
// const mercury = new THREE.Mesh( mercuryGeometry, mercuryMaterial ); // combine geometry and material
// scene.add( mercury );

// //Earth:
// const earthRadius = 7
// const earthGeometry = new THREE.SphereGeometry( earthRadius, resolution, resolution ); // radius, width segments, height segments
// const earthMaterial = new THREE.MeshBasicMaterial( {color: 0x0000ff, wireframe: isWireframe} ); // yellow, wireframe (no fill)
// const earth = new THREE.Mesh( earthGeometry, earthMaterial ); // combine geometry and material
// scene.add( earth );

// const earthMoonRadius = 1;
// const earthMoonGeometry = new THREE.SphereGeometry( earthMoonRadius, resolution, resolution ); // radius, width segments, height segments
// const earthMoonMaterial = new THREE.MeshBasicMaterial( {color: 0xffffff, wireframe: isWireframe} ); // yellow, wireframe (no fill)
// const earthMoon = new THREE.Mesh( earthMoonGeometry, earthMoonMaterial ); // combine geometry and material
// scene.add( earthMoon );

// //Mars:
// const marsRadius = 5
// const marsGeometry = new THREE.SphereGeometry( marsRadius, resolution, resolution ); // radius, width segments, height segments
// const marsMaterial = new THREE.MeshBasicMaterial( {color: 0xff0000, wireframe: isWireframe} ); // yellow, wireframe (no fill)
// const mars = new THREE.Mesh( marsGeometry, marsMaterial ); // combine geometry and material
// scene.add( mars );

// //Saturn:
// const saturnRadius = 10;
// const saturnGeometry = new THREE.SphereGeometry( saturnRadius, resolution, resolution ); // radius, width segments, height segments
// const saturnMaterial = new THREE.MeshBasicMaterial( {color: 0x00ff00, wireframe: isWireframe} ); // yellow, wireframe (no fill)
// const saturn = new THREE.Mesh( saturnGeometry, saturnMaterial ); // combine geometry and material
// scene.add( saturn );

// const saturnRingGeometry = new THREE.TorusGeometry(14, 1, 16, 100 ); // radius, tube, radial segments, tubular segments
// const saturnRingMaterial = new THREE.MeshBasicMaterial( { color: 0xffff00 } ); 
// const saturnRing = new THREE.Mesh( saturnRingGeometry, saturnRingMaterial );
// saturnRing.rotation.x = Math.PI / 2; 
// scene.add( saturnRing );


// //Distances:
// const mercuryDistance = 40;
// const earthDistance = 70;
// const earthMoonDistance = 10;
// const marsDistance = 100;
// const saturnDistance = 140;

// // Base speeds
// const mercurySpeed = 0.1;
// const earthSpeed = 0.07;
// const earthMoonSpeed = 0.3;
// const marsSpeed = 0.01;
// const saturnSpeed = 0.005;

// // Starting locations
// let mercuryRotation = 0;
// let earthRotation = 0;
// let earthMoonRotation = 0;
// let marsRotation = 0;
// let saturnRotation = 0;

// function animate(time) {

//     sun.rotation.y = time / 2000;

//     mercuryRotation += mercurySpeed*multiplierSpeed;
//     mercury.position.x = mercuryDistance * Math.cos(mercuryRotation);
//     mercury.position.z = mercuryDistance * Math.sin(mercuryRotation);
//     mercury.rotation.y = time / 300 + 500;

//     earthRotation += earthSpeed*multiplierSpeed;
//     earth.position.x = earthDistance * Math.cos(earthRotation);
//     earth.position.z = earthDistance * Math.sin(earthRotation);
//     earth.rotation.y = time / 500;
//     earthMoonRotation += earthMoonSpeed*multiplierSpeed;
//     earthMoon.position.x = earth.position.x + earthMoonDistance * Math.cos(earthMoonRotation);
//     earthMoon.position.z = earth.position.z + earthMoonDistance * Math.sin(earthMoonRotation);
//     earthMoon.rotation.y = time / 100;

//     marsRotation += marsSpeed*multiplierSpeed;
//     mars.position.x = marsDistance * Math.cos(marsRotation);
//     mars.position.z = marsDistance * Math.sin(marsRotation);
//     mars.rotation.y = time / 1200;

//     saturnRotation += saturnSpeed*multiplierSpeed;
//     saturn.position.x = saturnDistance * Math.cos(saturnRotation);
//     saturn.position.z = saturnDistance * Math.sin(saturnRotation);
//     saturn.rotation.y = time / 600;
//     saturnRing.position.copy(saturn.position);

//     // Synchronize outline positions
//     planetOutlines.get('sun').position.copy(sun.position);
//     planetOutlines.get('mercury').position.copy(mercury.position);
//     planetOutlines.get('earth').position.copy(earth.position);
//     planetOutlines.get('mars').position.copy(mars.position);
//     planetOutlines.get('saturn').position.copy(saturn.position); 

//     // Update distance line if it exists
//     if (distanceLine && selectedPlanets.length === 2) {
//         const points = [
//             selectedPlanets[0].object.position.clone(),
//             selectedPlanets[1].object.position.clone()
//         ];



//         distanceLine.geometry.dispose(); // Dispose of old geometry
//         distanceLine.geometry = new THREE.BufferGeometry().setFromPoints(points); // Update geometry
//         distance = points[0].distanceTo(points[1]);
//         distancePopup.textContent = `Distance: ${distance.toFixed(2)} units`;


//         // Calculate the midpoint
//         const midpoint = new THREE.Vector3().addVectors(points[0], points[1]).divideScalar(2);
//         midpoint.y += 5; // Offset above the line
        

//         if (distanceTextSprite) {
//             scene.remove(distanceTextSprite); // Remove existing sprite
//         }
//         distanceTextSprite = createTextSprite(`Distance: ${distance.toFixed(2)} units`);
//         distanceTextSprite.position.copy(midpoint);
//         scene.add(distanceTextSprite);

//     }

//     renderer.render(scene, camera);
// }

// renderer.setAnimationLoop(animate);


// // Create a raycaster and mouse vector
// const raycaster = new THREE.Raycaster();
// const mouse = new THREE.Vector2();

// // Create a popup for planet info
// const popup = document.createElement('div');
// popup.style.position = 'absolute';
// popup.style.background = 'rgba(0, 0, 0, 0.7)';
// popup.style.color = 'white';
// popup.style.padding = '10px';
// popup.style.borderRadius = '5px';
// popup.style.display = 'none';
// popup.style.pointerEvents = 'none'; // Ignore mouse events on the popup itself
// document.body.appendChild(popup);


// // Planet info object
// const planetName = {
//     sun: "Your mom.",
//     mercury: "Mercury",
//     earth: "Earth",
//     mars: "Mars",
//     saturn: "Saturn"
// };

// // Add planets to an array for raycasting
// const planets = [
//     { name: 'sun', object: sun },
//     { name: 'mercury', object: mercury },
//     { name: 'earth', object: earth },
//     { name: 'mars', object: mars },
//     { name: 'saturn', object: saturn }
// ];


// // Glow material for the outline
// const glowMaterial = new THREE.MeshBasicMaterial({
//     color: 0xffffff,
//     transparent: true,
//     opacity: 0.5,
//     side: THREE.BackSide // Render inside-out to prevent z-fighting
// });

// // Map to store planet outline meshes
// const planetOutlines = new Map();

// // Create outline meshes for all planets
// planets.forEach((planet) => {
//     const outlineGeometry = planet.object.geometry.clone();
//     const outlineMesh = new THREE.Mesh(outlineGeometry, glowMaterial);
//     outlineMesh.scale.set(1.2, 1.2, 1.2); // Slightly larger than the planet
//     outlineMesh.visible = false; // Initially hidden
//     scene.add(outlineMesh);
//     planetOutlines.set(planet.name, outlineMesh);
// });

// // Update mouse hover logic
// window.addEventListener('mousemove', (event) => {
//     // Convert mouse position to normalized device coordinates (-1 to +1)
//     mouse.x = (event.clientX / window.innerWidth) * 2 - 1; 
//     mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;


//     // Use raycaster to detect intersections
//     raycaster.setFromCamera(mouse, camera);
//     const intersects = raycaster.intersectObjects(planets.map(p => p.object));

//     // Hide all outlines by default
//     planetOutlines.forEach((outline) => (outline.visible = false));

//     if (intersects.length > 0) {
//         const intersectedPlanet = intersects[0].object;

//         // Find the planet's name
//         const planet = planets.find(p => p.object === intersectedPlanet);
//         if (planet) {
//             // Show the outline mesh
//             const outlineMesh = planetOutlines.get(planet.name);
//             if (outlineMesh) outlineMesh.visible = true;
//             outlineMesh.position.copy(planet.object.position);

//             // Show and update the popup
//             popup.style.display = 'block';
//             popup.textContent = planetName[planet.name];
//             popup.style.left = `${event.clientX + 10}px`;
//             popup.style.top = `${event.clientY + 10}px`;
//         }
//     } else {
//         // Hide the popup if no planet is hovered
//         popup.style.display = 'none';
//     }
// });



// // -------- DISTANCE CALCULATOR ---------------

// // Add event listener to the distance calculator button
// distanceButton.addEventListener('click', () => {
//     isCalculatingDistance = !isCalculatingDistance;
//     selectedPlanets = [];
//     if (distanceLine) {
//         scene.remove(distanceLine);
//         distanceLine = null;
//     }
//     if (distanceTextSprite) scene.remove(distanceTextSprite);
    
//     distanceButton.style.background = isCalculatingDistance
//         ? 'rgba(0, 255, 0, 0.7)'
//         : 'rgba(0, 0, 0, 0.7)';
// });

// // Add click event listener for selecting planets
// window.addEventListener('click', (event) => {
    
//     if (!isCalculatingDistance) return;


//     // Convert mouse position to normalized device coordinates
//     mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
//     mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

//     // Use raycaster to detect intersections
//     raycaster.setFromCamera(mouse, camera);
//     const intersects = raycaster.intersectObjects(planets.map(p => p.object));

//     if (intersects.length > 0) {
//         const intersectedPlanet = intersects[0].object;
//         const planet = planets.find(p => p.object === intersectedPlanet);

//         if (planet && !selectedPlanets.includes(planet)) {
//             selectedPlanets.push(planet);

//             // Highlight the selected planet
//             const outlineMesh = planetOutlines.get(planet.name);
//             if (outlineMesh) outlineMesh.visible = true;

//             // Variables for the distance text sprite
//             distanceTextSprite = null;

//             // Update the distance calculation and text rendering
//             if (selectedPlanets.length === 2) {

//                 const points = [
//                     selectedPlanets[0].object.position.clone(),
//                     selectedPlanets[1].object.position.clone()
//                 ];

//                 // Create or update the distance line
//                 if (distanceLine) scene.remove(distanceLine); // Remove existing line
//                 const geometry = new THREE.BufferGeometry().setFromPoints(points);
//                 distanceLine = new THREE.Line(geometry, distanceLineMaterial);
//                 scene.add(distanceLine);

//                 if (distanceTextSprite) scene.remove(distanceTextSprite); // Remove existing sprite
                
//                 // Calculate the distance
//                 distance = points[0].distanceTo(points[1]);

//                 // Calculate the midpoint
//                 const midpoint = new THREE.Vector3().addVectors(points[0], points[1]).divideScalar(2);
//                 midpoint.y += 5; // Offset above the line


//                 distanceTextSprite = createTextSprite(`Distance: ${distance.toFixed(2)} football fields`);
//                 distanceTextSprite.position.copy(midpoint);
//                 scene.add(distanceTextSprite);
//             }
//         }
//     }
// });


// // // Variables for the distance text sprite
// // let distanceTextSprite = null;

// // // Update the distance calculation and text rendering
// // if (selectedPlanets.length === 2) {
// //     const points = [
// //         selectedPlanets[0].object.position.clone(),
// //         selectedPlanets[1].object.position.clone()
// //     ];

// //     // Create or update the distance line
// //     if (distanceLine) scene.remove(distanceLine); // Remove existing line
// //     const geometry = new THREE.BufferGeometry().setFromPoints(points);
// //     distanceLine = new THREE.Line(geometry, distanceLineMaterial);
// //     scene.add(distanceLine);

// //     // Calculate the distance
// //     distance = points[0].distanceTo(points[1]);

// //     // Calculate the midpoint
// //     const midpoint = new THREE.Vector3()
// //         .addVectors(points[0], points[1])
// //         .divideScalar(2);
// //     midpoint.y += 5; // Offset above the line

// //     // Create or update the text sprite
// //     if (distanceTextSprite) {
// //         scene.remove(distanceTextSprite); // Remove existing sprite
// //     }
// //     distanceTextSprite = createTextSprite(`Distance: ${distance.toFixed(2)} units`);
// //     distanceTextSprite.position.copy(midpoint);
// //     scene.add(distanceTextSprite);
// // }












// // ----
// // Function to create a sprite for text
// function createTextSprite(message, parameters = {}) {
//     const fontface = parameters.fontface || "Arial";
//     const fontsize = parameters.fontsize || 24;
//     const canvas = document.createElement('canvas');
//     const context = canvas.getContext('2d');

//     // Set canvas size for crisp text
//     const scaleFactor = 2;
//     canvas.width = 256 * scaleFactor;
//     canvas.height = 128 * scaleFactor;

//     context.font = `${fontsize * scaleFactor}px ${fontface}`;
//     context.fillStyle = parameters.color || "white";
//     context.textAlign = "center";
//     context.textBaseline = "middle";

//     // Draw text
//     context.fillText(message, canvas.width / 2, canvas.height / 2);

//     // Create texture and sprite
//     const texture = new THREE.CanvasTexture(canvas);
//     const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
//     const sprite = new THREE.Sprite(material);

//     // Scale sprite to match text size
//     sprite.scale.set(50, 20, 10); // Adjust scale for desired size
//     return sprite;
// }


