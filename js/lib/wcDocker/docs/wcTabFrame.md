wcTabFrame API
==============
**Version: Trunk**  

This is a tabbed document designed to follow the style of docker and its current theme system, for use inside a panel layout.  Each tab is accompanied by its own tab content area that is a wcLayout.  It supports tab re-ordering and removal, but does not allow the tab to be dragged and docked elsewhere.

****
## Contents ##
[Constructor](#wcTabFrame)  
[docker()](#docker)  
[destroy()](#destroy)  
[addTab()](#addTab)  
[removeTab()](#removeTab)  
[tab()](#tab)  
[layout()](#layout)  
[moveTab()](#moveTab)  
[closeable()](#closeable)  
[scrollable()](#scrollable)  
[overflowVisible()](#overflowVisible)  
[icon()](#icon)  
[faicon()](#faicon)  

****
<a name="wcTabFrame"></a>
## new wcTabFrame(container, parent) ##
    The constructor to create the tabbed area.  The container element given
    determines the size and placement of the entire tabbed area including
    individual tabs as well as their content areas.

**container**  
Type: DOM Element or JQuery selector  
The container element for the tabbed document.  

**parent**  
Type: wcPanel object  
The panel that contains this layout.  

****
<a name="docker"></a>
## docker() ##
    A convenience function that retrieves the owning docker instance.

****
<a name="destroy"></a>
## destroy() ##
    Destroys the tab document and all content layouts.

****
<a name="addTab"></a>
## addTab(name, index) ##
    Adds, or Inserts a new tab (with its own wcLayout area) into the
    tabbed document.  Returns the wcLayout of the newly added tab.  

**name**  
Type: String  
The name to display and identify the tab.  

**index**  
Type: Integer  
The index to insert the tab.  If omitted, the tab will be appended to the end.  

****
<a name="removeTab"></a>
## removeTab(index) ##
    Removes a tab at a given index. Returns true if the tab was removed.  

**index**  
Type: Integer  
The index of the tab to remove.  

****
<a name="tab"></a>
## tab(index, autoFocus) ##
    Selects a tab.  

**index**  
Type: Integer  
The index of the tab to select.  

**autoFocus**  
Type: Boolean  
If true, the tab will automatically scroll into view on the title bar if it is not currently visible.  

****
<a name="layout"></a>
## layout(index) ##
    Retrieves the wcLayout at a given tab position.  

**index**  
Type: Integer  
The index of the tab to retrieve.  

****
<a name="moveTab"></a>
## moveTab(fromIndex, toIndex) ##
    Swaps the position of a tab from one position to another.  

**fromIndex**  
Type: Integer  
The index of the tab being moved.  

**toIndex**  
Type: Integer  
The index of the tab to swap with.  

****
<a name="closeable"></a>
## closeable(index, closeable) ##
    Gets, or Sets whether a given tab area can be closed by the user.
    By default, tabs are not close-able.

**index**  
Type: Integer  
The index of the tab to alter.  

**closeable**  
Type: Boolean  
If supplied, assigns whether the tab is close-able.  

****
<a name="scrollable"></a>
## scrollable(index, x, y) ##
    Gets. or Sets whether a given tab area will show scroll bars if
    its contents does not fit.  By default, tabs are scroll-able on
    both axis.
    
**index**  
Type: Integer  
The index of the tab to alter.  

**x, y**  
Type: Boolean  
If supplied, assigns whether the tab is scroll-able on that axis.  

****
<a name="overflowVisible"></a>
## overflowVisible(index, visible) ##
    Gets, or Sets whether a given tab area allows child elements to
    be visible outside of its content area (e.g. popup menu).

**index**  
Type: Integer  
The index of the tab to alter.  

**visible**  
Type: Boolean  
If supplied, assigns whether overflow is enabled on this tab.  

****
<a name="icon"></a>
## icon(index, icon) ##
    Assigns a CSS class to appear as a given tabs icon image.  

**index**  
Type: Integer  
The index of the tab to alter.

**icon**  
Type: String  
A CSS class name that represents the icon.  

****
<a name="faicon"></a>
## faicon(index, icon) ##
    An alternative to the normal css icon, this uses the [Font-Awesome](http://fortawesome.github.io/Font-Awesome/) library.
    Note: You do not need to include the initial "fa fa-" as part of the icon name.

**index**  
Type: Integer  
The index of the tab to alter.  

**icon**  
Type: String  
A [Font-Awesome](http://fortawesome.github.io/Font-Awesome/) icon name (without the prefix "fa fa-").  