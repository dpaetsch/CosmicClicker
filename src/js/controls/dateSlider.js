
// Precompute valid dates (every 5 days from 1800-01-03 to 2099-12-27)
const startDate = new Date("1800-01-03");
const endDate = new Date("2099-12-27");
export const validDates = [];
for (let date = new Date(startDate); date <= endDate; date.setUTCDate(date.getUTCDate() + 5)) {
  validDates.push(new Date(date.getTime())); // Clone to avoid reference issues
}

// Function to create and manage the slider
export const createDateSlider = () => {
  const dateSlider = document.createElement("input");
  dateSlider.type = "range";
  dateSlider.min = 0;
  dateSlider.max = validDates.length - 1;
  const currentUTCDate = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
  dateSlider.value = validDates.findIndex(date => date.getTime() === currentUTCDate.getTime());
  dateSlider.style.position = "absolute";
  dateSlider.style.bottom = "40px";
  dateSlider.style.left = "50%";
  dateSlider.style.transform = "translateX(-50%)";
  dateSlider.style.width = "80%"; // Make the slider wider
  document.body.appendChild(dateSlider);
  return dateSlider;
};

export const createDateDisplay = () => {
  const dateDisplay = document.createElement("input");
  dateDisplay.type = "text";
  dateDisplay.readOnly = true; // Make the text box read-only
  dateDisplay.style.position = "absolute";
  dateDisplay.style.bottom = "10px";
  dateDisplay.style.left = "50%";
  dateDisplay.style.transform = "translateX(-50%)";
  dateDisplay.style.textAlign = "center";
  dateDisplay.style.width = "200px"; // Adjust width for better readability
  document.body.appendChild(dateDisplay);
  return dateDisplay;
}


export const updateDateDisplay = (dateDisplay, date) => {
  dateDisplay.value = date.toISOString().split("T")[0];
}

// Function to convert slider value to date
export const getDateFromSliderValue = (value) => validDates[value];






