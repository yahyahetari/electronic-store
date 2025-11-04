// imagekit-loader.mjs
export default function imageKitLoader({ src, width, quality }) {
  if (src.startsWith('https://ik.imagekit.io')) {
    const url = new URL(src);
    const params = [`w-${width}`];
    if (quality) {
      params.push(`q-${quality}`);
    }
    const paramsString = params.join(',');
    return `${src}?tr=${paramsString}`;
  }
  
  return src;
}