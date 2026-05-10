const fs = require('fs');
const path = require('path');

const outputFile = 'todo_el_codigo.txt';
// Apuntamos a la carpeta 'apps' que es donde tienes el frontend y backend
const startDir = './apps'; 

// Carpetas que NO queremos incluir
const ignoreDirs = ['node_modules', 'dist', '.git', 'coverage', 'build'];
// Extensiones de archivo que SÍ queremos incluir
const includeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.css', '.html'];

function extractCode(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Si es una carpeta y no está en la lista de ignoradas, entramos de forma recursiva
      if (!ignoreDirs.includes(file)) {
        extractCode(filePath);
      }
    } else {
      // Si es un archivo, verificamos su extensión
      const ext = path.extname(file);
      if (includeExtensions.includes(ext)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        // Separador para identificar de dónde viene el código
        const header = `\n\n=================================================================\n// ARCHIVO: ${filePath}\n=================================================================\n\n`;
        fs.appendFileSync(outputFile, header + content);
      }
    }
  });
}

// Limpiar el archivo de salida si ya existe para no duplicar datos
if (fs.existsSync(outputFile)) {
  fs.unlinkSync(outputFile);
}

console.log('🔄 Extrayendo el código de tu proyecto...');
extractCode(startDir);
console.log(`✅ ¡Listo! Todo tu código ha sido guardado en el archivo: ${outputFile}`);
