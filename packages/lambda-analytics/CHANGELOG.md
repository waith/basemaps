# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.17.0](https://github.com/linz/basemaps/compare/v4.16.0...v4.17.0) (2020-11-03)

**Note:** Version bump only for package @basemaps/lambda-analytics





# [4.16.0](https://github.com/linz/basemaps/compare/v4.15.0...v4.16.0) (2020-10-12)

**Note:** Version bump only for package @basemaps/lambda-analytics





# [4.15.0](https://github.com/linz/basemaps/compare/v4.14.0...v4.15.0) (2020-09-29)


### Bug Fixes

* **lambda-analytics:** [@id](https://github.com/id) is reserved for the logging system ([#1207](https://github.com/linz/basemaps/issues/1207)) ([14a2f71](https://github.com/linz/basemaps/commit/14a2f716f39118258dff0290845a46de364cee84))


### Features

* **lambda-analytics:** allow analytics to be reprocessed by removing  the cached data ([#1195](https://github.com/linz/basemaps/issues/1195)) ([65752b9](https://github.com/linz/basemaps/commit/65752b99b99d84e6690ebcce26171a15c87a9ef5))
* **linzjs-s3fs:** .list is now a async generator to allow easier iterating of folders ([#1213](https://github.com/linz/basemaps/issues/1213)) ([a42c594](https://github.com/linz/basemaps/commit/a42c594a506914e340eabb2afd97991c2b119a64))





# [4.14.0](https://github.com/linz/basemaps/compare/v4.13.0...v4.14.0) (2020-09-17)


### Features

* **lambda-analytics:** generate rolledup analyitics from cloudwatchedge logs ([#1180](https://github.com/linz/basemaps/issues/1180)) ([20fd5b1](https://github.com/linz/basemaps/commit/20fd5b1983b16fc1fcb1b731152da36430fedc63))
* **lambda-analytics:** include referer information in the rollup stats ([#1186](https://github.com/linz/basemaps/issues/1186)) ([e75ab1a](https://github.com/linz/basemaps/commit/e75ab1acd5e4dc89f05a52df833bb3563502f324))
* **lambda-analytics:** process upto 7 days worth of logs in one invcocation ([#1187](https://github.com/linz/basemaps/issues/1187)) ([199678f](https://github.com/linz/basemaps/commit/199678fad413b4098c08c3268a0fb13283c0bfe1))
