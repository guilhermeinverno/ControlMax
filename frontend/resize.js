import sharp from 'sharp';

async function resize() {
  console.log('Resizing logo.png...');
  
  await sharp('./public/logo.png')
    .resize(192, 192)
    .toFile('./public/icon-192.png');
    
  await sharp('./public/logo.png')
    .resize(512, 512)
    .toFile('./public/icon-512.png');
    
  console.log('Icons resized successfully!');
}

resize().catch(console.error);
