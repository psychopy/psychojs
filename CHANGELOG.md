# PsychoJS Change Log
All notable changes to the latest, unreleased version of the PsychoJS library and to the previously released versions are documented here.

Please note that released versions of the library are not set in stone: we will keep fixing important issues and adding minor features beyond the library release dates. Those changes will be documented in this document.

## 2020.2

### New Features

New stimuli:
- TextBox
- Form

We have upgraded the attribute management approach in order to handle both undefined and null values and to better deal with complex default values.


### Performance improvements
PixiJS objects are only re-created when necessary, and destroyed as soon as possible.
