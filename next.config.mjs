/** @type {import('next').NextConfig} */
export default {
  // ws (dentro de msedge-tts) falla si se empaqueta ("b.mask is not a function"); se carga tal cual.
  serverExternalPackages: ["msedge-tts", "ws"],
};
