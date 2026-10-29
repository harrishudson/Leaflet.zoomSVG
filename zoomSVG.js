/*
 * Copyright (c) 2026, Harris Hudson.
 *
 * @class zoomSVG
 * @inherits Renderer
 * @aka L.zoomSVG
 *
 * Allows Leaflet vector layers to be displayed with SVG
 * Inherits `Renderer`.
 *
 * @example
 *
 * Use scalable SVG by default for all paths in the map:
 *
 * ```js
 * var map = L.map('map', {renderer: L.zoomSVG()});
 * ```
 *
 */

L.ZoomSVG = L.Renderer.extend({

	_dontMangle: true,

	_hasCircles: false,

	svgCreate: function (name) {
		return document.createElementNS('http://www.w3.org/2000/svg', name);
	},

	pointsToPath: function(rings, closed) {
		var str = '',
		    i, j, len, len2, points, p;

		for (i = 0, len = rings.length; i < len; i++) {
			points = rings[i];

			for (j = 0, len2 = points.length; j < len2; j++) {
				p = points[j];
				str += (j ? 'L' : 'M') + p.x + ' ' + p.y;
			}

			str += closed ? 'z' : '';
		}

		return str || 'M0 0';
	},

	_undefined: function(a) { return typeof a === "undefined"; },

	getEvents: function () {
		var events = L.Renderer.prototype.getEvents.call(this);
		events.zoomstart = this._onZoomStart;
		// Prevent the inherited base Renderer._reset() from running on
		// 'viewreset' - it would reproject and redraw every layer's path,
		// which conflicts with this renderer's whole design.
		events.viewreset = this._onViewReset;
		events.zoomanim = this._onAnimZoom;
		return events;
	},

        _onViewReset: function (evt) {
            // When panning or resetting the view, we only need to update 
            // the CSS transform shift to keep the SVG aligned with the map tiles.
            // We deliberately omit this._update() to prevent unnecessary path re-projection!
            this._updateTransform(this.map.getCenter(), this.map.getZoom());
        },

	// Called once per animated zoom with the *target* center/zoom.
	_onAnimZoom: function (ev) {
		this._updateTransform(ev.center, ev.zoom);
	},

	// Non-animated zoom changes
	_onZoom: function (evt) {
		this._updateTransform(this.map.getCenter(), evt && evt.zoom);
	},

	_updateTransform: function (center, zoom) {
		var newZoom = this._undefined(zoom) ? this.map._zoom : zoom;
		this._zoomDiff = newZoom - this._Orig_zoom;
		this._scale = Math.pow(2, this._zoomDiff);
		this._shift = this.map.latLngToLayerPoint(this._wgsOrigin)
				._subtract(this._wgsInitialShift.multiplyBy(this._scale));

		L.DomUtil.setTransform(this._rootGroup, this._shift, this._scale);
	},

	onAdd: function (map) {
		this.map = map;

		this._dontMangle = true;

		if (!this._container) {
			this._initContainer();
		}

		if (this._zoomAnimated) {
			L.DomUtil.addClass(this._rootGroup, 'leaflet-zoom-animated');
		}

		this._pixelOrigin = map.getPixelOrigin();
		this._wgsOrigin = L.latLng([0, 0]);
		this._wgsInitialShift = this.map.latLngToLayerPoint(this._wgsOrigin);
		this._shift = L.point(0, 0);
		this._scale = 1;
		this._zoom = this._Orig_zoom = this.map.getZoom();

		this.getPane().appendChild(this._container);
		this._update();
		map.on('zoom', this._onZoom, this);
	},

	_initContainer: function () {
		this._container = this.svgCreate('svg');
		this._container.setAttribute('pointer-events', 'none');
		this._container.setAttribute('overflow', 'visible');
		this._rootGroup = this.svgCreate('g');
		this._rootGroup.setAttribute('transform','translate(0,0) scale(1,1)');
		// Hardware acceleration hint to boost SVG transform rendering speed on GPU
		this._rootGroup.style.willChange = 'transform';
		this._container.appendChild(this._rootGroup);
	},

	_destroyContainer: function () {
		L.DomUtil.remove(this._container);
		L.DomEvent.off(this._container);
		delete this._container;
		delete this._rootGroup;
	},

	_onZoomStart: function (evt) { },

	_onZoomChange: function(evt) { },

	_update: function () {
		if (this._map && this._map._animatingZoom && this._bounds) { return; }
		
		// Guard against full re-projection during pure zoom events
		if (this._zooming) {
			if (this._hasCircles) {
				this._updateCircleRadii();
			}
			return;
		}

		L.Renderer.prototype._update.call(this);
		if (this._hasCircles) {
			this._updateCircleRadii();
		}
	},

	_initPath: function (layer) {
		var path;
		if (layer &&
		    layer.feature &&
		    layer.feature.geometry &&
		    layer.feature.geometry.type === 'Point') {
			path = layer._path = this.svgCreate('circle');
		} else {
			path = layer._path = this.svgCreate('path');
		}

		if (layer.options.className) {
			L.DomUtil.addClass(path, layer.options.className);
		}

		if (layer.options.interactive) {
			L.DomUtil.addClass(path, 'leaflet-interactive');
		}

		this._updateStyle(layer);
		this._layers[L.Util.stamp(layer)] = layer;
	},

	_addPath: function (layer) {
		if (!this._rootGroup) { this._initContainer(); }
		this._rootGroup.appendChild(layer._path);
		layer.addInteractiveTarget(layer._path);
	},

	_removePath: function (layer) {
		L.DomUtil.remove(layer._path);
		layer.removeInteractiveTarget(layer._path);
		delete this._layers[L.Util.stamp(layer)];
	},

	_updatePaths: function (layer) { },

	_updateStyle: function (layer) {
		var path = layer._path,
		    options = layer.options;

		if (!path) { return; }

		if (options.stroke) {
			path.setAttribute('vector-effect', 'non-scaling-stroke');
			path.setAttribute('stroke', options.color);
			path.setAttribute('stroke-opacity', options.opacity);
			path.setAttribute('stroke-width', options.weight);
			path.setAttribute('stroke-linecap', options.lineCap);
			path.setAttribute('stroke-linejoin', options.lineJoin);

			if (options.dashArray) {
				path.setAttribute('stroke-dasharray', options.dashArray);
			} else {
				path.removeAttribute('stroke-dasharray');
			}

			if (options.dashOffset) {
				path.setAttribute('stroke-dashoffset', options.dashOffset);
			} else {
				path.removeAttribute('stroke-dashoffset');
			}
		} else {
			path.setAttribute('stroke', 'none');
		}

		if (options.fill) {
			path.setAttribute('fill', options.fillColor || options.color);
			path.setAttribute('fill-opacity', options.fillOpacity);
			path.setAttribute('fill-rule', options.fillRule || 'evenodd');
		} else {
			path.setAttribute('fill', 'none');
		}
	},

	_updatePoly: function (layer, closed) {
		this._setPath(layer, this.pointsToPath(layer._parts, closed));
	},

	_updateCircle: function (layer) {
		var zoomDiff = this.map.getZoom() - this._Orig_zoom;
		var scale = Math.pow(2, zoomDiff);
		var p = layer._point;
		var r = parseFloat(layer._radius / scale);
		this._setPath(layer, null, p.x, p.y, r);
	},

	_updateCircleRadii: function () {
		var zoomDiff = this.map.getZoom() - this._Orig_zoom;
		var scale = Math.pow(2, zoomDiff);
		var circles = this._rootGroup.querySelectorAll('circle');
		circles.forEach(function(circle) {
			let r = parseFloat(circle.getAttribute('data-orig-radius'));
			circle.setAttribute("r", parseFloat(r / scale));
		});
	},

	_setPath: function (layer, path, cx, cy, r) {
		if (path) {
			layer._path.setAttribute('d', path);
		} else {
			layer._path.setAttribute('cx', cx);
			layer._path.setAttribute('cy', cy);
			layer._path.setAttribute('r', r);
			layer._path.setAttribute('data-orig-radius', r);
			this._hasCircles = true;
		}
	},

	_bringToFront: function (layer) {
		L.DomUtil.toFront(layer._path);
	},

	_bringToBack: function (layer) {
		L.DomUtil.toBack(layer._path);
	}
});

L.zoomSVG = function (options) {
	return new L.ZoomSVG(options);
};

L.Map.prototype.latLngToLayerPoint = function (latlng) {
	var projectedPoint;
	if (this.options &&
	    this.options.renderer &&
	    this.options.renderer._dontMangle) {
		projectedPoint = this.project(L.latLng(latlng));
	} else {
		projectedPoint = this.project(L.latLng(latlng))._round();
	}
	return projectedPoint._subtract(this.getPixelOrigin());
};

L.Map.prototype._getNewPixelOrigin = function (center, zoom) {
	var viewHalf = this.getSize()._divideBy(2);
	if (this.options &&
	    this.options.renderer &&
	    this.options.renderer._dontMangle) {
		return this.project(center, zoom)._subtract(viewHalf)._add(this._getMapPanePos());
	} else {
		return this.project(center, zoom)._subtract(viewHalf)._add(this._getMapPanePos())._round();
	}
};

L.Polyline.prototype._update = function() {
	if (!this._map) { return; }
	
	if (this._renderer && this._renderer._dontMangle) {
		// Completely bypass clipping and geometry re-calculation on zoom/pan transforms
		if (this._parts && this._parts.length > 0) {
			this._updatePath();
			return;
		}
		
		// Initial setup: clone raw points directly to _parts without running _clipPoints
		this._parts = [];
		if (this._rings) {
			for (var i = 0; i < this._rings.length; i++) {
				this._parts.push(this._rings[i].slice());
			}
		}
		this._updatePath();
		return;
	}

	this._clipPoints();
	this._simplifyPoints();
	this._updatePath();
};
