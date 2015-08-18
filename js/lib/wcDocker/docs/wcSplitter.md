wcSplitter API
==============
**Version: 2.1.0**  

The public interface for the panel splitter, separating two halves of the area by a moveable splitter bar.

****
## Contents ##
[Constructor](#wcSplitter)  
[initLayouts()](#initLayouts)  
[docker()](#docker)  
[orientation()](#orientation)  
[minSize()](#minSize)  
[maxSize()](#maxSize)  
[pos()](#pos)  
[pane()](#pane)  
[scrollable()](#scrollable)  
[destroy()](#destroy)  

****
<a name="wcSplitter"></a>
## new wcSplitter(container, parent, orientation) ##
  Constructs a new splitter to split an area into two halves.

**container**  
Type: DOM Element or JQuery Selector  
The DOM element that acts as a container for the splitter.  This can either be in the form of a DOM element, a JQuery collection object, or a JQuery string selector.  

**parent**  
Type: wcPanel or wcSplitter  
A wc widget parent item.  

**orientation**  
Type: Boolean  
The orientation of the splitter bar.  You can use the convenient constants wcDocker.ORIENTATION_HORIZONTAL and wcDocker.ORIENTATION_VERTICAL.  

****
<a name="initLayouts"></a>
## initLayouts() ##
    Initializes the splitter with a wcLayout in each pane.  If you do not use this,
    then you will have to create the widgets yourself and add them properly.

****
<a name="docker"></a>
## docker() ##
    Provides access to the main wcDocker object.

****
<a name="orientation"></a>
## orientation(value) ##
    Gets, or Sets the orientation of the splitter bar.

**value**  
Type: Boolean  
If omitted, will only return the current orientation value, otherwise it sets it.  You can also use the convenient constants wcDocker.ORIENTATION_HORIZONTAL and wcDocker.ORIENTATION_VERTICAL.


****
<a name="minSize"></a>
## minSize() ##
    Retrieves the minimum size of the entire splitter, based on all elements inside.  

****
<a name="maxSize"></a>
## maxSize() ##
    Retrieves the maximum size of the entire splitter, based on all elements inside.  

****
<a name="pos"></a>
## pos(value) ##
    Gets, or Sets the position of the splitter bar.

**value**  
Type: Number  
The desired position (in a percentage value from 0-1) of the splitter bar.  

****
<a name="pane"></a>
## pane(index, item) ##
    Gets, or Sets the element on a given side of the splitter.

**index**  
Type: Number  
The index of the pane you want.  0 for left/top and 1 for right/bottom.  

**item**  
Type: wc Object  
If supplied, assigns a new wc object as the pane.  

****
<a name="scrollable"></a>
## scrollable(index, x, y) ##
    Gets, or Sets whether a given pane can show scroll bars.

**index**  
Type: Number  
The index of the pane you want.  0 for left/top and 1 for right/bottom.  

**x, y**  
Type: Boolean  
Whether the pane can scroll on either the X or Y direction.  

****
<a name="destroy"></a>
## destroy(destroyPanes) ##
   Destroys the splitter.

**destroyPanes**  
Type: Boolean  
If true, the panes attached to the splitter will also be destroyed.  Use false if you plan to re-use the same wc objects elsewhere.  
