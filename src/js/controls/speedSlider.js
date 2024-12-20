

export const createSpeedSlider = () => {
    const stepSizeSlider = document.createElement("input");
    stepSizeSlider.type = "range";
    stepSizeSlider.min = 1; // Minimum step size (5 days)
    stepSizeSlider.max = 20; // Maximum step size (100 days)
    stepSizeSlider.value = 1; // Default step size (5 days)
    stepSizeSlider.style.position = "absolute";
    stepSizeSlider.style.bottom = "110px";
    stepSizeSlider.style.left = "50%";
    stepSizeSlider.style.transform = "translateX(-50%)";
    stepSizeSlider.style.width = "80%";
    document.body.appendChild(stepSizeSlider);
    return stepSizeSlider;
}

export const createSpeedDisplay = (stepSizeSlider) => {
    const stepSizeLabel = document.createElement("div");
    stepSizeLabel.innerText = `Step Size: ${stepSizeSlider.value * 5} days`;
    stepSizeLabel.style.color = "white";
    stepSizeLabel.style.position = "absolute";
    stepSizeLabel.style.bottom = "140px";
    stepSizeLabel.style.left = "50%";
    stepSizeLabel.style.transform = "translateX(-50%)";
    stepSizeLabel.style.textAlign = "center";
    document.body.appendChild(stepSizeLabel);
    return stepSizeLabel;
}