// Signed documents: images above maxSizeMB are resized to 2048px and saved as JPEG;
// other files (PDF) are only size-checked
export const compressDocumentImage = (file: File, maxSizeMB: number = 5): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        reject(new Error(`حجم الملف كبير جداً. أقصى حجم مسموح به هو ${maxSizeMB} ميغابايت.`));
        return;
      }
      resolve(file);
      return;
    }

    if (file.size <= maxSizeMB * 1024 * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 2048;

        if (width > height) {
          if (width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // fill background white for PNG to JPEG conversion
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
        }

        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error("فشل ضغط الصورة."));
          }
        }, 'image/jpeg', 0.8);
      };
      img.onerror = () => reject(new Error("حدث خطأ أثناء قراءة الصورة."));
    };
    reader.onerror = () => reject(new Error("فشل قراءة الملف."));
  });
};
