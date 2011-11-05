/*
This is our event handler for response to our requests.  It simply calls the callback
  function when data is received and complete:
  
Object status:
  0 = uninitialized
  1 = loading
  2 = loaded
  3 = interactive
  4 = complete
*/
function handleHttpResponse(element)
{
	alert("response");
	if (this.http.readyState == 4 && this.callbackFunction != null) {
		this.callbackFunction(this.http.responseText);
	}
}

function getHttp(url) {
	this.http.onreadystatechange = this.callbackFunction
	this.http.open("GET", url, true); 
	this.http.send();
}

function sendRequest(url, content) {
	this.http.onreadystatechange = this.callbackFunction
	this.http.open("POST", url, true); 
	this.http.send(content);
}

function getXmlHttpObject() {
	var o;
	
	if (window.XMLHttpRequest !== undefined)
		return new XMLHttpRequest();
	
	try
	{
		return new ActiveXObject("Msxml2.XMLHTTP");
	}
	catch (e)
	{
		try
		{
			return new ActiveXObject("Microsoft.XMLHTTP");
		}
		catch (e)
		{
			return null;
		}
	}
	
	return null;
}

function WMAjaxObject(callback) {
	this.http = getXmlHttpObject();
	this.callbackFunction = callback;
	this.sendRequest = sendRequest;
	this.getHttp = getHttp;
}



function executeEdenFile(url) {
	new WMAjaxObject(function(txt) {
			eval(Eden.translateToJavaScript(this.responseText));
		}
	).getHttp(url);
}
