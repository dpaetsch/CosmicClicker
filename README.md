# CosmicClicker

Cosmic Clicker is an interactive solar system viewer that leverages NASA’s ephemeris data to display the precise positions of planets for any given day. The viewer also visualizes planetary orbits, offering a clear representation of their paths through space. Additional features include a speed adapter and a distance calculator, enhancing the user’s understanding of the vast scale and dynamics of the solar system.

## DEMO:

https://github.com/user-attachments/assets/89f410b5-5a67-4ebb-99f7-2a4bf1fa7794

## How to use:
1. Navigate to the project’s base folder and install dependencies: `npm install`
2. Start the development server by running in the `src` folder: `npx parcel index.html` 
3. Open the provided localhost URL in your browser (e.g., http://localhost:1234).

## Website Features
- Navigation: Use your mouse to zoom, pan, and rotate the solar system view.
- Planet Movement: Click the play button to start or stop planetary motion.
- Speed Control: Adjust the speed slider to skip days and accelerate planetary movements.
- Date Adjustment: Use the date slider to view planetary positions on specific dates.
- Distance Calculator: Select two planets to calculate and visualize the distance between them.


## NASA Ephemeral Data
To see how I got the NASA data, I used the JPL Horizons System API, fetched using python in this project: ![https://github.com/dpaetsch/nasa_horizons_api]
