// Calculate match %
function calculateProximityMatch(
  templateEdges,
  liveFeedEdges,
  proximityRadius
) {
  let matchedEdges = 0;
  let totalTemplateEdges = 0;
  for (let i = 0; i < templateEdges.rows; i++) {
    for (let j = 0; j < templateEdges.cols; j++) {
      if (templateEdges.ucharPtr(i, j)[0] === 255) {
        totalTemplateEdges++;
        if (hasNeighboringEdge(liveFeedEdges, i, j, proximityRadius)) {
          matchedEdges++;
        }
      }
    }
  }
  return (matchedEdges / totalTemplateEdges) * 100;
}

// Find if there is a neighboring pixel in N proximity
function hasNeighboringEdge(edges, x, y, radius) {
  for (let i = -radius; i <= radius; i++) {
    for (let j = -radius; j <= radius; j++) {
      if (i === 0 && j === 0) continue;
      let neighborX = x + i;
      let neighborY = y + j;
      if (
        neighborX >= 0 &&
        neighborX < edges.rows &&
        neighborY >= 0 &&
        neighborY < edges.cols
      ) {
        if (edges.ucharPtr(neighborX, neighborY)[0] === 255) {
          return true;
        }
      }
    }
  }
  return false;
}

// Logger for debugging
function logMatProperties(mat, matName) {
  console.log(`Properties of ${matName}:`);
  console.log(`- Rows (Height): ${mat.rows}`);
  console.log(`- Cols (Width): ${mat.cols}`);
  console.log(`- Type: ${mat.type()}`);
  console.log(`- Channels: ${mat.channels()}`);
  console.log(`- Depth: ${mat.depth()}`);
  let size = mat.size();
  console.log(`- Size: ${size.width} x ${size.height}`);
  let isEmpty = mat.empty();
  console.log(`- Is Empty: ${isEmpty}`);
}

// Apply desired RGB to edges
function applyColorToEdges(edges, coloredEdges, color) {
  for (let i = 0; i < edges.rows; i++) {
    for (let j = 0; j < edges.cols; j++) {
      if (edges.ucharPtr(i, j)[0] === 255) {
        let pixel = coloredEdges.data.subarray(
          i * coloredEdges.cols * coloredEdges.channels() +
            j * coloredEdges.channels(),
          i * coloredEdges.cols * coloredEdges.channels() +
            j * coloredEdges.channels() +
            3
        );

        // Set the color
        pixel[0] = color[0];
        pixel[1] = color[1];
        pixel[2] = color[2];
      }
    }
  }
}

// listeners for displaying number next to sliders
document.getElementById("gaussianBlur").addEventListener("input", function () {
  document.getElementById("gaussianBlurValue").textContent = this.value;
});

document
  .getElementById("cannyThresholdLow")
  .addEventListener("input", function () {
    document.getElementById("cannyThresholdLowValue").textContent = this.value;
  });

document
  .getElementById("cannyThresholdHigh")
  .addEventListener("input", function () {
    document.getElementById("cannyThresholdHighValue").textContent = this.value;
  });

document
  .getElementById("matchThreshold")
  .addEventListener("input", function () {
    document.getElementById("matchThresholdValue").textContent = this.value;
  });

document.getElementById("proximity").addEventListener("input", function () {
  document.getElementById("proximityValue").textContent = this.value;
});

// document.getElementById("blurThreshold").addEventListener("input", function () {
//   document.getElementById("blurThresholdValue").textContent = this.value;
// });
