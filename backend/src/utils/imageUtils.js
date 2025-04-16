const fs = require('fs');
const path = require('path');

const encodeImage = (imagePath) => {
  try {
    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);
    // Convert to base64
    const base64Image = imageBuffer.toString('base64');
    // Get the file extension
    const ext = path.extname(imagePath).substring(1);
    // Return the data URL
    return `data:image/${ext};base64,${base64Image}`;
  } catch (error) {
    console.error('Error encoding image:', error);
    return null;
  }
};

module.exports = {
  encodeImage
}; 