# PsychoJS

[![Automated Test (short)](https://github.com/psychopy/psychojs/actions/workflows/Automated%20Test%20(short).yml/badge.svg)](https://github.com/psychopy/psychojs/actions/workflows/Automated%20Test%20(short).yml)
[![Automated Test (full)](https://github.com/psychopy/psychojs/actions/workflows/Automated%20Test%20(full).yml/badge.svg)](https://github.com/psychopy/psychojs/actions/workflows/Automated%20Test%20(full).yml)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-v1.4%20adopted-ff69b4.svg)](code-of-conduct.md)

PsychoJS is a JavaScript library that makes it possible to run neuroscience, psychology, and psychophysics experiments in a browser. It is the online counterpart of the [PsychoPy](http://www.psychopy.org/) Python library. 

You can create online experiments from the [PsychoPy Builder](http://www.psychopy.org/builder/builder.html), you can find and adapt existing experiments on [pavlovia.org](https://www.pavlovia.org), or create them from scratch: the PsychoJS API is available [here](https://psychopy.github.io/psychojs/).

PsychoJS is an open-source project. You can contribute by submitting pull requests to the [PsychoJS GitHub repository](https://github.com/psychopy/psychojs), and discuss issues and current and future features on the [Online category of the PsychoPy Forum](https://discourse.psychopy.org/c/online).

## Motivation

Many studies in behavioural sciences (e.g., psychology, neuroscience, linguistics or mental health) use computers to present stimuli and record responses in a precise manner. These studies are still typically conducted on small numbers of people in laboratory environments equipped with dedicated hardware.

With high-speed broadband, improved web technologies and smart devices everywhere, studies can now go online without sacrificing too much temporal precision. This is a "game changer". Data can be collected on larger, more varied, international populations. We can study people in environments they do not find intimidating. Experiments can be run multiple times per day, without data collection becoming impractical.

The idea behind PsychoJS is to make PsychoPy experiments available online, from a web page, so participants can run them on any device equipped with a web browser such as desktops, laptops, or tablets. In some circumstance, they can even use their phone!


## Getting Started

Running PsychoPy experiments online requires the generation of an index.html file and of a javascript file that contains the code describing the experiment. Those files need to be hosted on a web server to which participants will point their browser in order to run the experiment. The server will also need to host the PsychoJS library.

### PsychoPy Builder
The recommended approach to creating experiments is to use [PsychoPy Builder](http://www.psychopy.org/builder/builder.html) to generate the javascript and html files. Many of the existing Builder experiments should "just work", subject to the [Components being compatible between PsychoPy and PsychoJS](https://www.psychopy.org/online/status.html).

### JavaScript Code
We built the PsychoJS library to make the JavaScript experiment files look and behave in very much the same way as to the Builder-generated Python files. PsychoJS offers classes such as `Window` and `ImageStim`, with very similar attributes to their Python equivalents. Experiment designers familiar with the PsychoPy library should feel at home with PsychoJS, and can expect the same level of control they have with PsychoPy, from the structure of the trials/loops all the way down to frame-by-frame updates.

There are however notable differences between the PsychoJS and PsychoPy libraries, most of which have to do with the way a web browser interprets and runs JavaScript, deals with resources (such as images, sound or videos), or render stimuli. To manage those web-specific aspect, PsychoJS introduces the concept of Scheduler. As the name indicate, Scheduler's offer a way to organise various PsychoJS along a timeline, such as downloading resources, running a loop, checking for keyboard input, saving experiment results, etc. As an illustration, a Flow in PsychoPy can be conceptualised as a Schedule, with various tasks on it. Some of those tasks, such as trial loops, can also schedule further events (i.e. the individual trials to be run).

Under the hood PsychoJS relies on [PixiJS](http://www.pixijs.com) to present stimuli and collect responses. PixiJS is a multi-platform, accelerated, 2D renderer, that runs in most modern browsers. It uses WebGL wherever possible and silently falls back to HTML5 canvas where not. WebGL directly addresses the graphic card, thereby considerably improving the rendering performance.


### Hosting Experiments
A convenient way to make experiment available to participants is to host them on [pavlovia.org](https://www.pavlovia.org), an open-science server. PsychoPy Builder offers the possibility of uploading the experiment directly to pavlovia.org.


## Which PsychoPy Components are supported by PsychoJS?
The list of PsychoPy Builder Components supported by PsychoJS see the [PsychoPy/JS online status page](https://www.psychopy.org/online/status.html)


## API
There is full documentation of the [PsychoJS API](https://psychopy.github.io/psychojs/).


## Maintainers

Alain Pitiot - [@apitiot](https://github.com/apitiot)


## Contributors

The PsychoJS library was initially written by [Ilixa](http://www.ilixa.com) with support from the [Wellcome Trust](https://wellcome.ac.uk).
It is now a collaborative effort, supported by the [Chan Zuckerberg Initiative](https://chanzuckerberg.com/) (2020-2021) and  [Open Science Tools](https://opensciencetools.org/) (2020-):
- Alain Pitiot - [@apitiot](https://github.com/apitiot)
- Sotiri Bakagiannis - [@thewhodidthis](https://github.com/thewhodidthis)
- Jonathan Peirce - [@peircej](https://github.com/peircej)
- Thomas Pronk - [@tpronk](https://github.com/tpronk)
- Hiroyuki Sogo - [@hsogo](https://github.com/hsogo)
- Sijia Zhao - [@sijiazhao](https://github.com/sijiazhao)

The PsychoPy Builder's javascript code generator is built and maintained by the creators of PsychoPy at the [University of Nottingham](https://www.nottingham.ac.uk), with support from the [Wellcome Trust](https://wellcome.ac.uk) (2017-2019), from the [Chan Zuckerberg Initiative](https://chanzuckerberg.com/) (2020-2021), and from [Open Science Tools](https://opensciencetools.org/) (2020-):

- Jonathan Peirce - [@peircej](https://github.com/peircej)
- David Bridges - [@dvbridges](https://github.com/dvbridges)
- Todd Parsons - [@TEParsons](https://github.com/TEParsons)


## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
