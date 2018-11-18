# PsychoJs

PsychoJs is a javascript library that makes it possible to run neuroscience, psychology, and psychophysics experiments in a browser. It is the online counterpart of the [PsychoPy](http://www.psychopy.org/) Python library.
It is also a git submodule: [psychopy/psychojs](https://github.com/psychopy/psychojs)


## Motivation

Many studies in behavioural sciences (e.g. psychology, neuroscience, linguistics or mental health) use computers to present stimuli and record responses in a precise manner. These studies are still typically conducted on small numbers of people in laboratory environments equipped with dedicated hardware.

With high-speed broadband, improved web technologies and smart devices everywhere, studies can now go online without sacrificing too much temporal precision. This is a “game changer”. Data can be collected on larger, more varied, international populations. We can study people in environments they do not find intimidating. Experiments can be run multiple times per day, without data collection becoming impractical.

The idea behind PsychoJs is to make PsychoPy experiments available online, from a web page, so participants can run them on any device equipped with a web browser such as desktops, laptops, or tablets. In some circumstance, they can even use their phone!


## Getting Started

Running PsychoPy experiments online requires the generation of an index.html file and of a javascript file, which contains the code describing the experiment. Those files need to be hosted on a web server to which participants will point their browser in order to run the experiment. The server will also need to host the PsychoJs library, and various additional vendor libraries, such as those we use to display stimuli (PixiJs) or play sounds (HowlerJs).

### PsychoPy Builder
Starting with PsychoPy version 3.0, [PsychoPy Builder](http://www.psychopy.org/builder/builder.html) can automatically generate the javascript and html files. Many of the existing Builder experiments should "just work", subject to the Components being currently supported by PsychoJs (see below).

### JavaScript Code
We built the PsychoJs library to make the javascript experiment files look and behave in very much the same way as to the Builder-generated Python files. PsychoJs offers classes such as `Window` and `ImageStim`, with very similar attributes to their Python equivalents. Experiment designers familiar with the PsychoPy library should feel at home with PsychoJs, and can expect the same level of control they have with PsychoPy, from the the structure of the trials/loops all the way down to frame-by-frame updates.

There are however notable differences between the the PsychoJs and PsychoPy libraries, most of which have to do with the way a web browser interprets and runs javascripts, deals with resources (such as images, sound or videos), or render stimuli. To manage those web-specific aspect, PsychoJs introduces  the concept of Scheduler. As their name indicate, Scheduler's offer a way to organise various tasks along a timeline, such as downloading resources, running a loop, checking for keyboard input, saving experiment results, etc. As an illustration, a Flow in PsychoPy can be conceptualised as a Schedule, with various tasks on it. Some of those tasks, such as trial loops, can also schedule further events (i.e. the individual trials to be run).

Under the hood PsychoJs relies on [PixiJs](http://www.pixijs.com) to present stimuli and collect responses. PixiJs is a multi-platform, accelerated, 2-D renderer, that runs in most modern browsers. It uses WebGL wherever possible and silently falls back to HTML5 canvas where not. WebGL directly addresses the graphic card, thereby considering improving the rendering performance.


### Hosting Experiments
A convenient way to make experiment available to participants is to host them on [pavlovia.org](https://www.pavlovia.org), an open-science server under active development. PsychoPy Builder offers the possibility of uploading the experiment directly to pavlovia.org.


## Which PsychoPy Components are supported by PsychoJs?
PsychoJs currently supports the following Components:

### Stimuli:
* ImageStim
* TextStim
* BaseShapeStim (Polygon)
* Rect
* Sound (tones and tracks)

### Events:
* Mouse
* Keyboard

We are constantly adding new Components and are regularly updating this list.

## Authors

The PsychoJs library is written and maintained by Ilixa Ltd. (http://www.ilixa.com). The PsychoPy Builder's javascript code generator is built and maintained by the creators of PsychoPy at the University of Nottingham (https://www.nottingham.ac.uk). Both efforts are generously supported by the Wellcome Trust (https://wellcome.ac.uk).


## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
