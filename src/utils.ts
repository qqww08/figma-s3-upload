export const Uint8ArrayToString = (fileData) => {
  let dataString = '';
  for (let i = 0; i < fileData.length; i++) {
    dataString += String.fromCharCode(fileData[i]);
  }
  return dataString;
};
export const StringToUint8Array = (dataString) => {
  const array = new Uint8Array(dataString.length);
  for (let i = 0; i < dataString.length; i++) {
    array[i] = dataString.charCodeAt(i);
  }
  return array;
};
