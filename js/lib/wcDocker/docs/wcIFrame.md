wcIFrame API
============
**Version: Trunk**  

The wcIFrame widget makes it easier to include an iFrame into your panel.  Because an iFrame's contents is cleared whenever it is moved in the DOM heirarchy (and changing a panels docking position causes DOM changes), special care must be taken when using them.

This will create an iFrame and place it in a global DOM location.  It will then match its own size and position to a specified element found on the owner panel.  It works rather well, but has its limitations.  Since the iFrame is essentially on top of the window, it can not be only partially hidden.  If the element it is matching is partway hidden beyond the bounds of the panel, then the iFrame will just appear visible beyond the bounds of that panel.  

****
## Contents ##
[Constructor](#wcIFrame)  
[docker()](#docker)  
[openURL()](#openURL)  
[openHTML()](#openHTML)  
[show()](#show)  
[hide()](#hide)  
[window()](#window)  
[destroy()](#destroy)  

****
<a name="wcIFrame"></a>
## new wcIFrame(container, panel) ##
    The constructor to create the iFrame area.  The container element given
    determines the size and placement of the iFrame area including.

**container**  
Type: DOM Element or JQuery selector  
The container element for the iFrame.  

**panel**  
Type: wcPanel object  
The panel that contains this widget.  

****
<a name="docker"></a>
## docker() ##
    A convenience function that retrieves the owning docker instance.

****
<a name="openURL"></a>
## openURL(url) ##
    Opens a given URL address into the iFrame.

**url**  
Type: String  
The full, or relative, path to the page.  

****
<a name="openHTML"></a>
## openHTML(html) ##
    Populates the iFrame with the given HTML source code.

**html**  
Type: String  
The HTML source code.  

****
<a name="show"></a>
## show() ##
    Allows the iFrame to be visible when the panel is visible.

****
<a name="window"></a>
## window() ##
    Retrieves the window from the iFrame object.

****
<a name="hide"></a>
## hide() ##
    Forces the iFrame to be hidden, regardless of whether the panel is visible.

****
<a name="destroy"></a>
## destroy() ##
    Destroys the iFrame element and clears all references.
