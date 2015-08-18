wcDocker API
============

The main window instance.  This manages all of the docking panels and user input. There should only be one instance of this, although it is not enforced.

****
## Contents ##
[Definitions: DOCK](#docks)  
[Definitions: EVENT](#events)  
[Definitions: ORIENTATION](#orientations)  
[Constructor](#wcDocker)  
[registerPanelType()](#registerPanelType)  
[panelTypes()](#panelTypes)  
[panelTypeInfo()](#panelTypeInfo)  
[addPanel()](#addPanel)  
[removePanel()](#removePanel)  
[movePanel()](#movePanel)  
[findPanels()](#findPanels)  
[on()](#on)  
[off()](#off)  
[trigger()](#trigger)  
[basicMenu()](#basicMenu)  
[bypassMenu()](#bypassMenu)  
[save()](#save)  
[restore()](#restore)  
[clear()](#clear)  

****
<a name="docks"></a>
## Definitions: DOCK ##
<a name="DOCK_FLOAT"></a>
- **wcDocker.DOCK_FLOAT**  
    - Internal Value: "float"  
    - Positions as a floating window.  
<a name="DOCK_TOP"></a>
- **wcDocker.DOCK_TOP**  
    - Internal Value: "top"  
    - Positions on top of the full window or relative to the target panel.  
<a name="DOCK_BOTTOM"></a>
- **wcDocker.DOCK_BOTTOM**  
    - Internal Value: "bottom"  
    - Positions on the bottom of the full window or relative to the target panel.  
<a name="DOCK_LEFT"></a>
- **wcDocker.DOCK_LEFT**  
    - Internal Value: "left"  
    - Positions on the left of the full window or relative to the target panel.  
<a name="DOCK_RIGHT"></a>
- **wcDocker.DOCK_RIGHT**  
    - Internal Value: "top"  
    - Positions on the right of the full window or relative to the target panel.  

**Version: Trunk**  
<a name="DOCK_MODAL"></a>
- **wcDocker.DOCK_MODAL**  
    - Internal Value: "modal"  
    - Positions as a floating window and blocks all access to panels beneath until it has been closed.  
<a name="DOCK_STACKED"></a>
- **wcDocker.DOCK_STACKED**  
    - Internal Value: "stacked"  
    - Merges the new panel with an existing target panel as a new tab item.  

****
<a name="events"></a>
## Definitions: EVENT ##
<a name="EVENT_UPDATED"></a>
- **wcDocker.EVENT_UPDATED**  
   - Internal Value: 'panelUpdated'  
   - Data: None  
   - When the panel is updated internally (usually when it is resized).  
<a name="EVENT_CLOSED"></a>
- **wcDocker.EVENT_CLOSED**  
   - Internal Value: 'panelClosed'  
   - Data: None  
   - When the panel has been closed and is about to be destroyed.  
<a name="EVENT_ATTACHED"></a>
- **wcDocker.EVENT_ATTACHED**  
   - Internal Value: 'panelAttached'  
   - Data: None  
   - When the panel has changed from a floating panel to a docked panel.  
<a name="EVENT_ATTACHED"></a>
- **wcDocker.EVENT_DETACHED**  
   - Internal Value: 'panelDetached'  
   - Data: None  
   - When the panel has changed from a docked panel to a floating panel.  
<a name="EVENT_MOVED"></a>
- **wcDocker.EVENT_MOVED**  
   - Internal Value: 'panelMoved'  
   - Data: None  
   - Whenever the position of the panel has changed.  
<a name="EVENT_RESIZED"></a>
- **wcDocker.EVENT_RESIZED**  
   - Internal Value: 'panelResized'  
   - Data: None  
   - Whenever the size of the panel has changed.  
<a name="EVENT_SCROLLED"></a>
- **wcDocker.EVENT_SCROLLED**  
   - Internal Value: 'panelScrolled'  
   - Data: None  
   - Whenever the contents of the panel has scrolled.  
<a name="EVENT_SAVE_LAYOUT"></a>
- **wcDocker.EVENT_SAVE_LAYOUT**  
   - Internal Value: 'layoutSave'  
   - Data: An empty object which can be assigned any options you wish to save for the given panel.  
   - Whenever the layout is being saved on this panel.  
<a name="EVENT_RESTORE_LAYOUT"></a>
- **wcDocker.EVENT_RESTORE_LAYOUT**  
   - Internal Value: 'layoutRestore'  
   - Data: An object that matches the previously saved data from wcDocker.EVENT_SAVE_LAYOUT.  
   - Whenever the layout is being restored on this panel.  

**Version: 2.0.0**  
<a name="EVENT_BUTTON"></a>
- **wcDocker.EVENT_BUTTON**  
   - Internal Value: 'panelButton'  
   - Data: {name: String, isToggled: Boolean}  
   - Whenever a custom button, added with wcPanel.addButton(), for the panel is pressed or toggled by the user, this event is triggered with a data object in the form {name:String, isToggled:Boolean}.  The name is the name identifier used as the first parameter of the addButton() function and isToggled shows whether a toggle-able button is toggled.  
<a name="EVENT_MOVE_STARTED"></a>
- **wcDocker.EVENT_MOVE_STARTED**  
   - Internal Value: 'panelMoveStarted'  
   - Data: None  
   - When the position of the panel has started moving.  
<a name="EVENT_MOVE_ENDED"></a>
- **wcDocker.EVENT_MOVE_ENDED**  
   - Internal Value: 'panelMoveEnded'  
   - Data: None  
   - When the position of the panel has stopped moving.  
<a name="EVENT_RESIZE_STARTED"></a>
- **wcDocker.EVENT_RESIZE_STARTED**  
   - Internal Value: 'panelResizeStarted'  
   - Data: None  
   - Whenever the size of the panel has started changing.  
<a name="EVENT_RESIZE_ENDED"></a>
- **wcDocker.EVENT_RESIZE_ENDED**  
   - Internal Value: 'panelResizeEnded'  
   - Data: None  
   - Whenever the size of the panel has stopped changing.  

**Version: 2.1.0**  
<a name="EVENT_VISIBILITY_CHANGED"></a>
- **wcDocker.EVENT_VISIBILITY_CHANGED**  
   - Internal Value: 'panelVisibilityChanged'  
   - Data: None  
   - Whenever the panel becomes visible or invisible to the user (via tab change).  See wcPanel.isVisible().  
<a name="EVENT_BEGIN_DOCK"></a>
- **wcDocker.EVENT_BEGIN_DOCK**  
   - Internal Value: 'panelBeginDock'  
   - Data: None  
   - Triggered when the user begins moving a panel via drag-drop.  
<a name="EVENT_END_DOCK"></a>
- **wcDocker.EVENT_END_DOCK**  
   - Internal Value: 'panelEndDock'  
   - Data: None  
   - Triggered when the user releases the moving panel to a location.  
<a name="EVENT_GAIN_FOCUS"></a>
- **wcDocker.EVENT_GAIN_FOCUS**  
   - Internal Value: 'panelGainFocus'  
   - Data: None  
   - Triggered whenever the user clicks on the panel to bring it into focus.  
<a name="EVENT_LOST_FOCUS"></a>
- **wcDocker.EVENT_LOST_FOCUS**  
   - Internal Value: 'panelLostFocus'  
   - Data: None  
   - Triggered whenever a currently in-focus panel loses its focus.  

**Version: Trunk**  
<a name="EVENT_INIT"></a>
- **wcDocker.EVENT_INIT**  
   - Internal Value: 'panelInit'  
   - Data: None  
   - Triggered once before a panel's first update.  

****
<a name="orientations"></a>
## Definitions: ORIENTATION ##
<a name="ORIENTATION_VERTICAL"></a>
- **wcDocker.ORIENTATION_VERTICAL**  
    - Internal Value: false  
    - Lays a splitter vertically (a pane to the top and bottom).  
<a name="ORIENTATION_HORIZONTAL"></a>
- **wcDocker.ORIENTATION_HORIZONTAL**  
    - Internal Value: true  
    - Lays a splitter horizontally (a pane to the left and right).  

****
<a name="wcDocker"></a>
## new wcDocker(container, options) ##
    Constructs a new docker window.

**container**  
Type: DOM Element or JQuery Selector  
The DOM element that acts as a container for the window.  This can either be in the form of a DOM element, a JQuery collection object, or a JQuery string selector.

**options**  
**Version: 2.0.0**  
Type: Object  
An optional object that can define any options you wish to initialize the the docker with.  Supported options are:  
- **allowContextMenu**  
    Type: Boolean  
    Default: True  
    Whether to allow the built in context menu system.  

****
<a name="registerPanelType"></a>
## registerPanelType(name, optionsOrCallback) ##
    Registers a new panel type, all panels must be registered before use.

    Returns true on success, false on failure.

**name**  
Type: String  
The type name, case sensitive and must be unique.  

**optionsOrCallback**  
**Version: 2.0.0**  
Type: Object or Function(panel)  
A function or object constructor, or an options object that contains one along with other parameters.  Supported options are:  
- **icon**  
    Type: String  
    Default: ""  
    A CSS class name to draw an icon in the panels tab widget.  
- **faicon**  
    Type: String  
    Default: ""  
    An icon name using the Font-Awesome [http://fortawesome.github.io/Font-Awesome/](http://fortawesome.github.io/Font-Awesome/) library.  You must download and link to the library's css file to use them.  
- **title**  
    Type: String  
    Default: The Panels name  
    An optional parameter that allows you to assign a custom title text for the panel to display independently of the panels original name identifier  
- **isPrivate**  
    Type: Boolean  
    Default: false  
    If true, the user will not be able to create this panel type  
- **onCreate**  
    Type: Function(panel)  
    A function or an object constructor that is called on panel creation.  The supplied parameter **panel** is the newly created panel.  This function is called using the 'new' operator and stored as a member of the panel, in the case that the function is actually a class object.
- **options**  
    Type: Object  
    A custom options value to be passed into the new panel constructor or creation function as the second parameter.  
- **limit**  
    **Version: Trunk**  
    Type: Number  
    Enforces a limited number of this panel type from being created by the user.

**isPrivate**  
Type: Boolean  
Default: false  
This parameter remains for legacy purposes, recommended that you use an options object from the previous parameter and use the **isPrivate** option instead.  

****
<a name="panelTypes"></a>
**Version: trunk**  
## panelTypes(includePrivate) ##
    Retrieves a list of registered panel types.

**includePrivate**  
type: Boolean  
Default: false  
If set to true, panels registered as private will also appear in the result list.  

****
<a name="panelTypeInfo"></a>
**Version: Trunk**  
## panelTypeInfo(typeName) ##
    Retrieves the options data associated with a given panel type when it was registered.
Also see [wcPanel.info()](https://github.com/WebCabin/wcDocker/wiki/wcPanel#info).

**typeName**  
Type: String  
A string that matches a previously registered panel type, case sensitive.  

****
<a name="addPanel"></a>
## addPanel(typeName, location, targetPanel, rect) ##
    Adds a new instance of a panel type to the window.

    Returns the newly created wcPanel object on success, false on failure.

**typeName**  
Type: String  
A string that matches a previously registered panel type, case sensitive.  

**location**  
Type: String  
An enumerated string value that determines where the new panel should be positioned.  
Valid docking positions are listed [here](#docks).

**allowGroup**  
**Version: < 2.0.0**  
Type: Boolean  
Note: This is now a removed parameter, replaced with wcDocker.DOCK_STACKED docking location.  
Whether the new panel should be combined with the parent panel or nearest panel at a given location as another tabbed item.  

**targetPanel**  
Type: wcPanel object  
An optional parameter, if supplied, the new panel will be positioned relative to this target panel.  

**rect**  
**Version: Trunk**  
Type: Object  
An optional rectangle object with the parameters x, y, w, h that give you better control over the position and size of the new panel.  x and y parameters are optional, and only work when the panel is floating.  w and h values are width and height of the panel in pixels, any value less than zero will be ignored.

****
<a name="removePanel"></a>
## removePanel(panel) ##
    Removes a panel from the window.

    Returns true on success, false on failure.

**panel**  
Type: wcPanel object  
The panel object to remove.  

****
<a name="movePanel"></a>
## movePanel(panel, location, targetPanel, rect) ##
    Moves an already created panel to a new docking position in the window.

    Returns true on success, false on failure.

**panel**  
Type: wcPanel object  
The panel object to move.  

**location**  
Type: String  
An enumerated string value that determines where the panel should be positioned.  
See wcDocker.addPanel() for more information on valid locations.  

**allowGroup**  
**Version: < 2.0.0**  
Type: Boolean  
Note: This is now a removed parameter, replaced with wcDocker.DOCK_STACKED docking location.  
Whether the panel should be combined with the parent panel or nearest panel at a given location as another tabbed item.  

**targetPanel**  
Type: wcPanel object  
An optional parameter, if supplied, the panel will be positioned relative to this target panel.  

**rect**  
**Version: Trunk**  
Type: Object  
An optional rectangle object with the parameters x, y, w, h that give you better control over the position and size of the moved panel.  x and y parameters are optional, and only work when the panel is floating.  w and h values are width and height of the panel in pixels, any value less than zero will be ignored.  

****
<a name="findPanels"></a>
## findPanels(typeName) ##
    Searches the window for all panels of a given type.

    Returns an array of all wcPanel objects found.

**typeName**  
Type: String  
A string that matches a previously registered panel type, case sensitive. If left blank, all panels are retrieved.  

****
<a name="on"></a>
## on(eventType, handler) ##
**Version: 2.0.0**  

    Registers the panel to receive an event.

**eventType**  
Type: String  
The event type, case sensitive. Any type name can be used and triggered manually.  

**handler**  
Type: Function(data)  
The function callback to be called whenever this event has been triggered.  'this' is the docker itself and the parameter given is the custom data object defined by the actual event being received.  

****
<a name="off"></a>
## off(eventType, handler) ##
**Version: 2.0.0**  

    Unregisters an event on this panel.

**eventType**  
Type: String  
The event type to unregister, case sensitive. If the parameter is omitted, all events on the panel will be removed.  

**handler**  
Type: Function(panel, data)  
If supplied, will only remove an event that matches the given handler function.  

****
<a name="trigger"></a>
## trigger(eventName, data) ##
    Manually triggers an event on all panels.

**eventName**  
Type: String  
The name of the event to trigger.  

**data**  
Type: Object  
A custom data object to be passed in to all receiving event handlers.  

****
<a name="basicMenu"></a>
## basicMenu(selector, itemListOrBuildFunc, includeDefault) ##
    A simplified method for creating a basic context menu.  If you wish to use a more
    complex context menu, you can use $.contextMenu library directly.

See http://medialize.github.io/jQuery-contextMenu/docs.html for more information.

**selector**  
Type: String  
A JQuery selector string that defines which element(s) will have this context menu.  

**itemListOrBuildFunc**  
**Version: 2.0.0**  
Type: Object Array or Function($trigger, event)  
An array of objects that define each menu item in the format {name:String, [icon:String], [faicon:String], callback:Function(key,opts,panel)}, or a function that generates and returns this structure dynamically.  The function passes in two parameters, the element that triggered the menu and the event object defined by the context menu system (JQuery ContextMenu).  

**includeDefault**  
**Version: 2.0.0**  
Type: Boolean  
If true, will also include all the default context menu options supplied by the panel.  

****
<a name="bypassMenu"></a>
## bypassMenu() ##
**Version: 2.0.0**  

    You can use this during a mouse up event to cancel any context menu
    that is about to appear.

****
<a name="save"></a>
## save() ##
    Saves the entire layout configuration and returns you a metadata string.

****
<a name="restore"></a>
## restore(data) ##
    Restores a previously saved layout configuration.
    This will reconstruct all panels.

**data**  
Type: String  
A metadata string previously retrieved from the save() function.  

****
<a name="clear"></a>
## clear() ##
    Removes all panels from the window and leaves you with the central layout only.
