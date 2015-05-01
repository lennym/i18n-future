# i18n-future
i18n for node

A ground up rebuild of the [i18next](http://www.npmjs.com/package/i18next) project for a node environment.

The [i18next](http://www.npmjs.com/package/i18next) project has a number of issues that result from it being a port of an originally client-side project. In particular that it maintains a single global datastore, and so if two modules resolve to the same instance then they will interfere with each other.

The aim of this project is to create a module-safe, lightweight translation library for a node environment, based on similar concepts to i18next.