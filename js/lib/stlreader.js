(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("stlreader", [], factory);
	else if(typeof exports === 'object')
		exports["stlreader"] = factory();
	else
		root["stlreader"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
;
;
;
class stlreader {
    constructor() {
        this.headerLength = 84;
        this.singleFacetLength = 50;
        this.unknownFormatError = `Error Occurred: Unknown format. Input do not correspond to expected layout.`;
        this.writeError = `Input argument should be of type:  
     
										{  
											normals:Float32Array,

											vertices:Float32Array,

											colors:Float32Array   
											
										}, 
							
									got `;
        this.colorError = `Input argument should be of type:
			                              {
											  r : number, //in range 0-31
											  g : number, //in range 0-31
											  b : number, //in range 0-31
											  defaultColor : boolean
										  }, got `;
        this.stlMaxColorSize = 31;
        this.isBinary = (buffer) => {
            if (!this.isArrayBuffer(buffer)) {
                throw new Error('Input argument should be of type ArrayBuffer, got ' + typeof buffer);
            }
            ;
            let bufferByteLength = new Uint8Array(buffer).length;
            let numberOfFacets = this.getNumberOfFacets(buffer);
            return this.headerLength + numberOfFacets * this.singleFacetLength === bufferByteLength;
        };
    }
    read(buffer) {
        let data = null;
        if (!this.isArrayBuffer(buffer)) {
            throw new Error('Input argument should be of type ArrayBuffer, got ' + typeof buffer);
        }
        ;
        let view = new Uint8Array(buffer);
        let beginning = view.slice(0, 200);
        if (this.isASCII(beginning)) {
            data = this.readASCII(buffer);
        }
        else if (this.isBinary(buffer)) {
            data = this.readBinary(buffer);
        }
        else {
            throw new Error(this.unknownFormatError);
        }
        ;
        return data;
    }
    ;
    write(facets) {
        if (!this.isFacets(facets)) {
            throw new Error(this.writeError + JSON.stringify(facets));
        }
        ;
        let numberOfFacets = facets.vertices.length / 9;
        let byteLength = numberOfFacets * this.singleFacetLength + this.headerLength;
        if (!Number.isInteger(byteLength)) {
            throw new Error(this.unknownFormatError);
        }
        ;
        let stl = new ArrayBuffer(byteLength);
        let dataView = new DataView(stl);
        dataView.setUint32(this.headerLength - 4, numberOfFacets, true);
        for (let i = 0; i < facets.vertices.length; i += 9) {
            let byteOffset = this.headerLength + this.singleFacetLength * (i / 9);
            let r = facets.colors[i] || 0;
            let g = facets.colors[i + 1] || 0;
            let b = facets.colors[i + 2] || 0;
            let defaultColor = true;
            dataView.setFloat32(byteOffset, facets.normals[i], true);
            dataView.setFloat32(byteOffset + 4, facets.normals[i + 1], true);
            dataView.setFloat32(byteOffset + 8, facets.normals[i + 2], true);
            dataView.setFloat32(byteOffset + 12, facets.vertices[i], true);
            dataView.setFloat32(byteOffset + 16, facets.vertices[i + 1], true);
            dataView.setFloat32(byteOffset + 20, facets.vertices[i + 2], true);
            dataView.setFloat32(byteOffset + 24, facets.vertices[i + 3], true);
            dataView.setFloat32(byteOffset + 28, facets.vertices[i + 4], true);
            dataView.setFloat32(byteOffset + 32, facets.vertices[i + 5], true);
            dataView.setFloat32(byteOffset + 36, facets.vertices[i + 6], true);
            dataView.setFloat32(byteOffset + 40, facets.vertices[i + 7], true);
            dataView.setFloat32(byteOffset + 44, facets.vertices[i + 8], true);
            dataView.setUint16(byteOffset + 48, this.packColor({ r, g, b, defaultColor }), true);
        }
        ;
        return stl;
    }
    ;
    readBinary(buffer) {
        if (!this.isArrayBuffer(buffer)) {
            throw new Error('Input argument should be of type ArrayBuffer, got ' + typeof buffer);
        }
        ;
        let numberOfFacets = this.getNumberOfFacets(buffer);
        let length = new Uint8Array(buffer).length;
        let normals = [];
        let vertices = [];
        let colors = [];
        let attribByteCount;
        let view = new DataView(buffer);
        let ctr = 0;
        for (let i = this.headerLength; i < length; i += this.singleFacetLength) {
            attribByteCount = view.getUint16(i + this.singleFacetLength - 2, true);
            let { r, g, b, defaultColor } = this.unpackColor(attribByteCount);
            let normal = [view.getFloat32(i, true), view.getFloat32(i + 4, true), view.getFloat32(i + 8, true)];
            normals.push(...normal);
            normals.push(...normal);
            normals.push(...normal);
            vertices.push(view.getFloat32(i + 12, true), view.getFloat32(i + 16, true), view.getFloat32(i + 20, true));
            vertices.push(view.getFloat32(i + 24, true), view.getFloat32(i + 28, true), view.getFloat32(i + 32, true));
            vertices.push(view.getFloat32(i + 36, true), view.getFloat32(i + 40, true), view.getFloat32(i + 44, true));
            colors.push(r, g, b, r, g, b, r, g, b);
        }
        ;
        return {
            normals: new Float32Array(normals),
            vertices: new Float32Array(vertices),
            colors: new Float32Array(colors)
        };
    }
    ;
    getNumberOfFacets(buffer) {
        return new Uint32Array(buffer, 80, 1)[0];
    }
    ;
    filterWords(stringified) {
        return stringified
            .split(' ')
            .map((f) => parseFloat(f))
            .filter((str) => !isNaN(str));
    }
    ;
    readASCII(buffer) {
        if (!this.isArrayBuffer(buffer)) {
            throw new Error('Input argument should be of type ArrayBuffer, got ' + typeof buffer);
        }
        ;
        let facets;
        let normals = [];
        let vertices = [];
        let colors = [];
        let stringified = String.fromCharCode.apply(null, new Uint8Array(buffer));
        let end = stringified.lastIndexOf('endfacet');
        let body = stringified.slice(0, end + 'endfacet'.length);
        let floatArray = this.filterWords(body);
        for (let i = 0; i < floatArray.length; i += 12) {
            let normal = floatArray.slice(i, i + 3);
            let vertex1 = floatArray.slice(i + 3, i + 6);
            let vertex2 = floatArray.slice(i + 6, i + 9);
            let vertex3 = floatArray.slice(i + 9, i + 12);
            normals = normals.concat(normal).concat(normal).concat(normal);
            vertices = vertices.concat(vertex1).concat(vertex2).concat(vertex3);
        }
        ;
        return {
            normals: new Float32Array(normals),
            vertices: new Float32Array(vertices),
            colors: new Float32Array(colors)
        };
    }
    ;
    isASCII(data) {
        let containsSolid = data[0] === 115 &&
            data[1] === 111 &&
            data[2] === 108 &&
            data[3] === 105 &&
            data[4] === 100; //'d' 
        let str = String.fromCharCode.apply(null, new Uint8Array(data));
        let containsWords = str.indexOf("facet") != -1 &&
            str.indexOf("normal") != -1 &&
            str.indexOf("loop") != -1 &&
            str.indexOf("vertex") != -1;
        return containsSolid && containsWords;
    }
    ;
    isArrayBuffer(array) {
        return array instanceof ArrayBuffer;
    }
    ;
    packColor(color) {
        if (!this.isColor(color)) {
            throw new Error(this.colorError + JSON.stringify(color));
        }
        ;
        let byteView = new Uint16Array(1);
        byteView[0] += color.defaultColor ? 1 : 0;
        byteView[0] <<= 5;
        byteView[0] += color.b;
        byteView[0] <<= 5;
        byteView[0] += color.g;
        byteView[0] <<= 5;
        byteView[0] += color.r;
        return byteView[0];
    }
    ;
    unpackColor(attribByteCount) {
        if (isNaN(attribByteCount)) {
            throw new Error('unpackColor: Input value is not a number.');
        }
        ;
        let r = attribByteCount & this.stlMaxColorSize;
        let g = attribByteCount >> 5 & this.stlMaxColorSize;
        let b = attribByteCount >> 10 & this.stlMaxColorSize;
        let defaultColor = !!(attribByteCount & 32768);
        return { r, g, b, defaultColor };
    }
    ;
    isColor(color) {
        if (!color) {
            return false;
        }
        ;
        if (isNaN(color.r) || isNaN(color.g) || isNaN(color.b)) {
            return false;
        }
        ;
        return typeof color === "object" &&
            !isNaN(color.r) && color.r <= 31 && color.r >= 0 &&
            !isNaN(color.g) && color.g <= 31 && color.g >= 0 &&
            !isNaN(color.b) && color.b <= 31 && color.b >= 0 &&
            typeof color.defaultColor === "boolean";
    }
    ;
    isFacets(value) {
        if (value) {
            return value.normals instanceof Float32Array &&
                value.vertices instanceof Float32Array &&
                value.colors instanceof Float32Array;
        }
        ;
        return false;
    }
    ;
}
exports.stlreader = stlreader;
;


/***/ })
/******/ ]);
});