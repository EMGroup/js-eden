//////////////////////////////////////////////////
//A library that Joe has added to ease everything.
//////////////////////////////////////////////////

joe = {};
joe.store = [];
joe.pageLoaded = function(){

	return;
}

joe.log = function(log){
	//console.log(log);
	joe.store.push(log);
}
