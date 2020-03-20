# Zopfli Recompressor (node version)

## About

The nodejs version of my simple [zopfli-recompressor]() script:

A nodejs based script to recompress zip files in a given folder structure recursively using the [zopfli](https://github.com/google/zopfli) algorithm.
The script is capable of being interrupted at any point, resuming work at the current working position at a later time.

## Requirements

In order to work the script needs the following dependencies installed on your system:

* [advzip](http://www.advancemame.it/comp-readme), which is part of the [AdvanceCOMP](http://www.advancemame.it/comp-readme) collection of tools

## Usage

```text
```

## Why a nodejs version?

Eventhough I created a simple shell script to do the work for me first, the need arose, for someone else to run this on windows. Therefore I quickly threw together a nodejs version, which can be compiled into a single executable using [nexe](), to be easily run on windows. The feature set is essentially the same to the [shell script variant]().

## Reasoning / Limitations

The script was thrown to together quickly, as I needed some recompression work done. Don't hold me or anybody responsible, if it eats your socks, or pets your cat ;).
