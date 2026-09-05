# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A minimal, dependency-free Todo List web app: static `index.html` plus `script.js`. No build tools, package manager, or test framework are present.

## Running

Open `index.html` directly in a browser (or serve the directory with any static file server). There is no build/compile step.

## Architecture

- `index.html` — page structure/styles and the form/list DOM elements (`#todo-form`, `#todo-input`, `#todo-list`).
- `script.js` — all app logic: an in-memory `todos` array (not persisted), a `render()` function that rebuilds the `#todo-list` DOM from that array, and a submit handler that adds items. Each rendered `<li>` gets its own delete button wired via closures over the array index.

State is kept purely in memory (`todos` array in `script.js`); reloading the page clears all todos.
