import { playButton, playInterval, dateSlider, dateDisplay, currentStepSize} from '../main.js';
import {updateDateDisplay, validDates, getDateFromSliderValue} from './dateSlider.js';
import {updatePositions } from '../planet.js';

export const createPlayButton = () => {
    const playButton = document.createElement("button");
    playButton.innerText = "Play";
    playButton.style.position = "absolute";
    playButton.style.transform = "translateX(-50%)";
    playButton.style.padding = "10px 20px";
    playButton.style.cursor = "pointer";
    playButton.style.top = '60px';
    playButton.style.left = '50px';
    document.body.appendChild(playButton);
    return playButton;
}




  





