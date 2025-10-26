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

  // Add each processed image to ZIP with watermarked filename
  blobs.forEach((blob, i) => {
    const originalName = originalFiles[i].name;
    const baseName = originalName.replace(/\.[^/.]+$/, "");
    const extension = originalName.split(".").pop() || "jpg";
    const newName = `${baseName}_watermarked.${extension}`;

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
