# 🌟 Welcome to DataFormsJS!

**Thanks for visiting!**

_If you are seeing this message then you are one of the earliest visitors!_ 🌠👍

This repository contains the main Website for DataFormsJS and not the DataFormsJS Framework or Web Components. DataFormsJS is used client side and linked from a CDN.

## 🚀 Getting Started

While the main DataFormsJS repository uses Node for server code, the main web site uses PHP with FastSitePHP so you need to have PHP installed in order to run it.

Getting started with PHP is extremely easy. If you do not have PHP installed then see instructions for Windows, Mac, and Linux on the getting started page:

<a href="https://www.fastsitephp.com/en/getting-started" target="_blank">https://www.fastsitephp.com/en/getting-started</a>

Once PHP is installed you can install FastSitePHP and launch the site from the command-line as show below. FastSitePHP is relatively small (under 1 mb).

Both [dataformsjs] and this [website] repository need to be downloaded and located in a single directory/folder:

dataformsjs {root-directory}
* dataformsjs [repository]
* website [repository]

~~~
cd {root-directory} # One directory above the [website] repository
php ./website/scripts/install.php
php -S localhost:3000 website/public/index.php
~~~

Additionally GraphQL services run from Node with Express [app/app.js] and AI/ML Services run from Python with Flask [app/app.py]. For setup of those services refer to comments in each file.

For local setup of the GeoNames database used in the Places demo see comments in:

* scripts/geonames.py
* scripts/geonames.rb

## 🤝 Contributing and Translations

**All contributions are welcome.** Please see comments in the main DataFormsJS repository. 

## :question: FAQ

**Why was this site developed with PHP instead of Node or another Language?**

Primarily because the author of DataFormsJS also created FastSitePHP. That said, FastSitePHP has similar goals to DataFormsJS - high performance, fast development, small size, strong security, and many features out of the box.

Additionally this project uses a number of languages (Python, JavaScript/Node, Ruby, Bash, and VBScript). Additional languages will likely be used in the future. Learning multiple languages is recommended as it will make you a better programmer.

The main site is actually a SPA that also includes web services. In the future the main site might be hosted from a CDN while data web services would be moved to a separate PHP server. This is a much more expensive option and only makes sense if the site receives high traffic so it will be decided later.

**What database is used?**

SQLite is used for the Places Demo App and the Entry Form Demo. The plan is to use SQLite as long as there are no issues with too many concurrent users. If needed a memory caching database (Memcached, Redis, etc.) would be used with the Places demos before moving to a larger database.

## :memo: License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

Artwork (SVG Files) located under [public/img] excluding [public/img/logos] is dual licensed under both **MIT License** and <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" style="font-weight:bold;">Creative Commons Attribution 4.0 International License</a>.
