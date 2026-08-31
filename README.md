# Leaflet.zoomSVG - A native scalable SVG Renderer for 2D maps
A Leaflet SVG Renderer that does not; re-project, redraw, simplify, or clip features upon map zoom or pan change (only point radii are updated).  Uses native SVG zoom capabilities.  Suitable for 2D maps.  Has no external dependencies.  May, or may not, provide a more desirable user experience than the default SVG renderer. 

![Snapshot](https://harrishudson.com/github/Leaflet-zoomSVG_snapshot1.png)

## Demo
Leaflet GeoJSON [examples](https://harrishudson.com/Leaflet-zoomSVG/examples/).

## Basic Usage
- Ensure Leaflet script and css tags are included
````js
  <!-- Leaflet CSS -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <!-- Leaflet JS -->
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
````
- Include the following tags positioned after the Leaflet script and css tags;
````js
  <link rel="stylesheet" href="zoomSVG.css" />
  <script src="zoomSVG.js"></script>
````
- Use the renderer option to specify L.zoomSVG()
````js
 var map = L.map('map',{renderer: L.zoomSVG()})
````
- For large, high resolution layers, consider disabling zoom animation;
````js
 var map = L.map('map',{ renderer: L.zoomSVG(), zoomAnimation: false})
````

## Author 
Harris Hudson

## Donate
[https://harrishudson.com/#sponsor](https://harrishudson.com/#sponsor)
