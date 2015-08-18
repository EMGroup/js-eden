wcLayout API
============

A layout object that organizes items inside it into a grid pattern.


****
## Contents ##
[Constructor](#wcLayout)  
[addItem()](#addItem)  
[item()](#item)  
[clear()](#clear)  
[startBatch()](#startBatch)  
[finishBatch()](#finishBatch)  
[showGrid()](#showGrid)  
[gridSpacing()](#gridSpacing)  
[gridAlternate()](#gridAlternate)  
[scene()](#scene)  

****
<a name="wcLayout"></a>
## new wcLayout($container, parent) ##
    You should not be constructing these by hand, every panel
    should construct their own.

**$container**  
Type: JQuery collection object  
The container element for the layout.  

**parent**  
Type: wcPanel object  
The panel that contains this layout.  

****
<a name="addItem"></a>
## addItem(item, x, y, w, h) ##
    Adds a new DOM element into the layout.

**item**  
Type: DOM Element, JQuery collection object, or JQuery selector string  
An element to insert into the layout.  

**x, y**  
Type: Number  
An optional X and Y position to place the item in the layout's table grid.  If the parameters are not supplied, (0, 0) is used.  

**w, h**  
An optional width and height value that determine the number of table grid cells to merge together for this item.  If the parameters are not supplied, only one cell is used.  

****
<a name="item"></a>
## item(x, y) ##
**Version: 2.0.0**  

    Retrieves the table data <td> element at a given grid position.  

**x, y**  
The X and Y position of the table data element to retrieve.  

****
<a name="clear"></a>
## clear() ##
    Clears the contents of the layout.

****
<a name="startBatch"></a>
## startBatch() ##
**Version: 2.0.0**  

    During large operations where many grid elements are created into the
    layout, each addItem() call causes a reflow to happen, which could cause a
    large pause in your application.  startBatch() will flag the layout so that
    the table is no longer re-generated during each addItem operation, once you
    are finished adding items to the layout, you may then use finishBatch() to
    generate the finished table resulting in only one reflow for the entire
    operation.

****
<a name="finishBatch"></a>
## finishBatch() ##
**Version: 2.0.0**  

    See startBatch().

****
<a name="showGrid"></a>
## showGrid(enabled) ##
    Generally for debugging purposes, this will render dotted lines around
    each layout grid cell to help visuallize the current configuration of cells.

**enabled**  
Type: Boolean  
Whether the cell grid should be visible.  

****
<a name="gridSpacing"></a>
## gridSpacing(size) ##
**Version: 2.0.0**  

    Gets, or Sets the spacing size between layout grid cells.

**size**  
Type: Integer  
If supplied, will assign a new spacing size.  

****
<a name="gridAlternate"></a>
## gridAlternate(enabled) ##
**Version: 2.0.0**  

    Alternates the color of each row in the grid.

**enabled**  
Type: Boolean  
If supplied, sets whether each row in the grid should alternate their color.

****
<a name="scene"></a>
## scene() ##
    Retrieves the main scene DOM element used to contain the layout.
