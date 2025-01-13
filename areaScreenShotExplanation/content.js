let startX,
  startY,
  endX,
  endY,
  isSelecting = false;
let selectionDiv;
let startSelection = false;

function cleanupCanvasElements() {
  let oldCanvases = document.querySelectorAll(
    'canvas[data-purpose="screenshot-crop"]'
  );
  oldCanvases.forEach((canvas) => {
    canvas.width = 0;
    canvas.height = 0;
    canvas.remove();
  });
}

document.addEventListener("keydown", (keyPressed) => {
  if (keyPressed.key === "Alt") {
    startSelection = true;

    cleanupCanvasElements();
  }
});

document.addEventListener("keyup", (keyPressed) => {
  if (keyPressed.key === "Alt") {
    startSelection = false;
  }
});

document.addEventListener("mousedown", (e) => {
  if (e.button !== 0 || !startSelection) return;
  isSelecting = true;

  // addTheCursorLocation(e);

  // Get the exact pixel position
  startX = Math.round(e.pageX);
  startY = Math.round(e.pageY);

  console.log("startX:", startX, "startY:", startY);

  selectionDiv = document.createElement("div");
  selectionDiv.style.position = "absolute";
  selectionDiv.style.border = "2px dashed transparent";
  selectionDiv.style.backgroundImage =
    "linear-gradient(90deg, #6600ff #800080)";
  selectionDiv.style.backgroundClip = "padding-box";
  selectionDiv.style.borderRadius = "4px";
  selectionDiv.style.boxShadow = `
    0 0 0 2px transparent,
    0 0 8px 2px rgba(255, 0, 0, 0.3),
    0 0 8px 2px rgba(128, 0, 128, 0.3)
  `;
  selectionDiv.style.background = `
    linear-gradient(90deg, #6600ff, #800080) border-box,
    linear-gradient(90deg, transparent, transparent) padding-box
  `;
  selectionDiv.style.WebkitMask =
    "linear-gradient(black 0 0) padding-box, linear-gradient(black 0 0)";
  selectionDiv.style.WebkitMaskComposite = "xor";
  selectionDiv.style.zIndex = "9999";
  // Add 2px offset to account for border width
  selectionDiv.style.left = `${startX - 2}px`;
  selectionDiv.style.top = `${startY - 2}px`;
  document.body.appendChild(selectionDiv);
});

addTheCursorLocation = (e) => {
  console.log("e.pageX:", e.pageX, "e.pageY:", e.pageY);
  let cursorLocation = document.createElement("div");
  cursorLocation.style.position = "absolute";
  cursorLocation.style.left = `${e.pageX + 10}px`;
  cursorLocation.style.top = `${e.pageY + 10}px`;
  cursorLocation.style.backgroundColor = "gray";
  cursorLocation.style.color = "white";
  cursorLocation.style.padding = "5px";
  cursorLocation.style.borderRadius = "5px";
  cursorLocation.style.zIndex = "9999";

  cursorLocation.textContent = "e.pageX: " + e.pageX + " e.pageY: " + e.pageY;
  document.body.appendChild(cursorLocation);
  setTimeout(() => {
    document.body.removeChild(cursorLocation);
  }, 10000);
};

document.addEventListener("mousemove", (e) => {
  if (!isSelecting) return;

  // Get the exact pixel position
  endX = Math.round(e.pageX);
  endY = Math.round(e.pageY);

  // Calculate dimensions including border
  let width = Math.abs(endX - startX);
  let height = Math.abs(endY - startY);

  // Update selection div position and size, accounting for border
  selectionDiv.style.width = `${width}px`;
  selectionDiv.style.height = `${height}px`;
  selectionDiv.style.left = `${Math.min(startX, endX) - 2}px`;
  selectionDiv.style.top = `${Math.min(startY, endY) - 2}px`;
});

document.addEventListener("mouseup", async (e) => {
  if (!isSelecting) return;
  isSelecting = false;

  console.log("endX:", endX, "endY:", endY);

  // addTheCursorLocation(e);

  // Get the final dimensions including border adjustment
  let finalDimensions = {
    x: Math.min(startX, endX) - 2, // Adjust for border
    y: Math.min(startY, endY) - 2,
    width: Math.abs(endX - startX), // Add border width
    height: Math.abs(endY - startY),
  };

  if (selectionDiv) {
    // Store the computed styles before removing
    let computedStyle = window.getComputedStyle(selectionDiv);
    let actualLeft = parseInt(computedStyle.left);
    let actualTop = parseInt(computedStyle.top);
    let actualWidth = parseInt(computedStyle.width);
    let actualHeight = parseInt(computedStyle.height);

    // Update dimensions based on actual computed values
    finalDimensions.x = actualLeft;
    finalDimensions.y = actualTop;
    finalDimensions.width = actualWidth + 10;
    finalDimensions.height = actualHeight + 10;

    // document.body.removeChild(selectionDiv);
    selectionDiv = null;
  }

  if (finalDimensions.width > 0 && finalDimensions.height > 0) {
    console.log("Selection dimensions:", finalDimensions);

    chrome.runtime.sendMessage(
      {
        action: "captureVisibleTab",
      },
      (dataUrl) => {
        console.log("Tab Captured:", dataUrl);

        // let template = document.createElement("template");
        let canvas = document.createElement("canvas");
        // document.body.appendChild(template);
        // template.appendChild(canvas);

        let ctx = canvas.getContext("2d");

        let img = new Image();
        img.src = dataUrl;

        // console.log("img.src", img.src);

        let scaleFactor = window.devicePixelRatio;

        // let croppedwidth = Math.abs(startX - endX) * scaleFactor;
        // let cropepdheight = Math.abs(startY - endY) * scaleFactor;

        // let canvasWidth = Math.abs(startX - endX);
        // let canvasHeight = Math.abs(startY - endY);

        let sourceX = finalDimensions.x * scaleFactor;
        let sourceY = finalDimensions.y * scaleFactor;
        let sourceWidth = finalDimensions.width * scaleFactor;
        let sourceHeight = finalDimensions.height * scaleFactor;

        canvas.width = sourceWidth;
        canvas.height = sourceHeight;

        console.log("finalDimensions:", finalDimensions);

        console.log(
          "canvasWidth:",
          canvas.width,
          "canvasHeight:",
          canvas.height
        );

        console.log("BEFORE canvas.src", canvas.toDataURL("image/png", 1.0));

        img.onload = async () => {
          console.log("img.width:", img.width, "img.height:", img.height);
          ctx.drawImage(
            img,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            canvas.width,
            canvas.height
          );

          console.log("canvas.src", canvas.toDataURL("image/png", 1.0));
        };

        console.log("AFTER canvas.src", canvas.toDataURL("image/png", 1.0));

        context.clearRect(0, 0, canvas.width, canvas.height);

        console.log(
          "AFTER canvas.width:",
          canvas.width,
          "canvas.height:",
          canvas.height
        );

        // console.log("canvas.src", canvas.toDataURL("image/png", 1.0));

        if (!dataUrl) {
          console.error("Failed to capture tab.");
          return;
        }
        cropImage(dataUrl, finalDimensions);
      }
    );
  }
});

function cropImage(dataUrl, dimensions) {
  cleanupCanvasElements();

  return new Promise((resolve, reject) => {
    let img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        let scaleFactor = window.devicePixelRatio;

        let template = document.createElement("template");
        let canvas = document.createElement("canvas");
        document.body.appendChild(template);
        template.appendChild(canvas);

        canvas.setAttribute("data-purpose", "screenshot-crop");

        // Set canvas dimensions to match the selection exactly
        canvas.width = dimensions.width * scaleFactor;
        canvas.height = dimensions.height * scaleFactor;

        let ctx = canvas.getContext("2d", {
          willReadFrequently: true,
          alpha: false,
        });

        // Clear canvas
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        console.log("scaleFactor", scaleFactor);

        // Calculate source coordinates including border offset
        let sourceX = dimensions.x * scaleFactor;
        let sourceY = dimensions.y * scaleFactor;
        let sourceWidth = dimensions.width * scaleFactor;
        let sourceHeight = dimensions.height * scaleFactor;

        // Draw the image
        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          canvas.width,
          canvas.height
        );

        // Convert to PNG
        let croppedDataUrl = canvas.toDataURL("image/png", 1.0);

        // Clean up
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = 0;
        canvas.height = 0;

        resolve(croppedDataUrl);
      } catch (error) {
        console.error("Error during cropping:", error);
        reject(error);
      }
    };

    // console.log("img", img);

    img.onerror = (error) => {
      console.error("Image load error:", error);
      reject(new Error("Failed to load image for cropping"));
    };

    img.src = dataUrl;
  })
    .then((croppedDataUrl) => {
      chrome.runtime.sendMessage(
        {
          action: "saveCroppedImage",
          dataUrl: croppedDataUrl,
        },
        (response) => {
          console.log("response:", response);
        }
      );
    })
    .catch((error) => {
      console.error("Cropping failed:", error);
      chrome.runtime.sendMessage({
        action: "cropError",
        error: error.message,
      });
    });
}
