function SNVertex(id, x,y,z) {
	this.id = id;
	this.vec = [x,y,z]; //vec3.create();
	//vec3.set(this.vec, x, y, z);
	this.faces = [];
	this.normal = vec3.create();
	vec3.set(this.normal,0.0,0.0,0.0);
	this.collapse = null;
	this.cost = 1000000;
	this.deleted = false;
}

SNVertex.prototype.addFace = function(face) {
	for (var i=0; i<this.faces.length; i++) {
		this.faces[i].addAdj(face);
	}
	this.faces.push(face);

	vec3.add(this.normal,this.normal,face.normal);
	//vec3.normalize(this.normal,this.normal);
}

SNVertex.computeEdgeCollapseCost = function(u,v) {
	// if we collapse edge uv by moving u to v then how
	// much different will the model change, i.e. the “error”.
	var edgelength = vec3.distance(v.vec,u.vec);
	var curvature=0;
	// find the “sides” triangles that are on the edge uv
	var sides = [];

	for(var i=0;i<u.faces.length;i++) {
		if(u.faces[i].hasVertex(v)){
			sides.push(u.faces[i]);
		}
	}

	// use the triangle facing most away from the sides
	// to determine our curvature term
	for(var i=0;i<u.faces.length;i++) {
		var mincurv=1;
		for(var j=0;j < sides.length;j++) {
			// use dot product of face normals.
			if (u.faces[i] === sides[j]) continue;
			var dotprod = vec3.dot(u.faces[i].normal, sides[j].normal);
			mincurv = Math.min(mincurv,(1-dotprod)/2.0);
		}
		curvature = Math.max(curvature,mincurv);
	}
	return edgelength * curvature;
}

SNVertex.prototype.adjacentVertices = function() {
	var adj = {};
	for (var i=0; i<this.faces.length; i++) {
		adj[this.faces[i].v1.id] = this.faces[i].v1;
		adj[this.faces[i].v2.id] = this.faces[i].v2;
		adj[this.faces[i].v3.id] = this.faces[i].v3;
	}
	var adjlist = [];
	for (var x in adj) if (x != this.id) adjlist.push(adj[x]);
	return adjlist;
}

SNVertex.prototype.computeEdgeCostAtVertex = function() {
	if(this.faces.length==0) {
		this.collapse=null;
		this.cost=-0.01;
		return;
	}
	this.cost = 1000000;
	this.collapse= null;

	// search all neighboring edges for “least cost” edge
	var adj = this.adjacentVertices();

	for(var i=0; i < adj.length;i++) {
		var c;
		c = SNVertex.computeEdgeCollapseCost(this,adj[i]);
		if(c < this.cost) {
			this.collapse = adj[i];
			this.cost = c;
		}
	}
	return this.cost;
}

function SNFace(id, v1,v2,v3) {
	this.id = id;
	this.v1 = v1;
	this.v2 = v2;
	this.v3 = v3;
	//this.n = vec3.create();
	var norm = Point3D.normal(v1.vec,v2.vec,v3.vec);
	this.normal = [norm.x,norm.y,norm.z];
	this.adj = [];
	this.deleted = false;

	v1.addFace(this);
	v2.addFace(this);
	v3.addFace(this);
}

SNFace.prototype.hasVertex = function(v) {
	return this.v1 === v || this.v2 === v || this.v3 === v;
}

SNFace.prototype.addAdj = function(face) {
	this.adj.push(face);
}

SNFace.prototype.replace = function(va,vb) {
	if (this.hasVertex(vb)) {
		this.deleted = true;
		return;
	}

	if (this.v1 === va) this.v1 = vb;
	else if (this.v2 === va) this.v2 = vb;
	else if (this.v3 === va) this.v3 = vb;

	var norm = Point3D.normal(this.v1.vec,this.v2.vec,this.v3.vec);
	this.normal = [norm.x,norm.y,norm.z];
	vb.addFace(this);
}



//Precompute edge table, like Paul Bourke does.
// This saves a bit of time when computing the centroid of each boundary cell
var SNcube_edges = new Int32Array(24)
  , SNedge_table = new Int32Array(256);
(function() {

  //Initialize the cube_edges table
  // This is just the vertex number of each cube
  var k = 0;
  for(var i=0; i<8; ++i) {
    for(var j=1; j<=4; j<<=1) {
      var p = i^j;
      if(i <= p) {
        SNcube_edges[k++] = i;
        SNcube_edges[k++] = p;
      }
    }
  }

  //Initialize the intersection table.
  //  This is a 2^(cube configuration) ->  2^(edge configuration) map
  //  There is one entry for each possible cube configuration, and the output is a 12-bit vector enumerating all edges crossing the 0-level.
  for(var i=0; i<256; ++i) {
    var em = 0;
    for(var j=0; j<24; j+=2) {
      var a = !!(i & (1<<SNcube_edges[j]))
        , b = !!(i & (1<<SNcube_edges[j+1]));
      em |= a !== b ? (1 << (j >> 1)) : 0;
    }
    SNedge_table[i] = em;
  }
})();

//Internal buffer, this may get resized at run time
var SNbuffer = new Array(4096);
(function() {
  for(var i=0; i<SNbuffer.length; ++i) {
    SNbuffer[i] = 0;
  }
})();

surfaceNets = function(size, values, axisMin, axisRange) {
	var dims = [size,size,size];
	var size2 = size*size;

  var bounds = [[axisMin,axisMin,axisMin],[axisMin+axisRange,axisMin+axisRange,axisMin+axisRange]];
  var delta = axisRange / size;
  var scale     = [0,0,0];
  var shift     = [0,0,0];
  for(var i=0; i<3; ++i) {
    scale[i] = (bounds[1][i] - bounds[0][i]) / dims[i];
    shift[i] = bounds[0][i];
  }
  
  var normals = [];
  var vertices = []
    , faces = []
    , n = 0
    , x = [0, 0, 0]
    , R = [1, (dims[0]+1), (dims[0]+1)*(dims[1]+1)]
    , grid = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
    , buf_no = 1;
  
   
  //Resize buffer if necessary 
  if(R[2] * 2 > SNbuffer.length) {
    var ol = SNbuffer.length;
    SNbuffer.length = R[2] * 2;
    while(ol < SNbuffer.length) {
      SNbuffer[ol++] = 0;
    }
  }
  
  //March over the voxel grid
  for(x[2]=0; x[2]<dims[2]-1; ++x[2], n+=dims[0], buf_no ^= 1, R[2]=-R[2]) {
  
    //m is the pointer into the buffer we are going to use.  
    //This is slightly obtuse because javascript does not have good support for packed data structures, so we must use typed arrays :(
    //The contents of the buffer will be the indices of the vertices on the previous x/y slice of the volume
    var m = 1 + (dims[0]+1) * (1 + buf_no * (dims[1]+1));
    
    for(x[1]=0; x[1]<dims[1]-1; ++x[1], ++n, m+=2)
    for(x[0]=0; x[0]<dims[0]-1; ++x[0], ++n, ++m) {
    
      //Read in 8 field values around this vertex and store them in an array
      //Also calculate 8-bit mask, like in marching cubes, so we can speed up sign checks later
      var mask = 0, g = 0;
      for(var k=0; k<2; ++k)
      for(var j=0; j<2; ++j)      
      for(var i=0; i<2; ++i, ++g) {
       /* var p = potential(
          scale[0]*(x[0]+i)+shift[0],
          scale[1]*(x[1]+j)+shift[1],
          scale[2]*(x[2]+k)+shift[2]);*/
		var p = values[x[0]+i + (x[1]+j)*size + (x[2]+k)*size2];
        grid[g] = p;
        mask |= (p < 0) ? (1<<g) : 0;
      }
      
      //Check for early termination if cell does not intersect boundary
      if(mask === 0 || mask === 0xff) {
        continue;
      }
      
      //Sum up edge intersections
      var edge_mask = SNedge_table[mask]
        , v = [0.0,0.0,0.0]
        , e_count = 0;
        
      //For every edge of the cube...
      for(var i=0; i<12; ++i) {
      
        //Use edge mask to check if it is crossed
        if(!(edge_mask & (1<<i))) {
          continue;
        }
        
        //If it did, increment number of edge crossings
        ++e_count;
        
        //Now find the point of intersection
        var e0 = SNcube_edges[ i<<1 ]       //Unpack vertices
          , e1 = SNcube_edges[(i<<1)+1]
          , g0 = grid[e0]                 //Unpack grid values
          , g1 = grid[e1]
          , t  = g0 - g1;                 //Compute point of intersection
        if(Math.abs(t) > 1e-6) {
          t = g0 / t;
        } else {
          continue;
        }
        
        //Interpolate vertices and add up intersections (this can be done without multiplying)
        for(var j=0, k=1; j<3; ++j, k<<=1) {
          var a = e0 & k
            , b = e1 & k;
          if(a !== b) {
            v[j] += a ? 1.0 - t : t;
			//vn[j] += a ? 1.0 - t : t;
          } else {
            v[j] += a ? 1.0 : 0;
			//vn[j] += a ? 1.0 : 0;
          }
        }
      }
      
      //Now we just average the edge intersections and add them to coordinate
      var s = 1.0 / e_count;
      for(var i=0; i<3; ++i) {
        v[i] = scale[i] * (x[i] + s * v[i]) + shift[i];
      }
      
      //Add vertex to buffer, store pointer to vertex index in buffer
      SNbuffer[m] = vertices.length;
      vertices.push(new SNVertex(SNbuffer[m], v[0],v[1],v[2]));

      //Now we need to add faces together, to do this we just loop over 3 basis components
      for(var i=0; i<3; ++i) {
        //The first three entries of the edge_mask count the crossings along the edge
        if(!(edge_mask & (1<<i)) ) {
          continue;
        }
        
        // i = axes we are point along.  iu, iv = orthogonal axes
        var iu = (i+1)%3
          , iv = (i+2)%3;
          
        //If we are on a boundary, skip it
        if(x[iu] === 0 || x[iv] === 0) {
          continue;
        }
        
        //Otherwise, look up adjacent edges in buffer
        var du = R[iu]
          , dv = R[iv];
        
        //Remember to flip orientation depending on the sign of the corner.
        if(mask & 1) {
          faces.push(new SNFace(faces.length, vertices[SNbuffer[m]], vertices[SNbuffer[m-du]], vertices[SNbuffer[m-dv]]));
          faces.push(new SNFace(faces.length, vertices[SNbuffer[m-dv]], vertices[SNbuffer[m-du]], vertices[SNbuffer[m-du-dv]]));
        } else {
          faces.push(new SNFace(faces.length, vertices[SNbuffer[m]], vertices[SNbuffer[m-dv]], vertices[SNbuffer[m-du]]));
          faces.push(new SNFace(faces.length, vertices[SNbuffer[m-du]], vertices[SNbuffer[m-dv]], vertices[SNbuffer[m-du-dv]]));
        }
      }
    }
  }


	// Remove edges/vertices below certain cost threshold.
	//var vcount = faces.length
	var costthresh = 0;
	var remcount = 0;

	/*for (var i=0; i<vertices.length; i++) {
		if (vertices[i].computeEdgeCostAtVertex() <= costthresh) {
			remcount++;
			for (var j=0; j<vertices[i].faces.length; j++) {
				vertices[i].faces[j].replace(vertices[i],vertices[i].collapse);
			}
			vertices[i].deleted = true;
		}
	}*/
	console.log("Removed "+remcount+" vertices", faces);

	// Repeat if still too many vertices... higher threshold.

	// Convert to GL mesh
	var glverts = new Array();
	var glnorms = new Array();
	var ix = 0;

	for (var i=0; i<faces.length; i++) {
		if (faces[i].deleted) continue;
		if (faces[i].v1.deleted) console.error("Missing vertex");
		if (faces[i].v2.deleted) console.error("Missing vertex");
		if (faces[i].v3.deleted) console.error("Missing vertex");
		glverts[ix] = faces[i].v1.vec[0];
		glverts[ix+1] = faces[i].v1.vec[1];
		glverts[ix+2] = faces[i].v1.vec[2];
		glnorms[ix] = faces[i].normal[0]; //v1.normal[0];
		glnorms[ix+1] = faces[i].normal[1]; //v1.normal[1];
		glnorms[ix+2] = faces[i].normal[2]; //v1.normal[2];
		ix += 3;
		glverts[ix] = faces[i].v2.vec[0];
		glverts[ix+1] = faces[i].v2.vec[1];
		glverts[ix+2] = faces[i].v2.vec[2];
		glnorms[ix] = faces[i].normal[0]; //v2.normal[0];
		glnorms[ix+1] = faces[i].normal[1]; //v2.normal[1];
		glnorms[ix+2] = faces[i].normal[2]; //v2.normal[2];
		ix += 3;
		glverts[ix] = faces[i].v3.vec[0];
		glverts[ix+1] = faces[i].v3.vec[1];
		glverts[ix+2] = faces[i].v3.vec[2];
		glnorms[ix] = faces[i].normal[0]; //v3.normal[0];
		glnorms[ix+1] = faces[i].normal[1]; //v3.normal[1];
		glnorms[ix+2] = faces[i].normal[2]; //v3.normal[2];
		ix += 3;
	}

  
  //All done!  Return the result
	//console.log("VERTS",vertices);
  return { positions: glverts, normals: glnorms };
}

