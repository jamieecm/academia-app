const MAX_OUTPUT_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_EDGE = 1440;
const RETRY_IMAGE_EDGE = 1080;

const MEDIAPIPE_WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm";
const SELFIE_SEGMENTER_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite";

type VisionModule = typeof import("@mediapipe/tasks-vision");
type ImageSegmenterInstance = Awaited<
  ReturnType<VisionModule["ImageSegmenter"]["createFromOptions"]>
>;

let visionModulePromise: Promise<VisionModule> | null = null;

function filterTensorflowInfoLog() {
  if (process.env.NODE_ENV !== "development") return () => {};

  const originalConsoleError = console.error;
  const filteredConsoleError = (...args: unknown[]) => {
    const message = args
      .filter((arg): arg is string => typeof arg === "string")
      .join(" ");

    // MediaPipe reports this native INFO line through stderr. Next dev treats
    // it as an error overlay even though it is not a processing failure.
    if (message.includes("Created TensorFlow Lite XNNPACK delegate for CPU.")) {
      return;
    }

    originalConsoleError.apply(console, args);
  };

  console.error = filteredConsoleError;
  return () => {
    if (console.error === filteredConsoleError) {
      console.error = originalConsoleError;
    }
  };
}

function loadVisionModule() {
  visionModulePromise ??= import("@mediapipe/tasks-vision");
  return visionModulePromise;
}

function getOutputDimensions(width: number, height: number, maxEdge: number) {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("El navegador no pudo preparar la imagen PNG."));
    }, "image/png");
  });
}

async function renderTransparentPng(
  source: HTMLCanvasElement,
  confidenceMask: Float32Array,
  maskWidth: number,
  maskHeight: number,
  maxEdge: number
) {
  const dimensions = getOutputDimensions(source.width, source.height, maxEdge);
  const output = document.createElement("canvas");
  output.width = dimensions.width;
  output.height = dimensions.height;

  const outputContext = output.getContext("2d");
  if (!outputContext) throw new Error("No se pudo preparar el lienzo de la imagen.");
  outputContext.drawImage(source, 0, 0, dimensions.width, dimensions.height);

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = maskWidth;
  maskCanvas.height = maskHeight;
  const maskContext = maskCanvas.getContext("2d");
  if (!maskContext) throw new Error("No se pudo preparar la máscara del jugador.");

  const maskPixels = new Uint8ClampedArray(maskWidth * maskHeight * 4);
  for (let pixel = 0; pixel < confidenceMask.length; pixel += 1) {
    const alpha = Math.round(Math.max(0, Math.min(1, confidenceMask[pixel])) * 255);
    const offset = pixel * 4;
    maskPixels[offset] = 255;
    maskPixels[offset + 1] = 255;
    maskPixels[offset + 2] = 255;
    maskPixels[offset + 3] = alpha;
  }
  maskContext.putImageData(new ImageData(maskPixels, maskWidth, maskHeight), 0, 0);

  outputContext.globalCompositeOperation = "destination-in";
  outputContext.imageSmoothingEnabled = true;
  outputContext.drawImage(maskCanvas, 0, 0, dimensions.width, dimensions.height);
  outputContext.globalCompositeOperation = "source-over";

  return canvasToPng(output);
}

export async function removeImageBackground(file: File): Promise<File> {
  if (typeof window === "undefined" || typeof createImageBitmap === "undefined") {
    throw new Error("Tu navegador no admite el procesamiento de fotografías.");
  }

  const restoreConsoleError = filterTensorflowInfoLog();
  let bitmap: ImageBitmap | null = null;
  let segmenter: ImageSegmenterInstance | null = null;

  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const dimensions = getOutputDimensions(bitmap.width, bitmap.height, MAX_IMAGE_EDGE);
    const source = document.createElement("canvas");
    source.width = dimensions.width;
    source.height = dimensions.height;
    const sourceContext = source.getContext("2d");
    if (!sourceContext) throw new Error("No se pudo leer la fotografía.");
    sourceContext.drawImage(bitmap, 0, 0, dimensions.width, dimensions.height);

    const { FilesetResolver, ImageSegmenter } = await loadVisionModule();
    const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
    segmenter = await ImageSegmenter.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: SELFIE_SEGMENTER_MODEL_URL,
        delegate: "CPU",
      },
      runningMode: "IMAGE",
      outputConfidenceMasks: true,
      outputCategoryMask: true,
    });

    const result = segmenter.segment(source);
    try {
      const labels = segmenter.getLabels();
      const labeledPersonIndex = labels.findIndex((label) =>
        /person|human|persona/i.test(label)
      );
      const confidenceMasks = result.confidenceMasks ?? [];
      const confidenceMaskIndex = labeledPersonIndex >= 0
        ? labeledPersonIndex
        : confidenceMasks.length === 1
          ? 0
          : 1;
      const personMask = confidenceMasks[confidenceMaskIndex];

      let maskValues: Float32Array;
      let maskWidth: number;
      let maskHeight: number;

      if (personMask) {
        maskValues = personMask.getAsFloat32Array();
        maskWidth = personMask.width;
        maskHeight = personMask.height;
      } else if (result.categoryMask) {
        const categoryMask = result.categoryMask;
        const categories = categoryMask.getAsUint8Array();
        const personCategoryIndex = labeledPersonIndex >= 0
          ? labeledPersonIndex
          : 1;
        maskValues = Float32Array.from(
          categories,
          (category) => (category === personCategoryIndex ? 1 : 0)
        );
        maskWidth = categoryMask.width;
        maskHeight = categoryMask.height;
      } else {
        throw new Error(
          "El modelo no devolvió una máscara de persona. Vuelve a cargar la página e inténtalo de nuevo."
        );
      }

      let png = await renderTransparentPng(
        source,
        maskValues,
        maskWidth,
        maskHeight,
        MAX_IMAGE_EDGE
      );

      if (png.size > MAX_OUTPUT_SIZE) {
        png = await renderTransparentPng(
          source,
          maskValues,
          maskWidth,
          maskHeight,
          RETRY_IMAGE_EDGE
        );
      }

      if (png.size > MAX_OUTPUT_SIZE) {
        throw new Error("La imagen procesada supera los 5 MB. Prueba con otra fotografía.");
      }

      const filename = file.name.replace(/\.[^.]+$/, "") || "jugador";
      return new File([png], `${filename}.png`, {
        type: "image/png",
        lastModified: Date.now(),
      });
    } finally {
      result.confidenceMasks?.forEach((mask) => mask.close());
      result.categoryMask?.close();
    }
  } finally {
    segmenter?.close();
    bitmap?.close();
    restoreConsoleError();
  }
}
