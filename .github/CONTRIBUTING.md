# Contributing To MixrElixr
First off, thanks for taking the time to contribute! 

The following is a set of guidelines for contributing to Elixr. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

#### Table Of Contents
[Code of Conduct](#code-of-conduct)

[How Can I Contribute?](#how-can-i-contribute)
  * [Reporting Bugs](#reporting-bugs)
  * [Suggesting Enhancements](#suggesting-enhancements)
  * [Pull Requests](#pull-requests)
    * [Setting Up your Environment](#setting-up-your-environment)

## Code of Conduct

This project and everyone participating in it is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [mixrelixr@gmail.com](mailto:mixrelixr@gmail.com).

## How Can I Contribute?

### Reporting Bugs
This section guides you through submitting a bug report for Atom. Following these guidelines helps maintainers and the community understand your report :pencil:, reproduce the behavior :computer:, and find related reports :mag_right:.

Before creating bug reports, please check [this list]() as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible. Fill out [the required template](ISSUE_TEMPLATE.md), the information it asks for helps us resolve issues faster.

> **Note:** If you find a **Closed** issue that seems like it is the same thing that you're experiencing, open a new issue and include a link to the original issue in the body of your new one.
### Suggesting Enhancements

### Pull Requests

#### Setting Up your Environment
1. After cloning the repository, check out the `master` branch (the `dev` branch is currently on hold for refactoring).
2. Install all packages by running `npm install`.
3. Build the extension by running `npm run build:dev`. This will create a `/dist` folder containing the compiled extension. From here you will want to load the extension into your browser:
  1. Google Chrome: Head to chrome://extensions, enable Developer Mode if necessary, then click "Load Unpacked". Navigate to the `/dist` folder created earlier and select it. The addon will appear in your addons list.
  2. New Microsoft Edge: Largely the same as Google Chrome, but go to edge://extensions instead of chrome://extensions.
  3. Firefox: TO-DO
4. TODO when you make changes you probably have to rebuild?