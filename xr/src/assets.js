import { AssetType, defineAssets } from '@iwsdk/core';

const publicAssetUrl = (filePath) =>
  `${import.meta.env.BASE_URL}${filePath.replace(/^\/+/u, '')}`;

// Two plates, 1600x900 each (under the 2048 px budget).
export default defineAssets({
  'plate-today': {
    url: publicAssetUrl('plates/today.jpg'),
    type: AssetType.Texture,
    name: 'Plate: Today',
    priority: 'critical',
  },
  'plate-1885': {
    url: publicAssetUrl('plates/1885.jpg'),
    type: AssetType.Texture,
    name: 'Plate: about 1885',
    priority: 'critical',
  },
});
