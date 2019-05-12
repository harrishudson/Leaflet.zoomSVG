# Leaflet.zoomSVG - Proof-of-Concept
A Leaflet SVG Renderer that does not re-project or redraw features upon map zoom change (only point radii are updated).  
Suitable for 2D maps. Has no external dependencies.  This Proof-of-Concept was developed against Leaflet 1.5.1 and 
inspiration came in part from some other Leaflet plugins.

## Demo
Leaflet GeoJSON [example](http://harrishudson.com/Leaflet-zoomSVG/).

## Requirements
This Proof-of-Concept was developed against Leaflet 1.5.1.

## Future work
Currently doesn't cater for Zoom animation

## Basic Usage
- Ensure Leaflet script and css tags are included
````js
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.5.1/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.5.1/dist/leaflet.js"></script>
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

## Author 
Harris Hudson
