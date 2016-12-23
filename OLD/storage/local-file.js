Eden.storageProviders.LocalFile = function (storageManager) {

	function WriteHandle(filename) {
		var contents = "";
		this.getWebURL = function () {
			return "file://" + filename;
		};

		this.writeString = function (string, success, failure) {
			contents = contents + string;
			success();
		};

		this.close = function (container, success, failure) {
			var blob = new Blob([contents],{type:'text/plain'});
			var link = document.createElement("a");
			link.download = filename;
			link.href = window.URL.createObjectURL(blob);
			link.innerHTML = "Download " + filename;
			container.append(link);
			contents = "";
			success();
		};
	}

	function LocalFileStorage() { }
	LocalFileStorage.prototype = new StorageProvider();

	LocalFileStorage.prototype.getHandle = function (scheme, path, mode, success, failure) {
		var handle;
		if (mode == "write") {
			handle = new WriteHandle(path);
			success(handle);
		} else {
			failure("Unable to open file:" + name + ". Mode \"" + mode + "\" is not supported.");
		}
	};

	LocalFileStorage.prototype.canWrite = function () {
		return true;
	};

	LocalFileStorage.prototype.getWriteModes = function () {
		return ["write"];
	};

	LocalFileStorage.prototype.getTitle = function () {
		return "Local Disk";
	};

	LocalFileStorage.prototype.getDescription = function () {
		return "Loads and saves files located on the computer's local hard disk.";
	};

	storageManager.registerProvider(new LocalFileStorage(), "file");
}
