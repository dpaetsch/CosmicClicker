


// Create a distance calculator button
export const createDistanceButton = () => {
    const distanceButton = document.createElement('button');
    distanceButton.textContent = 'Distance Calculator';
    distanceButton.style.fontSize = '20px';
    distanceButton.style.position = 'absolute';
    distanceButton.style.bottom = '10px';
    distanceButton.style.left = '10px';
    distanceButton.style.background = 'rgba(0, 0, 0, 0.7)';
    distanceButton.style.color = 'white';
    distanceButton.style.padding = '10px';
    distanceButton.style.borderRadius = '5px';
    distanceButton.style.border = 'none';
    distanceButton.style.cursor = 'pointer';
    distanceButton.style.fontFamily = 'Arial, sans-serif';
    document.body.appendChild(distanceButton);
    return distanceButton;
}




// Display the distance
export const displayDistance = (distance) => {
    const distancePopup = document.createElement('div');
    distancePopup.style.position = 'absolute';
    distancePopup.style.background = 'rgba(0, 0, 0, 0.7)';
    distancePopup.style.color = 'white';
    distancePopup.style.padding = '10px';
    distancePopup.style.borderRadius = '5px';
    distancePopup.style.fontFamily = 'Arial, sans-serif';
    distancePopup.textContent = `Distance: ${distance.toFixed(2)} Million km`;
    distancePopup.style.bottom = '60px';
    distancePopup.style.left = '10px';
    document.body.appendChild(distancePopup);
    return distancePopup;
}






