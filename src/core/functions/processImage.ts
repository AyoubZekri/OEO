import heic2any from 'heic2any';

// Converts HEIC to JPEG and shrinks images above maxSizeKB
export const processImage = async (file: File, maxSizeKB: number): Promise<File> => {
  let fileToProcess = file;

  if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
    try {
      const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
      const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      fileToProcess = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });
    } catch (error) {
      console.error('Error converting HEIC image:', error);
      return file;
    }
  }

  return new Promise((resolve) => {
    if (fileToProcess.size <= maxSizeKB * 1024) {
      resolve(fileToProcess);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(fileToProcess);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        let quality = 0.9;
        const checkSize = () => {
          canvas.toBlob((blob) => {
            if (blob) {
              if (blob.size <= maxSizeKB * 1024 || quality <= 0.2) {
                const newFile = new File([blob], fileToProcess.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(newFile);
              } else {
                quality -= 0.1;
                checkSize();
              }
            } else {
              resolve(fileToProcess);
            }
          }, 'image/jpeg', quality);
        };
        checkSize();
      };
      img.onerror = () => {
        resolve(fileToProcess);
      };
    };
  });
};
