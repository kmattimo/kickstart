---
layout: article-layout
title: Kickstart | Home
---

# Welcome
Kickstart is a website starter kit, living style guide creator, and task runner that helps you kickstart a website build and create a living style guide that grows with your site.

At a high level, [Kickstart](http://onenorth.io/kickstart "Kickstart project website") provides the following:

* Development and Production build tasks
* Core pattern library structure and starter files
* Living style guide generator
* Site template generator

## Features
* Command Line Interface
* Scaffold new projects or work with existing projects
* Easy templating with Handlebars and a large collection of Handlebars helpers
* Optionally create content pages using Markdown
* Sass compilation, optimization and minification
* JavaScript bundling with Browserify, minification
* JavaScript and CSS linting
* Image optimization
* SVG spriting and optimization
* Static file serving and device synchronization with BrowserSync

## Setup

{{#draft}}
### Yeoman
The best way to install Kickstart is by using the Yeoman generator.
```bash
yo kickstart
```
{{/draft}}

### Forking
The best way to start your project with Kickstart is by forking the Kickstart project into your own repo. Doing so will prevent you from having to change the repo origin URL so that you can push your changes to your own repository.

### Clone repository
You can also install Kickstart by cloning the Kickstart repository to a local folder on your machine. After cloning the repository, you'll need to update the remote repo URL since you will not want or be able to push your chagnes to the source Kickstart repository.

> If you clone the kickstart repo, make sure you change the remote origin URL before you attempt to push any of your customizations.

Whether you fork or clone the repository, here are the steps you need to perform the first time you bring the repo down locally:

#### 1. git clone kickstart
  ```bash
  git clone https://github.com/onenorth/kickstart ~/projects/my-kickstart-project
  ```
  then

  ```bash
  cd ~/projects/my-kickstart-project
  ```
#### 2. Start the project
  ```bash
  npm start
  ```

Running `npm start` will install all required package dependencies, then spin up a local web server, and start watching your files for changes.

> Running `npm start` will first run `npm install` so that all the required package dependencies are installed before anything else happens.

## Building
When you are only interested in building your project (e.g., compiling templates, SCSS files, etc), but do not want to start a development web server, you can simply run `npm run build` to build the projects files without starting web server.

```bash
npm run build
```

### Production Builds
If you want to build a minified and optimized version of your project, you can do so by passing in the `--production` flag when you run `npm run build`:

```bash
npm run build --production
```
