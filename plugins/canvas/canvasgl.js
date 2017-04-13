EdenUI.plugins.Canvas2D.initGL = function(canvas) {
	// WebGL INIT
	var gl = canvas.getContext("experimental-webgl");
	gl.clearColor(1.0,1.0,1.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.viewportWidth = canvas.width;
	gl.viewportHeight = canvas.height;

	canvas.shader = EdenUI.plugins.Canvas2D.initShaders(gl);

	var colorobj = jQuery.Color( "#555" );
			var r = colorobj.red() / 255;
			var g = colorobj.green() / 255;
			var b = colorobj.blue() / 255;

	gl.uniform3f(
        canvas.shader.ambientColorUniform,
        r,
        g,
        b
      );
}

EdenUI.plugins.Canvas2D.setBackground = function(gl, colour) {
	var colorobj = jQuery.Color( colour );
			var r = colorobj.red() / 255;
			var g = colorobj.green() / 255;
			var b = colorobj.blue() / 255;
	gl.clearColor(r,g,b, 1.0);
}

EdenUI.plugins.Canvas2D.setAmbient = function(gl, shader, colour) {
	var colorobj = jQuery.Color( colour );
			var r = colorobj.red() / 255;
			var g = colorobj.green() / 255;
			var b = colorobj.blue() / 255;
	gl.uniform3f(
        shader.ambientColorUniform,
        r,
        g,
        b
      );
}

EdenUI.plugins.Canvas2D.getShader = function(gl, str, kind) {
      var shader;
      if (kind == "fragment") {
          shader = gl.createShader(gl.FRAGMENT_SHADER);
      } else if (kind == "vertex") {
          shader = gl.createShader(gl.VERTEX_SHADER);
      } else {
          return null;
      }

      gl.shaderSource(shader, str);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          alert(gl.getShaderInfoLog(shader));
          return null;
      }

      return shader;
  }

EdenUI.plugins.Canvas2D.initShaders = function(gl) {
    var fragmentShader = EdenUI.plugins.Canvas2D.getShader(gl, `precision mediump float;

  varying vec2 vTextureCoord;
  varying vec3 vLightWeighting;

  uniform sampler2D uSampler;

  void main(void) {
     vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
		//if (vTextureCoord.s < 0.01 || vTextureCoord.t < 0.01 || vTextureCoord.s > 0.99 || vTextureCoord.t > 0.99) {
		//	gl_FragColor = vec4(0.945,0.49,0,1);
		//} else {
     		gl_FragColor = vec4(textureColor.rgb * vLightWeighting, textureColor.a);
		//}
  }`, "fragment");
    var vertexShader = EdenUI.plugins.Canvas2D.getShader(gl, `attribute vec3 aVertexPosition;
  attribute vec3 aVertexNormal;
  attribute vec2 aTextureCoord;

  uniform mat4 uMVMatrix;
  uniform mat4 uPMatrix;
  uniform mat3 uNMatrix;

  uniform vec3 uAmbientColor;

  uniform vec3 uLightingDirection;
  uniform vec3 uDirectionalColor;
  uniform vec3 uPointLightingLocation;
  uniform vec3 uPointLightingColor;

  uniform bool uUseLighting;

  varying vec2 vTextureCoord;
  varying vec3 vLightWeighting;

  void main(void) {
    vec4 mvPosition = uMVMatrix * vec4(aVertexPosition, 1.0);
    gl_Position = uPMatrix * mvPosition;

    vTextureCoord = aTextureCoord;

    if (!uUseLighting) {
      vLightWeighting = vec3(1.0, 1.0, 1.0);
    } else {
      vec3 lightDirection = normalize(uPointLightingLocation - mvPosition.xyz);
      vec3 transformedNormal = uNMatrix * aVertexNormal;
      float directionalLightWeighting = max(dot(transformedNormal, uLightingDirection), 0.0);
      float pointLightWeighting = max(dot(transformedNormal, lightDirection), 0.0);
      vLightWeighting = uAmbientColor + uDirectionalColor * directionalLightWeighting + uPointLightingColor * pointLightWeighting;
    }
  }`, "vertex");




	// Per fragment lighting
	fragmentShader = EdenUI.plugins.Canvas2D.getShader(gl, `
	precision mediump float;

  varying vec2 vTextureCoord;
  varying vec3 vTransformedNormal;
  varying vec4 vPosition;

  uniform bool uUseLighting;
  uniform bool uUseTextures;

  uniform vec3 uAmbientColor;

  uniform vec3 uPointLightingLocation;
  uniform vec3 uPointLightingColor;

  uniform sampler2D uSampler;

  void main(void) {
    vec3 lightWeighting;
    if (!uUseLighting) {
      lightWeighting = vec3(1.0, 1.0, 1.0);
    } else {
      vec3 lightDirection = normalize(uPointLightingLocation - vPosition.xyz);

      float directionalLightWeighting = max(dot(normalize(vTransformedNormal), lightDirection), 0.0);
      lightWeighting = uAmbientColor + uPointLightingColor * directionalLightWeighting;
    }

    vec4 fragmentColor;
    //if (uUseTextures) {
      fragmentColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
    //} else {
    //  fragmentColor = vec4(1.0, 1.0, 1.0, 1.0);
    //}
    gl_FragColor = vec4(fragmentColor.rgb * lightWeighting, fragmentColor.a);
  }
`,"fragment");

	vertexShader = EdenUI.plugins.Canvas2D.getShader(gl,`
	attribute vec3 aVertexPosition;
  attribute vec3 aVertexNormal;
  attribute vec2 aTextureCoord;

  uniform mat4 uMVMatrix;
  uniform mat4 uPMatrix;
  uniform mat3 uNMatrix;

  varying vec2 vTextureCoord;
  varying vec3 vTransformedNormal;
  varying vec4 vPosition;

  void main(void) {
    vPosition = uMVMatrix * vec4(aVertexPosition, 1.0);
    gl_Position = uPMatrix * vPosition;
    vTextureCoord = aTextureCoord;
    vTransformedNormal = uNMatrix * aVertexNormal;
  }
`,"vertex");





    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
	shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
	shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
   	gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
	//shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    //gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
        shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
        shaderProgram.useLightingUniform = gl.getUniformLocation(shaderProgram, "uUseLighting");
        shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
        shaderProgram.lightingDirectionUniform = gl.getUniformLocation(shaderProgram, "uLightingDirection");
        shaderProgram.directionalColorUniform = gl.getUniformLocation(shaderProgram, "uDirectionalColor");
		shaderProgram.pointLightingLocationUniform = gl.getUniformLocation(shaderProgram, "uPointLightingLocation");
        shaderProgram.pointLightingColorUniform = gl.getUniformLocation(shaderProgram, "uPointLightingColor");
	return shaderProgram;
}
