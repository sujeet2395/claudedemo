# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A minimal, dependency-free AI Math Teacher/Examiner web app: static `index.html` plus `script.js`. No build tools, package manager, or test framework are present.

## Running

Open `index.html` directly in a browser (or serve the directory with any static file server). There is no build/compile step.

## Architecture

- `index.html` — page structure/styles and the DOM elements for the Teacher (`#generate-btn`, `#question-display`) and Examiner (`#answer-form`, `#answer-input`, `#feedback`) sections.
- `script.js` — all app logic: `generateQuestion()` picks two random integers and an operator (`+`, `-`, `*`), computes the correct answer, and stores it as `currentQuestion`; the Generate button click handler calls it to display a new equation; the answer form's submit handler compares the student's input to `currentQuestion.correctAnswer` and renders correct/incorrect feedback.

There is no real AI/LLM call — "Teacher" and "Examiner" are just labeled UI sections backed by plain client-side JS logic. State is kept purely in memory (`currentQuestion` in `script.js`); reloading the page or generating a new question discards the previous one (no history).
