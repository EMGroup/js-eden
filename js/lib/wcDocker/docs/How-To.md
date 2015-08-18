Instructions
============
Begin by creating an instance of the main docker window and assign it a DOM container element. Typically this would be the document body, but there is no restriction if you want to use a smaller area instead.  Multiple main windows can be used, however, no support exists for cross interaction between them (yet?).  Also note that floating windows are not constrained to the given container element, they can float anywhere in the browser window.
```
#!javascript
var myDocker = new wcDocker(document.body);
```
The main docker window contains docking panels which can be moved around and organized at will by the user. All docking panels have to be registered first before use, this allows the docker to manage their creation.
To register a new type, use the wcDocker.registerPanelType() function in one of two ways:
```
#!javascript
myDocker.registerPanelType('Some type name', function(myPanel, options) {});
// Or
myDocker.registerPanelType('Some type name', {
  onCreate: function(myPanel, options) {},
});
```
The first parameter is a unique name identifier that identifies the panel.  You will also need a callback function or object constructor (the function is called with the 'new' operator, which will either create a new instance of your panel object if you have provided a constructor, or simply calls the creation function) that will be passed into the second parameter as either the function directly, or within an object with other possible options.  

Inside the creation function, or object constructor, you are given the wcPanel that was just created, as well as an optional data value provided during the registration of the panel type (when registering the panel type, the second parameter can be an object with an 'options' key/value).  Every panel contains a wcLayout object which lays out the contents of the panel in a grid format.  To add a DOM element to it, use the layouts addItem function and supply it with either your element directly, a jQuery collection object, or a jQuery creation string, and an x, y grid position within the layout (by default = 0, 0).
You can also stretch an element over multiple grid cells by supplying an optional width and height value.
```
#!javascript
myPanel.layout().addItem(myElement, x, y, width, height);
```
Additionally, you can also assign various starting properties of the panel here, such as the desired or the minimum size.
```
#!javascript
myPanel.initSize(200, 200);
myPanel.minSize(100, 100);
```
Now, once you have registered your panel types, if they are not private, the user will be able to create those panels whenever they wish.  However, it is also recommended that you initialize the window with a starting layout in order to give your users something to see at the beginning.
```
#!javascript
myDocker.addPanel('Registered type name', wcDocker.DOCK_LEFT, optionalTargetPanel, optionalRect);
```
The first parameter is the name of the panel type you have previously registered.
The second parameter is an enumerated value that determines the location where this window will be docked
(or try to dock), it can be one of the following:  

wcDocker.DOCK_MODAL    = Make a floating window that blocks all access to panels below it until closed.  
wcDocker.DOCK_FLOAT    = Make a floating window that is not docked.  
wcDocker.DOCK_LEFT     = Dock it to the left side of the central or target panel.  
wcDocker.DOCK_RIGHT    = Dock it to the right side of the central or target panel.  
wcDocker.DOCK_TOP      = Dock it to the top of the central or target panel.  
wcDocker.DOCK_BOTTOM   = Dock it on the bottom of the central or target panel.  
wcDocker.DOCK_STACKED  = Dock the new panel stacked (tabbed) with another existing panel.  

The fourth parameter is optional, normally panels will dock in relation to the entire docker container. However, by supplying a specific panel instead, your new panel will be docked in relation to that target.
The fifth, and final, parameter is also optional and consists of a data object with custom options.  These options are then passed into the constructor object of the panel when it is created.
The return value is the newly created docking panel, in the case that you may want it.