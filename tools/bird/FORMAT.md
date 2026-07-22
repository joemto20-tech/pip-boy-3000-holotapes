# B.I.R.D. Runtime Contract

## Display

- Screen: `480 x 320`
- World viewport: `480 x 296`
- Footer: `y = 296..319`
- Palette: four 2-bpp shades

## Worlds

- Source size: `1440 x 1080`
- Camera positions: `x = 0,240,480,720,960`; `y = 0,196,392,588,784`
- Runtime background: 25 overlapping `480 x 296` 2-bpp pages
- Runtime background size: `888000` bytes
- Collision grid: `120 x 90`, one bit per cell
- Collision cell: `12 x 12` pixels
- Collision size: `1350` bytes
- Default NPC limit: 12
- Compact module budget: 20000 bytes

## Interiors

- Width: `480` pixels
- Height: `320..1200` pixels
- Runtime background: row-major 2-bpp BIN
- Row stride: `120` bytes
- Collision: compact rectangles
- Default NPC limit: 8
- Compact module budget: 20000 bytes

## Sprites

- NPC: `34 x 34` IMG
- Animated strip: `102 x 34` IMG or raw 2-bpp BIN
- Strip order: three horizontal frames
- IMG header: width, height, bpp flags, optional transparent index
- Runtime transparency index: 0

## Build Layout

- `SOURCE/*.JS`: readable generated modules
- `SOURCE/*.MIN.JS`: compact generated counterparts
- `HOLO/BIGIRON/CODE/W.JS`: world dispatcher
- `HOLO/BIGIRON/CODE/W_<WORLD_ID>.JS`: one compact module per world
- `HOLO/BIGIRON/CODE/I.JS`: interior dispatcher
- `HOLO/BIGIRON/CODE/INT_<INTERIOR_ID>.JS`: one compact module per interior
- `HOLO/BIGIRON/DATA/MAP_<WORLD_ID>.BIN`: streamed world pages
- `HOLO/BIGIRON/DATA/COL_<WORLD_ID>.BIN`: world collision mask
- `HOLO/BIGIRON/DATA/INT_<INTERIOR_ID>.BIN`: streamed interior image
- `PIPBOY-UPLOAD.txt`: exact upload paths and sizes
