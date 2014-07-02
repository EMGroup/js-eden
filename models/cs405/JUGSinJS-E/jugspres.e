## to protect against loss of information whilst constructing the presentation

${{
  
var workIsDone = false;
window.onbeforeunload = confirmBrowseAway;

function confirmBrowseAway()
{
  if (!workIsDone) {
    return "Are you sure? If you leave this page now, your work will NOT be saved.";
  }
};
  
}}$;

include("models/jugs/run.e");
include("jspe.js-e");

s1 is Slide("<h3>Introducing the JUGS model</h3> <p>This is a simple introduction to the JUGS model as implemented in JS-EDEN.</p> <p>The JUGS model is displayed on the LHS of the canvas.</p> <p>There are two 'jugs' in the display: Jug A on the left and Jug B on the right. These jugs have capacities 5 and 7 respectively. From a <i>functional</i> perspective, you are intended to achieve the target quantity of liquid specified to the right of the jugs by filling, emptying and pouring.</p> <p>You can exercise the model as a program by pressing the buttons. For instance, there is a sequence of actions to reach the target in which you only ever <i>fill</i> jug A and <i>empty</i> jug B (and vice versa).</p> ");

slideList is [s1];

## s2 is Slide("");
## slideList is [s1, s2];

s2 is Slide("<h3>Beyond the functional perspective</h3><p>We can adopt a quite different perspective on the JUGS model by looking at it in relation to physical instances of containers in the world.</p>
<p>
<img src='http://empublic.dcs.warwick.ac.uk/projects/jugspresentationKing2005/jugs.gif' height=150 width=200>
</p>
<p>
Here the emphasis is on how the abstract operations performed on the jugs are informed by our rich experience of the physical world.
Consider for instance the meanings of the words 'fill', 'empty', 'pour', and the notion of 'content' and 'liquid'.
</p>
<p>
When viewed from a functional perspective, the JUGS model is seen as an essential simplification. The model and the operations are just enough to fulfill its purpose.
</p>
<p>
From the experiential perspective, the JUGS model is an impoverished representation of a referent - a representation that could be enriched in an open-ended fashion.
</p>
<p>
The idea behind EM is that the way in which the model is constructed is critical as far as supporting <i>both</i> these interpretations is concerned.
</p>
");

s3 is Slide("<h3>Exploring the model</h3><p>To examine the model construction more closely, we can open the <b>Observables & Agents</b> tab (perhaps <b>Observables & <i>Dependencies</i></b> would be more appropriate). </p>
<p>
The observables on display are quite diverse in nature. Some of them (such as 'canvas' or 'slidelist' relate to meta aspects of the state of the artefact on display). It's useful to be able to isolate the observables of interest. Which these are of course depends on the context for observation.
</p>
<img src='http://www2.warwick.ac.uk/fac/sci/dcs/research/em/basicconstrual.gif' height=225 width=270>
<p>
");
slideList is [s1, s2, s3];

s4 is Slide("
<h3>What are plausible contexts?</h3> 
<ul>
<li>I could be concerned with the actual process of how to achieve the target.</li>
<li>I could be concerned about the aesthetics of the display ... the present form is quite a mess.</li>
<li>I could be concerned about the speed and authenticity of the pouring ... liquid flows in integer multiples (which is a good thing from the functional perspective, bad from the experiential), but a bit too fast for this to be quite obvious (not such a good thing from the functional perspective, good from the experiential).</li>
</ul>
</p>
<p>
<i>How can we focus on the particular observables relevant to a context?</i>
</p>
");
slideList is [s1, s2, s3, s4];

s5 is Slide("<h3>Displaying observable values</h3><p>To display the observables relevant to a particular context, enter a regular expression into the search box at the top of the <b>Observables & Agents</b> panel.</p>
<p>
For instance, to focus on the key parameters in the JUGS model from a functional perspective, cut-and-paste the following RE into the search box:
</p>
<b>
content[A!B]|^cap|target
</b>
</p>
<p>
This will display the target and the capacities and contents of the jugs. You can then see how the process of reaching the target is reflected in the values of these key observables.
</p>
<p>
If you want to make the updating process easier to see, you will need to change the value of the observable <code>viscosity</code>:
</p>
<b>
content[A!B]|^cap|target|visc
</b>
<p>
The buttons on the display provide one way of changing the values of observables. 
Such changes reflect the functional goal and follow a carefully crafted pattern.
The buttons give machine-like control over the state of the model.
</p>
<p>
In the present environment, there are many other ways in which the values of observables can be changed.
The model is constructed in such a way that changes that respect potential meanings are the most accessible.
This is what makes <i>this particular</i> JUGS model different from a typical traditional program.
</p>
");

slideList is [s1, s2, s3, s4, s5];

s6 is Slide("
<h3>Changing observable values</h3>
<p>Many different kinds of agency are relevant to the JUGS model.</p>
<p>The model was originally conceived as a way of encouraging <i>schoolchildren</i> to explore simple arithmetic operations that underlie elementary concepts in number theory.</p>
<p>
The <i>teacher</i> would want to change the jug capacities and/or the target. They might also want to adapt the interface to clarify the way the updating processes work.
</p>
<p>
Ways to change the values - and definitions - of observables are:
<ul>
<li>by double-clicking on the observable name in the <b>O&A</b> panel, and editing and saving its definition as then displayed in a textbox.</li>
<li>by directly entering a new definition via the Eden Interpreter Window.</li>
</ul>
It is also possible to enable the <i>presenter</i> to change values from within this presentation environment.
For instance, placing a piece of JS-EDEN script within &lt;jseden>...&lt;/jseden> tags allows the reader to execute the script, or copy it to the Eden Interpreter Window for editing prior to execution. There are some simple illustrations on the next slide.
</p>
");

slideList is [s1, s2, s3, s4, s5, s6];

s7 is Slide("
<h3>Changing parameters from the presentation environment</h3>
<p>
Embedding actions for redefining observables into a presentation can highlight the way in which changes to parameters are linked with changes in interpretation.
This often goes beyond routine interactions.
It then has an experimental 'What if?' / 'Could it be that?' quality.
<jseden>viscosity = 300;</jseden>
<jseden>capB = 8;</jseden>
<jseden>target is 2 * max(capA, capB) - capA - capB;
## target is max(capA, capB) - min(capA, capB);
## is what is intended, but only max() is built-in to JS-EDEN
</jseden>
</p>
<p>
The explicit representation of current state makes it easy to restore state:
<jseden>target = 1;</jseden>
</p>
");
slideList is [s1, s2, s3, s4, s5, s6, s7];

s8 is Slide("
<h3>Dependencies within the model</h3>
<p>The dependencies between observables in the JUGS model guide its possible interpretations.
We expect the 'Fill A' menu option to be unavailable when the content of the jug A is the same as its capacity.
Assigning <code>contentA</code> to <code>capA</code> confirms this:
<jseden>contentA = capA;</jseden>
</p>
<p>
You can trace the relevant dependencies by examining the following observables:
</p>
<b>
content[A!B]|^cap|target|visc|valid1|Afull|but1$
</b>
<p>
The current values of these observables are displayed in the O&A panel.
Observables that are defined explicitly (using '=') and by dependency (using 'is') are shown in black and blue respectively.</p>
");
slideList is [s1, s2, s3, s4, s5, s6, s7, s8];

s9 is Slide("
<h3>Experimenting with the JUGS model</h3>
<p>
The idea of experimentation only makes sense if we go beyond the functional interpretation of the JUGS model.
After all, classical training in programming warns us that:
<ul>
<li>our interface should prevent actions that take us outside the scope of intended behaviours.</li>
<li>if a model is used in a way that is inconsistent with its specified preconditions no significance can be attached to the results ('anything goes').</li>
</ul>
</p>
<p>
The JUGS model doesn't have a pre-specified interpretation.
It has whatever interpretations we can make plausible.
</p>
<p>
The next slide frames sample experimental interactions.
</p>
");

slideList is [s1, s2, s3, s4, s5, s6, s7, s8, s9];

s10 is Slide("
<h3>Supporting experimental interactions</h3> <p>An experimental context needs to be configured in a standard way.
Reloading the original script for the JUGS model is a way to reset the context:
<jseden>include(\"models/jugs/run.e\");</jseden>
</p>
<p>
It may also be necessary or helpful to introduce extra apparatus for an experiment.
For instance, to make it easier to change the colour of the liquid in jug A, we can replace:
<jseden>jugA_water is Rectangle(left+linewidth,
base - (scale * contentA),jugwidth-(2*linewidth),scale * contentA,
\"blue\");</jseden>
</p><p>by the two definitions</p><p>
<jseden>watercolour = \"blue\";
jugA_water is Rectangle(left+linewidth,
base - (scale * contentA),jugwidth-(2*linewidth),scale * contentA,
watercolour);</jseden>
</p>
");

slideList is [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10];

s11 is Slide("
<h3>Sample experimental interactions</h3> <p>
Keep the reset of the context handy in case experiments go wrong!
<jseden>include(\"models/jugs/run.e\");</jseden>
</p>
<p>
Simulate selection of the 'Fill B' option by setting the observable <code>input</code>:
<jseden>input = 2;</jseden>
</p>
<p>
Reduce the capacity of Jug B by a unit:
<jseden>capB = capB-1;</jseden>
</p>
<p>
Now fill jug B again!
<jseden>input = 2;</jseden>
</p>
");

slideList is [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11];

s12 is Slide("
<h3>Sample experimental interactions (continued)</h3> <p>
Keep the reset of the context handy in case experiments go wrong!
<jseden>include(\"models/jugs/run.e\");</jseden>
</p>
<p>
Increase the capacity of Jug B by half a unit:
<jseden>capB = capB + 0.5;</jseden>
</p>
<p>
Now fill jug B ...
<jseden>input = 2;</jseden>
</p>
<p>
Refer to Slide 8 for an explanation ...
<jseden>currentSlide = 8;</jseden>
</p>
");

slideList is [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12];

s13 is Slide("
<h3>Fix the overfill 'problem'</h3>
<p>
Currently have the definition:
<jseden>Bfull is capB == contentB;</jseden>
</p>
<p>
A more appropriate definition of 'Jug B is full':
<jseden>Bfull is (max(capB,contentB)==contentB);</jseden>
</p>
<p>
(Writing 'Bfull is capB &lt;= contentB;' would be much clearer, but there is
a bug in the way in which the presentation handles the '&lt;' between the jseden tags.) 
</p>
");

slideList is [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13];

s14 is Slide("
<h3>Postscript ...</h3>
<p>
And finally (handle with care)...
<jseden>currentSlide is contentB;</jseden>
</p>
");

slideList is [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14];


s15 is Slide("
<h3>Agency in the JUGS model</h3>
<p>
The JUGS model brings out the contrasts alluded to by SBR.
</p>
<p>
Moving beyond the functional perspective gives scope for personal exploratory interaction.
</p>
<p>
The model supports different kinds of human agency (e.g. pupil, teacher, developer, presenter).
More significantly, it supports these kinds of agency <i>concurrently</i> in one and the same environment.
</p>
<p>
It also supports automated agency. 
To see this, inspect the definition of the <code>pour</code> procedure via the <b>Procedures</b> panel on the left.
(You need to empty the search box in the O&A panel for this to work - a bug in emile.) 
<p>
You will see that <code>pour</code> acts like an agent that carries out automatically what the modeller might do manually.
For instance, when B is being filled the content of Jug B is incremented and the fullness of Jug B is checked repeatedly.
You can disclose this by intervening in the filling process by resetting <code>contentB</code> thus:
</p>
<p>
<jseden>contentB = 1;</jseden>
</p> 
");

s16 is Slide("
<h3>Visualising dependencies</h3>
<p>
It can be helpful to visualise the dependencies between observables.
A simple visualisation showing dependencies relating some of the key observables in the JUGS model
can be generated using the Dependency Modelling Tool developed by Allan Wong:
</p>
<p>
<img src=\"http://www2.warwick.ac.uk/fac/sci/dcs/research/em/jugsdep.gif\" height=260 width=500 > 
</p>
");

slideList is [s1, s2, s3, s4, s5, s6, s7, s8, s16, s15, s9, s10, s11, s12, s13, s14];

/*

target = 1;
capA = 5;
capB = 7;
contentA = 0;
Afull is capA == contentA ;
contentB = 1;
valid1 is !Afull;
but1 is Button("but1",menu[1], 50, base+30, valid1);

*/
