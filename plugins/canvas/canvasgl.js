EdenUI.plugins.Canvas2D.initGL = function(canvas) {
	// WebGL INIT
	var gl = canvas.getContext("experimental-webgl");
	gl.clearColor(1.0,1.0,1.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.viewportWidth = canvas.width;
	gl.viewportHeight = canvas.height;

	// Build rectangle shape...
	Rectangle.createBuffer(gl);
	Cube.createBuffer(gl);

	canvas.shader = EdenUI.plugins.Canvas2D.initShaders(gl);
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

  uniform sampler2D uSampler;

  void main(void) {
    gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
  }`, "fragment");
    var vertexShader = EdenUI.plugins.Canvas2D.getShader(gl, `attribute vec3 aVertexPosition;
  attribute vec2 aTextureCoord;

  uniform mat4 uMVMatrix;
  uniform mat4 uPMatrix;

  varying vec2 vTextureCoord;

  void main(void) {
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
	vTextureCoord = aTextureCoord;
  }`, "vertex");

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
	shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
	//shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    //gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	return shaderProgram;
}
