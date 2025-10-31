import JSZip from "jszip";
import * as fileSaver from "file-saver";

/**
 * Download processed images as a ZIP file
 */
export async function downloadAsZip(
  blobs: Blob[],
  originalFiles: File[],
  zipName: string = "watermarked_images.zip"
): Promise<void> {
  const zip = new JSZip();

  // Add each processed image to ZIP with sequential numbered filenames
  // All processed images are JPEG format, so use .jpg extension
  blobs.forEach((blob, i) => {
    // Use 1-indexed numbering: 1.jpg, 2.jpg, etc.
    const newName = `${i + 1}.jpg`;

    zip.file(newName, blob);
  });

  // Generate and download ZIP
  const zipBlob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  fileSaver.saveAs(zipBlob, zipName);
}
