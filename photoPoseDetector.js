"use strict";
// Loading icon till OpenCV package is read and loaded
document.body.classList.add("loading");

// Global flags and array to hold desired template/canny edges
var clickFlag = false;
var redEdgeOverlay = null;
var displayMode = "original";

// This function is called once openCV is ready
function onOpenCvReady() {
  cv["onRuntimeInitialized"] = () => {
    main();
  };
}

/*
This function initiates when OpenCV is ready, grab webcam permissions and call processVideo
*/
function main() {
  // Remove loading icon once OpenCV is loaded
  document.body.classList.remove("loading");
  // Grab elements from the html
  let video = document.getElementById("videoInput");
  let canvas = document.getElementById("imageCanvas");
  let streaming = false; // Define the streaming flag
  // Get permission for webcam from user
  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(function (stream) {
        video.srcObject = stream;
        video.onloadedmetadata = function (e) {
          video.play(); // plays the input webcam stream, can also use autoplay to skip this
          streaming = true; // Set the streaming flag
          canvas.width = video.videoWidth; // Set canvas width
          canvas.height = video.videoHeight; // Set canvas height
          processVideo1(video, streaming);
        };
      })
      .catch(function (error) {
        console.log("Something went wrong!", error);
      });
  }
}

function processVideo1(video, streaming) {
  if (!streaming) return;

  // Define the new width and height for processing
  let processingWidth = 160;
  let processingHeight = 120;

  // Grab elements & get context in 2d for images
  let canvas = document.getElementById("imageCanvas");
  let context = canvas.getContext("2d");

  // Display input source feed
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Read the full-size frame from the canvas
  let fullSizeFrame = cv.imread("imageCanvas");

  // Create a new Mat to hold the resized frame
  let smallFrame = new cv.Mat();

  // Resize the frame
  cv.resize(
    fullSizeFrame,
    smallFrame,
    new cv.Size(processingWidth, processingHeight),
    0,
    0,
    cv.INTER_LINEAR
  );

  // Get values from sliders
  let gaussianBlurSize = parseInt(
    document.getElementById("gaussianBlur").value
  );
  let cannyThresholdLow = parseInt(
    document.getElementById("cannyThresholdLow").value
  );
  let cannyThresholdHigh = parseInt(
    document.getElementById("cannyThresholdHigh").value
  );
  let matchThreshold = parseInt(
    document.getElementById("matchThreshold").value
  );
  let proximity = parseInt(document.getElementById("proximity").value);

  // Define kernel size, read canvas
  let ksize = new cv.Size(gaussianBlurSize, gaussianBlurSize);

  // Define new placeholder frames
  let currentEdges = new cv.Mat();
  let grayFrame = new cv.Mat();

  // Convert the small frame to grayscale and blur it
  cv.cvtColor(smallFrame, grayFrame, cv.COLOR_RGBA2GRAY, 0);
  cv.GaussianBlur(grayFrame, grayFrame, ksize, 0, 0, cv.BORDER_DEFAULT);

  // Perform edge detection on the small frame
  cv.Canny(
    grayFrame,
    currentEdges,
    cannyThresholdLow,
    cannyThresholdHigh,
    3,
    false
  );

  if (displayMode == "canny") {
    // If canny display the edges
    cv.cvtColor(currentEdges, smallFrame, cv.COLOR_GRAY2BGR, 0);
    // Create a new Mat to hold the resized edges
    let displayEdges = new cv.Mat();

    // Resize the edges back to the original size
    cv.resize(
      currentEdges,
      displayEdges,
      fullSizeFrame.size(),
      0,
      0,
      cv.INTER_LINEAR
    );

    // Display the edges
    cv.imshow("imageCanvas", displayEdges);
    // Delete the displayEdges Mat
    displayEdges.delete();
  }

  if (redEdgeOverlay !== null) {
    // Calculate match percentage
    let match = calculateProximityMatch(
      redEdgeOverlay,
      currentEdges,
      proximity
    );
    // Pick green or red based on match %
    let edgeColor =
      match >= matchThreshold ? [0, 255, 0, 255] : [255, 0, 0, 255];
    let coloredTemplateEdges = redEdgeOverlay.clone();
    applyColorToEdges(redEdgeOverlay, coloredTemplateEdges, edgeColor);

    // Create a mask from the colored template edges
    let mask = new cv.Mat();
    cv.cvtColor(coloredTemplateEdges, mask, cv.COLOR_RGBA2GRAY, 0);
    cv.threshold(mask, mask, 1, 255, cv.THRESH_BINARY);

    for (let i = 0; i < mask.rows; i++) {
      for (let j = 0; j < mask.cols; j++) {
        if (mask.ucharPtr(i, j)[0] === 255) {
          let pixel = smallFrame.ucharPtr(i, j);
          let coloredPixel = coloredTemplateEdges.ucharPtr(i, j);
          pixel[0] = coloredPixel[0];
          pixel[1] = coloredPixel[1];
          pixel[2] = coloredPixel[2];
        }
      }
    }

    // Display the result
    let displayOut = new cv.Mat();

    // Resize the edges back to the original size
    cv.resize(
      smallFrame,
      displayOut,
      fullSizeFrame.size(),
      0,
      0,
      cv.INTER_LINEAR
    );

    // Display the edges
    cv.imshow("imageCanvas", displayOut);
    // Delete the displayEdges Mat
    displayOut.delete();
    mask.delete();
    coloredTemplateEdges.delete();
  }
  fullSizeFrame.delete();
  smallFrame.delete();
  currentEdges.delete();
  grayFrame.delete();

  requestAnimationFrame(() => processVideo1(video, streaming));
}

/*
On template shot click, get the canny edges of the current frame and feed it into our global array
*/
document.getElementById("template").addEventListener("click", function () {
  let video = document.getElementById("videoInput");
  let canvas = document.getElementById("imageCanvas");
  let context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  let src = cv.imread("imageCanvas");

  // Define the new width and height for processing
  let processingWidth = 160;
  let processingHeight = 120;

  // Create a new Mat to hold the resized frame
  let smallFrame = new cv.Mat();

  // Resize the frame
  cv.resize(
    src,
    smallFrame,
    new cv.Size(processingWidth, processingHeight),
    0,
    0,
    cv.INTER_LINEAR
  );

  cv.cvtColor(smallFrame, smallFrame, cv.COLOR_RGB2GRAY, 0);
  let gaussianBlurSize = parseInt(
    document.getElementById("gaussianBlur").value
  );
  let cannyThresholdLow = parseInt(
    document.getElementById("cannyThresholdLow").value
  );
  let cannyThresholdHigh = parseInt(
    document.getElementById("cannyThresholdHigh").value
  );
  let ksize = new cv.Size(gaussianBlurSize, gaussianBlurSize);
  cv.GaussianBlur(smallFrame, smallFrame, ksize, 0, 0, cv.BORDER_DEFAULT);
  cv.Canny(
    smallFrame,
    smallFrame,
    cannyThresholdLow,
    cannyThresholdHigh,
    3,
    false
  );
  let coloredEdges = new cv.Mat.zeros(
    smallFrame.rows,
    smallFrame.cols,
    cv.CV_8UC3
  );
  for (let i = 0; i < smallFrame.rows; i++) {
    for (let j = 0; j < smallFrame.cols; j++) {
      if (smallFrame.ucharPtr(i, j)[0] === 255) {
        coloredEdges.ucharPtr(i, j)[0] = 255;
        coloredEdges.ucharPtr(i, j)[1] = 0;
        coloredEdges.ucharPtr(i, j)[2] = 0;
      }
    }
  }
  redEdgeOverlay = coloredEdges.clone();
  src.delete();
  smallFrame.delete();
  coloredEdges.delete();
});

/*
Save screenshot of current frame
*/
document
  .getElementById("takeScreenshot")
  .addEventListener("click", function () {
    let video = document.getElementById("videoInput");
    let canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    let dataURL = canvas.toDataURL("image/png");
    let link = document.createElement("a");
    link.download = "screenshot.png";
    link.href = dataURL;
    link.click();
  });

/*
Upload image, get the canny edges of the image and feed it into our global array
*/
document
  .getElementById("uploadTemplate")
  .addEventListener("change", function (e) {
    if (e.target.files && e.target.files[0]) {
      let reader = new FileReader();
      reader.onload = function (event) {
        let img = new Image();
        img.onload = function () {
          let canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          let context = canvas.getContext("2d");
          context.drawImage(img, 0, 0);
          let src = cv.imread(canvas);

          // Define the new width and height for processing
          let processingWidth = 160;
          let processingHeight = 120;

          // Create a new Mat to hold the resized frame
          let smallFrame = new cv.Mat();

          // Resize the frame
          cv.resize(
            src,
            smallFrame,
            new cv.Size(processingWidth, processingHeight),
            0,
            0,
            cv.INTER_LINEAR
          );

          cv.cvtColor(smallFrame, smallFrame, cv.COLOR_RGB2GRAY, 0);
          let gaussianBlurSize = parseInt(
            document.getElementById("gaussianBlur").value
          );
          let cannyThresholdLow = parseInt(
            document.getElementById("cannyThresholdLow").value
          );
          let cannyThresholdHigh = parseInt(
            document.getElementById("cannyThresholdHigh").value
          );
          let ksize = new cv.Size(gaussianBlurSize, gaussianBlurSize);
          cv.GaussianBlur(
            smallFrame,
            smallFrame,
            ksize,
            0,
            0,
            cv.BORDER_DEFAULT
          );
          cv.Canny(
            smallFrame,
            smallFrame,
            cannyThresholdLow,
            cannyThresholdHigh,
            3,
            false
          );
          let coloredEdges = new cv.Mat.zeros(
            smallFrame.rows,
            smallFrame.cols,
            cv.CV_8UC3
          );
          for (let i = 0; i < smallFrame.rows; i++) {
            for (let j = 0; j < smallFrame.cols; j++) {
              if (smallFrame.ucharPtr(i, j)[0] === 255) {
                coloredEdges.ucharPtr(i, j)[0] = 255;
                coloredEdges.ucharPtr(i, j)[1] = 0;
                coloredEdges.ucharPtr(i, j)[2] = 0;
              }
            }
          }
          redEdgeOverlay = coloredEdges.clone();
          src.delete();
          smallFrame.delete();
          coloredEdges.delete();
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  });

/*
Switch between edge mode and source mode on live feed
*/
document
  .getElementById("toggleDisplayMode")
  .addEventListener("click", function () {
    if (displayMode === "original") {
      displayMode = "canny";
    } else {
      displayMode = "original";
    }
  });
