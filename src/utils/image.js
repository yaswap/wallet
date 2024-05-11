async function getImageInfo(file) {
  const image = await readImage(file);
  return {
    id: image,
    originalName: file.name,
    fileName: file.name,
    url: image,
  };
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const fReader = new FileReader();
    const img = document.createElement('img');

    fReader.onload = () => {
      img.src = fReader.result;
      resolve(getBase64Image(img));
    };

    fReader.readAsDataURL(file);
  });
}

function getBase64Image(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const dataURL = img.src;
  return dataURL;
}

export { getImageInfo };
