# :star2: Welcome to DataFormsJS!

**Thanks for visiting!** 🌠👍

<table>
  <tbody>
    <tr>
      <td><strong>en - English</strong><br> This repository contains the main Website for DataFormsJS and not the DataFormsJS Framework or Web Components. DataFormsJS is used client side and linked from a CDN. If you have questions or need help please open an issue.</td>
    </tr>
    <tr>
      <td lang="es"><strong>es - Español</strong><br> Este repositorio contiene el sitio web principal de DataFormsJS y no el Marco de datos de DataFormsJS o los Componentes web. DataFormsJS se usa del lado del cliente y se vincula desde una CDN. Si tiene preguntas o necesita ayuda, abra un problema.</td>
    </tr>
    <tr>
      <td lang="pt-BR"><strong>pt-BR - Português (do Brasil)</strong><br> Este repositório contém o site principal do DataFormsJS e não o DataFormsJS Framework ou Web Components. DataFormsJS é usado no lado do cliente e vinculado a partir de uma CDN. Se você tiver dúvidas ou precisar de ajuda, abra um problema.</td>
    </tr>
    <tr>
      <td lang="ja"><strong>ja - 日本語</strong><br> このリポジトリには、DataFormsJSフレームワークまたはWebコンポーネントではなく、DataFormsJSのメインWebサイトが含まれます。 DataFormsJSはクライアント側で使用され、CDNからリンクされます。 ご質問がある場合やサポートが必要な場合は、問題を開いてください。</td>
    </tr>
    <!--
    <tr>
      <td>{iso}</td>
      <td>{lang}</td>
      <td>{content}</td>
    </tr>
    -->
  </tbody>
</table>

## :rocket: Getting Started

While the main DataFormsJS repository uses Node for server code, the main web site uses PHP with FastSitePHP so you need to have PHP installed in order to run it.

Getting started with PHP is extremely easy. If you do not have PHP installed then see instructions for Windows, Mac, and Linux on the getting started page:

<a href="https://www.fastsitephp.com/en/getting-started" target="_blank">https://www.fastsitephp.com/en/getting-started</a>

Once PHP is installed you can install FastSitePHP and launch the site from the command-line as show below. FastSitePHP is relatively small (~470 kb).

For the full site both [dataformsjs] and this [website] repository need to be downloaded and located in a single directory/folder:

~~~
dataformsjs {root-directory}
├── dataformsjs [repository]
└── website [repository]
~~~

~~~
cd {root-directory} # One directory above the [website] repository
php ./website/scripts/install.php
php -S localhost:3000 website/public/index.php
~~~

The main site SPA (excluding example pages) can be ran from this repository directly without downloading the dataformsjs repository:

~~~
cd {this-directory}
php ./scripts/install.php
php -S localhost:3000
~~~

Additionally GraphQL services run from Node with Express [app/app.js] and AI/ML Services run from Python with Flask [app/app.py]. For setup of those services refer to comments in each file.

For local setup of the GeoNames database used in the Places demo see comments in:

* scripts/geonames.py
* scripts/geonames.rb

## :handshake: Contributing and Translations

**All contributions are welcome.** Please see comments in the main DataFormsJS repository. 

## :question: FAQ

**Why was the main site developed with PHP instead of Node or another Language?**

Primarily because the author of DataFormsJS also created FastSitePHP. That said, FastSitePHP has similar goals to DataFormsJS - high performance, fast development, small size, strong security, and many features out of the box.

Additionally this project uses a number of languages (Python, JavaScript/Node, Ruby, Bash, and VBScript). Additional languages will likely be used in the future. Learning multiple languages is recommended as it will make you a better programmer.

The main site is actually a SPA that also includes web services. In the future the main site might be hosted from a CDN while data web services would be moved to a separate PHP server. This is a much more expensive option and only makes sense if the site receives high traffic so it will be decided later.

**What database is used?**

SQLite is used for the Places Demo App and the Entry Form Demo. The plan is to use SQLite as long as there are no issues with too many concurrent users. If needed a memory caching database (Memcached, Redis, etc.) would be used with the Places demos before moving to a larger database.

## :memo: License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

Artwork (SVG Files) located under [public/img] excluding [public/img/logos] is dual licensed under both **MIT License** and <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" style="font-weight:bold;">Creative Commons Attribution 4.0 International License</a>.
