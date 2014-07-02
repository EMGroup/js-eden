The files in this directory relate to the presentation of the essay "Realising Software Development as a Lived Experience"

To run the model you execute the file run.js-e, which in turn loads the three files:

essay.js-e
presenter.js-e
shortpres.js-e

If the files load correctly, it should be possible to read the essay from beginning to end, paragraph by paragraph and sentence by sentence by pressing the buttons which specify the current paragraph and the current sentennce within that paragraph. To select any paragraph, you can input

ixpara = X;

where X is an index in the range 1 to 177.

To initiate the presentation of the essay, you enter the definition

ixpara = 178;

The panel on the left of the screen is what the presenter sees.

The panel on the right is a slide that can be projected by extending the display to the right onto a projector, and pressing the Project Slide button on the left of the screen. (The Project Slide button behaves erratically, but if absent can be recovered by tweaking the width of the browser display. F11 is sometimes useful for restoring the entire display to normality.)

Despite appearances, you move from one slide to the next by pressing the button which specifies the current paragraph, and move from one bullet point to the next by pressing the button which specifies the current sentence.

The (here inappropriately named) Previous Slide and Next Slide buttons have a different functionality. Conceptually, in parallel with the presentation, there are two streams of auxiliary slides. Previous Slide and Next Slide are used to switch between one stream and another, according to the value of the (here inappropriately named) observable "currentSlide". Stream 1 is the presentation stream, used to display what appears on the presenter's screen. Stream 2 contains a secondary layer of resources mainly consisting of complementary images that are selected by dependency to accompany the presentation. Stream 3 gives access to an interface which enables the presentation to switch from one mode to another - for instance focusing on just those paragraphs which contain a specific keyword (keyword=="" means that all paragraphs are included), or enabling a convenient switch to a specific paragraph. This interface uses embedded JS-EDEN actions. Two mechanisms are featured here:

One bookmarks the current slide, adapts the paragraphs being presented to reflect a keyword, and transforms the presentation into a presentation of paragraphs relating to that keyword. A JS-EDEN action that resets the keyword and returns the focus to the bookmarked paragraph serves To return to the main presentation.

The other (used on the slide with index 189) takes the form of a JS-EDEN action that should be *copied* to the input window and executed. It has the effect of redirecting the focus of the presentation to a specific point in the essay, as specified by the value assigned to ixpara. To restore focus to the current slide, you can recall this command via the Input Window and execute it a second time.

By using these mechanisms, it is possible (with a cool head and practice) to navigate through the presentation. It is also possible to demonstrate the seamless connection between the presentation environment and the model interpretation environment by (e.g.) loading the JUGSinJS-E/jugspres.e file at the conclusion of the presentation.
  