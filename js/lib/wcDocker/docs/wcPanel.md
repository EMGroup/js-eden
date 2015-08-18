wcPanel API
===========

The public interface for the docking panel, it contains a layout that can be filled with custom elements and a number of convenience functions for use.

****
## Contents ##
[Constructor](#wcPanel)  
[docker()](#docker)  
[title()](#title)  
[info()](#info)  
[layout()](#layout)  
[focus()](#focus)  
[isVisible()](#isVisible)  
[addButton()](#addButton)  
[removeButton()](#removeButton)  
[buttonState()](#buttonState)  
[initPos()](#initPos)  
[initSize()](#initSize)  
[minSize()](#minSize)  
[maxSize()](#maxSize)  
[width()](#width)  
[height()](#height)  
[icon()](#icon)  
[faicon()](#faicon)  
[scroll()](#scroll)  
[overflowVisible()](#overflowVisible)  
[scrollable()](#scrollable)  
[moveable()](#moveable)  
[closeable()](#closeable)  
[close()](#close)  
[on()](#on)  
[off()](#off)  
[trigger()](#trigger)  

****
<a name="wcPanel"></a>
## new wcPanel(type) ##
    You should not be constructing these by hand, instead use wcDocker.addPanel()
    for proper construction.

**type**  
Type: String  
The type name of the panel, pre-registered using wcDocker.registerPanelType().

****
<a name="docker"></a>
## docker() ##
    Provides access to the main wcDocker object.

****
<a name="title"></a>
## title(title) ##
    Gets, or Sets the displayed title for this panel.  If false is
    passed in, the title bar and all tabs will be removed from the panel.

**title**  
Type: String  
If supplied, will assign a new title for this panel.  

****
<a name="info"></a>
**Version: Trunk**  
## info() ##
    Retrieves the options data associated with this panel's type when it was registered.

****
<a name="layout"></a>
## layout() ##
    Provides access to the internal wcLayout object.

****
<a name="focus"></a>
## focus(flash) ##
    Brings this panel into focus by making its floating window top-most and
    activating its current tab item.

**flash**  
Type: Boolean  
An optional parameter to cause a flashing effect on the window.  

****
<a name="isVisible"></a>
## isVisible() ##
**Version: 2.1.0**  
    Retrieves whether the panel is currently visible in its frame.

****
<a name="addButton"></a>
## addButton(name, className, text, tip, isTogglable, toggleClassName) ##
**Version: 2.0.0**  

    Creates a custom button that appears on the upper right of the panels title bar.
    You can respond to press or toggle actions by catching the wcDocker.EVENT_BUTTON event.

**name**  
Type: String  
The custom name of the button, used to identify it.  

**className**  
Type: String  
A custom class name to apply to the button as its image.  [Font-Awesome](http://fortawesome.github.io/Font-Awesome/) icons can also be used here, must supply all appropriate class names.  

**text**  
Type: String  
In the case that the button icon does not display, you can associate a small (usually a single letter) text to appear in the button instead.  

**tip**  
Type: String  
A tooltip string for the button.  

**isTogglable**  
Type: Boolean  
True to make the button a toggle button.  

**toggleClassName**  
Type: String  
An optional class name to be applied to the button when it is toggled, the original class name will be removed and replaced with this one. Good for having a different icon when the button is toggled. [Font-Awesome](http://fortawesome.github.io/Font-Awesome/) icons can also be used here, see **className**.  

****
<a name="removeButton"></a>
## removeButton(name) ##
**Version: 2.0.0**  

    Removes a previously added button, identified by its name.

**name**  
Type: String  
The previously assigned name of the button to identify it.  

****
<a name="buttonState"></a>
## buttonState(name, isToggled) ##
**Version: 2.0.0**  

    Gets, or Sets the current state of a custom button added with addButton().

**name**  
Type: String  
The name identifier of the button.  

**isToggled**  
Type: Boolean  
An optional value to assign as the toggle state of the current button.

****
<a name="initPos"></a>
## initPos(x, y) ##
    Gets, or Sets the desired starting position for the panel.  Note: Setting the
    position only works during the creation callback of a new panel and only if it
    is floating.

**x, y**  
Type: Number or String  
The desired X and Y screen position (in a percentage value from 0-1) in which to center the floating panel.  
**Version: Trunk**  
This can also be a string value with a 'px' or '%' suffix.  

****
<a name="initSize"></a>
## initSize(x, y) ##
    Sets the initial desired size of the panel.  Note: Setting the size will
    only work during the creation callback of a new panel.

**x, y**  
Type: Number or String  
The desired X and Y size, in pixels, for the panel.  
**Version: Trunk**  
This can also be a string value with a 'px' or '%' suffix.  

****
<a name="minSize"></a>
## minSize(x, y) ##
    Designates a minimum constraint size for this panel.  It is recommended
    that you minimize use of this function except in extreme circumstances,
    as it can severely limit the users interaction.

**x, y**  
Type: Number or String  
The minimum X and Y size, in pixels, for this panel.  
**Version: Trunk**  
This can also be a string value with a 'px' or '%' suffix.  

****
<a name="maxSize"></a>
## maxSize(x, y) ##
    Designates a maximum constraint size for this panel.  It is recommended
    that you minimize use of this function except in extreme circumstances,
    as it can severely limit the users interaction.

**x, y**  
Type: Number and String  
The maximum X and Y size, in pixels, for this panel.  
**Version: Trunk**  
This can also be a string value with a 'px' or '%' suffix.  

****
<a name="width"></a>
## width() ##
**Version: Trunk**  
    Retrieves the width of the panel content area.

****
<a name="height"></a>
## height() ##
**Version: Trunk**  
    Retrieves the height of the panel content area.

****
<a name="icon"></a>
## icon(icon) ##
    Sets the icon to use with the panel, shown in the panels tab widget as
    well as the context menu item when adding a new instance of the panel.
    Note: It is recommended that you supply the icon as an options parameter
    on wcDocker.registerPanelType() function instead of using this function
    directly.

**icon**  
Type: String  
A CSS class name that defines the icon to display.  

****
<a name="faicon"></a>
## faicon(icon) ##
    An alternative to the normal css icon, this uses the [Font-Awesome](http://fortawesome.github.io/Font-Awesome/) library.
    Note: It is recommended that you supply the faicon as an options parameter
    on wcDocker.registerPanelType() function instead of using this function
    directly.

**icon**  
Type: String  
The name of the icon defined by [Font-Awesome](http://fortawesome.github.io/Font-Awesome/)'s library.  

****
<a name="scroll"></a>
## scroll(x, y, duration) ##
    Either scrolls the panel to a given position, or retrieves the current
    scroll position.

**x, y**  
Type: Number and Number  
If supplied, will assign a new X and Y scroll position for the panel.  

**duration**  
**Version: Trunk**  
Type: Number  
If supplied and greater than 0, the scroll movement will be animated.  The duration of the animation is in milliseconds.  

****
<a name="overflowVisible"></a>
## overflowVisible(visible) ##
    Allows elements to draw beyond the bounds of the panel, good for popup menus and the
    like. Note, enabling this feature will cause scrolling of the panel to be disabled.
    If the visibility is not supplied, will retrieve the current visibility instead.

**visible**  
Type: Boolean  
If supplied, will assign the overflow visibility.

****
<a name="scrollable"></a>
## scrollable(x, y) ##
    Designates whether the inner layout can show its scroll bars (if needed).
    By default, x and y scroll is enabled.

**x, y**  
Type: Boolean and Boolean  
Whether the layout can scroll in a direction.  

****
<a name="moveable"></a>
## moveable(enabled) ##
    Gets, or Sets the moveable status of the panel.  A non-moving panel appears
    with no title bar and no panels can be docked relative to it.

**enabled**  
Type: Boolean  
If supplied, will assign whether the panel can be moved.  

****
<a name="closeable"></a>
## closeable(enabled) ##
    Gets, or Sets whether the panel can be closed by the user via 'X' button.

**enabled**  
Type: Boolean  
If supplied, will assign whether the panel can be closed.  

****
<a name="close"></a>
## close() ##
    Closes the panel, this can be done even if closeable is not enabled.

****
<a name="on"></a>
## on(eventType, handler) ##
    Registers the panel to receive an event.

**eventType**  
Type: String  
The event type, case sensitive. Any type name can be used and triggered manually with an optional data object that is passed in as the first parameter to any receiver.  In addition to custom events, wcDocker also provides its own internal event types listed [here](https://github.com/WebCabin/wcDocker/wiki/wcDocker#events).

**handler**  
Type: Function(data)  
The function callback to be called whenever this event has been triggered.  'this' is the panel itself and the parameter given is the custom data object defined by the event type received.  

****
<a name="off"></a>
## off(eventType, handler) ##
    Unregisters an event on this panel.

**eventType**  
Type: String  
The event type to unregister, case sensitive. If the parameter is omitted, all events on the panel will be removed.  

**handler**  
Type: Function(panel, data)  
If supplied, will only remove an event that matches the given handler function.  

****
<a name="trigger"></a>
## trigger(eventType, data) ##
    Manually triggers an event.  This will propagate to all panels and has
    the same functionality as wcDocker.trigger().

**eventType**  
Type: String  
The event type to trigger, case sensitive.  

**data**  
Type: Object  
Any custom data object that will be passed into all receiving event handlers.  