# PioPlay

Pío es un pollito pixel art que vive en tu teléfono: lo alimentas, lo acaricias, lo mandas a dormir y juegas minijuegos con él.

## Instalar el APK en tu Android

1. Abre la pestaña **Actions** del repositorio y entra a la última ejecución verde de **CI**.
2. Abajo, en **Artifacts**, descarga `pio-apk` (es un .zip con `app-debug.apk` dentro).
3. Pasa el `.apk` al teléfono, ábrelo y permite "instalar apps de origen desconocido" si te lo pide.

Cada APK nuevo se instala encima del anterior sin borrar la partida.

## Desarrollo

Necesitas Node 22.

```bash
npm install
npm run dev        # abre el juego en el navegador (usa la vista de teléfono de las herramientas de desarrollo)
npm test           # pruebas de la lógica
npm run build      # build web en dist/
```

Para compilar el APK en tu computadora además necesitas Java 21 y el SDK de Android:

```bash
npm run android:sync
cd android && ./gradlew assembleDebug
```

## Estructura

- `src/core/`: reglas del juego sin dependencias de Phaser (barras de Pío, guardado). Aquí van las pruebas.
- `src/sprites/`: sprites pixel art definidos como filas de texto, como en el prototipo.
- `src/scenes/`: pantallas de Phaser.
- `android/`: proyecto Android generado por Capacitor.
- `.github/workflows/ci.yml`: pruebas y generación del APK en cada cambio.

## Tecnología

TypeScript, Vite, Phaser 3 y Capacitor. Las decisiones y el diseño del juego están en el proyecto de Claude (`decisiones-iniciales.md` y `gdd.md`).
