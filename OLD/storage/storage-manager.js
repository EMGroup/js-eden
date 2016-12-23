/*
 * Copyright (c) 2015, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

/*
This file provides a generic framework for loading and saving arbitrary data.  Storage providers
register themselves with an instance of StorageManager and then they become available as locations
to open and save both construals and data used by construals.

A storage provider can be almost anything.  For example, the follow are examples of the potential
sources that a storage provider implementation could facilitate access to.

URLs on the web
The local file system
A relational database
Google Drive
The computer's microphone
Posting a status update to Facebook
Saving an article to Pocket or Instapaper

Correspondingly the words "file" and "path" should be interpreted very broadly in the
discussion that follows.  A file is simply some data stored somewhere, and a path is a piece of text
that uniquely identifies a file that a storage provider is capable of providing access to.

Where can a storage provider potentially be used?  The getWebURL method allows the storage provider API
to be used anywhere where a URL is normally expected, including:





All storage providers must implement the following methods.  Some have basic implementations
provided by the StorageProvider prototype.

hasConfig
	Returns true if the storage provider has configuration options, and false otherwise.

config(container)
	Displays a GUI inside the supplied container (JQuery object) to allow the user to set
	configuration options.

getHandle(scheme, path, mode, success, failure)
	Derives a file handle from a string.  scheme specifies the protocol used, path specifies the
	remainder of the URL string (after the ://), mode specifies the desired mode of file access and
	success and failure are callback functions.  If the file is successfully opened then the success
	function will be called with the file handle provided as the only argument.  See below for descriptions
	of the operations that can be performed on file handles.  If the file cannot be opened for some
	reason then the failure function will be called with a single argument that contains the error
	message.  A file access mode is described by a string.  The semantic meaning of the mode
	string and actual actions that the storage provider takes in order to prepare the file handle
	ready to be accessed in the way described by the mode string are both determined by the storage
	provider.  However, many providers will support common mode strings that perform roughly the
	same role for each provider that implements them.  Examples of potential file modes are "read",
	"write" and "append".

canRead()
	Returns true if the provider supports any file modes that allow existing data to be read.

canWrite()
	Returns true if the provider supports any file modes that allow new data to be added.

getReadModes()
	Returns an array listing the supported file modes that can be used for reading data.

getWriteModes()
	Returns an array listing the supported file modes that can be used for writing data.

getTitle()
	Returns a string containing a short phrase that can used as a label  in a user interface to
	distinguish the provider from other providers.

getDescription()
	Returns a sentence or two that describes the functionality provided by the storage provider.

getIcon()
	Returns an image (32px x 32px) that can be used to represent the storage provider inside a
	graphical user interface.

choose(container, mode, format(s), failure, suggestedName)
	Creates a graphical interface that allows the user to select a location to read data from or
	write data to.  container provides a JQuery object to construct the UI within.  suggestedName (optional)
	is a default filename suggested to the user.  It should not include forward slash (/) characters.
	mode is the desired file access mode.  failure is a function to execute if the file cannot be
	opened or the ability to choose a file is temporarily unavailable and is called with the error
	message as its argument.  format(s) is either a single object or an array of objects that have
	the following fields.
	
	description: A short description of the operation that the file format being represented.
		For example, "Plain Text".
	config: function (container) Optional.  A function that presents a GUI for choosing any file
		import or export options.
	exec: function (fileHandle) A function that is executed if the file is opened successfully and
		this data format was the chosen data format.

Returns true if the provider supports any file modes that allow existing data to be read then it
must also support the following additional methods.

chooseWebURL(container, mode, callback)
	Creates a graphical interface that allows the user to select a location to read data from and
	provides a string to the callback function that provides a URL (often a blob URL) that can be
	used to read the data.  If an error occurs then the callback shall be provided with the empty
	string.  The resulting URL can be used as the value of the src attribute of an <img> tag, or the
	href attribute of a hyperlink, for example.

getWebURL(scheme, path, mode, callback)
	Resolves an abstract URL that has been separated into its scheme and path components and
	provides another URL (often a blob URL) that can be used to read the data in a web browser.  If
	the provider cannot provide access the requested URL then the input is returned as is.

A file handle object must support the following methods.

getURL()
	Returns the URL where the data is stored.

close(container, success, failure)
	Waits until all data queued to be written is written to the underlying storage device, ensures
	that none of the data written to the file will be lost, and releases any system resources
	associated with the file handle.

File handles where the file was opened for reading data will support:

readAllAsString(success, failure)
	Interprets the entire contents of the file as a UTF8 string and provides the string to the
	success function.

File handles where the file was opened for writing will support:

writeString(string, success, failure)
	Inserts a given string into the file at the current location.

*/
StorageManager = function () {
	var providers = [];
	var schemes = {};

	this.registerProvider = function (provider, urlScheme) {
		if (urlScheme !== undefined) {
			if (!(urlScheme in schemes)) {
				schemes[urlScheme] = {};
			}
			for (var mode in provider.getReadModes()) {
				schemes[urlScheme][mode] = provider;
			}
			for (var mode in provider.getWriteModes()) {
				schemes[urlScheme][mode] = provider;
			}
		}
		for (var i = 0; i < providers.length; i++) {
			if (providers[i] == provider) {
				return;
			}
		}
		providers.push(provider);
	}

	this.getHandle = function (url, mode, success, failure) {
		var errorMsg;
		var index = url.indexOf(":");
		if (index == -1) {
			errorMsg = "Unable to access " + url + ".  Malformed URL.";
			failure(errorMsg);
			return;
		}

		var scheme = url.slice(0, index);
		if (!(scheme in schemes)) {
			errorMsg = "Unable to access " + url + ".  No storage provider is available for scheme " + scheme;
			failure(errorMsg);
			return;
		}
		if (!(mode in schemes[scheme])) {
			errorMsg = "Unable to access " + url + ".  No storage provider is available that supports mode \"" + mode + "\" with scheme " + scheme;
			failure(errorMsg);
			return;
		}
		
		var path = url.slice(index + 1);
		if (path.slice(0, 2) == "//") {
			path = path.slice(2);
		}
		schemes[scheme][mode].getHandle(scheme, path, mode, success, failure);
	}

	this.getWebURL = function (url, mode, success, failure) {
		var index = url.indexOf(":");
		if (index == -1) {
			return url;
		}

		var scheme = url.slice(0, index);
		if (!(scheme in schemes)) {
			return url;
		}
		if (!(mode in schemes[scheme])) {
			return url;
		}
		
		var path = url.slice(index + 1);
		if (path.slice(0, 2) == "//") {
			path = path.slice(2);
		}
		//var handle = schemes[scheme][mode].getHandle(scheme, path, mode,, failure);
		
	};
	
	this.getProviders = function () {
		return providers.slice();
	}

	this.getProvidersForMode = function (mode) {
		var supportingProviders = [];
		for (var i = 0; i < providers.length; i++) {
			var provider = providers[i];
			if (provider.getReadModes().indexOf(mode) != -1) {
				supportingProviders.push(provider);
			} else if (provider.getWriteModes().indexOf(mode) != -1) {
				supportingProviders.push(provider);
			}
		}
		return supportingProviders;
	}

	this.getProvider = function (scheme, mode) {
		if (!(scheme in schemes)) {
			return null;
		}
		if (!(mode in schemes[scheme])) {
			return null;
		}
		return schemes[name][mode];
	}

	this.getProviderSchemes = function (provider) {
		var supported = [];
		for (var schemeName in schemes) {
			var scheme = schemes[schemeName];
			for (var mode in scheme) {
				if (scheme[mode] == provider) {
						supported.push(schemeName);
				}
			}
		}
		return supported;
	};

	this.displayProviderMenu = function (menuContainer, container, mode, formats, failure, suggestedName) {

	};

}

function StorageProvider () { }

StorageProvider.prototype.canRead = function () {
	return false;
};

StorageProvider.prototype.canWrite = function () {
	return false;
};

StorageProvider.prototype.getReadModes = function () {
	return [];
};

StorageProvider.prototype.getWriteModes = function () {
	return [];
};

StorageProvider.prototype.hasConfig = function () {
	return false;
};

StorageProvider.prototype.config = function (container) {
	//Nothing to configure.
};

StorageProvider.prototype.getIcon = function () {
	return null;
}

StorageProvider.prototype.choose = function (container, mode, formats, failure, suggestedName) {
	
};

StorageProvider.prototype.chooseWebURL = function (container, mode, callback) {
	
}

StorageProvider.prototype.getWebURL = function (scheme, path, mode, callback) {

}

StorageProvider.prototype.getReadMode = function (preferredMode) {
	var readModes = this.getReadModes();
	for (var i = 0; i < readModes.length; i++) {
		if (readModes[i] == preferredMode) {
			return preferredMode;
		}
	}
	return readModes[0];
};

StorageProvider.prototype.getWriteMode = function (preferredMode) {
	var writeModes = this.getWriteModes();
	for (var i = 0; i < writeModes.length; i++) {
		if (writeModes[i] == preferredMode) {
			return preferredMode;
		}
	}
	return writeModes[0];
};
