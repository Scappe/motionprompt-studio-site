const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "prompt-checker.html"), "utf8");
const script = fs.readFileSync(path.join(root, "checker.js"), "utf8");
const url = "https://scappe.github.io/motionprompt-studio-site/prompt-checker.html?utm_source=prompt_guide&utm_medium=organic&utm_campaign=prompt_preflight_launch";
const dom = new JSDOM(html, { runScripts: "outside-only", url });

Object.defineProperty(dom.window, "innerWidth", { configurable: true, value: 390 });
let scrollCount = 0;
dom.window.HTMLElement.prototype.scrollIntoView = () => { scrollCount += 1; };
dom.window.eval(script);

const document = dom.window.document;
const input = document.querySelector("#prompt-input");
const score = document.querySelector("#score");
const feedback = document.querySelector("#checker-feedback");

document.querySelector("#analyze-button").click();
assert.equal(score.textContent, "0", "an empty prompt should keep a zero score");
assert.equal(feedback.hidden, false, "an empty prompt should show immediate feedback");
assert.match(feedback.textContent, /Paste a prompt first/);

input.value = "A cinematic, dynamic, beautiful, epic and realistic portrait.";
document.querySelector("#analyze-button").click();
assert.ok(Number(score.textContent) < 40, "an adjective-heavy prompt should score as high ambiguity");
assert.match(feedback.textContent, /Preflight complete/);
assert.ok(scrollCount >= 1, "mobile analysis should reveal the results");

document.querySelector("#example-button").click();
assert.equal(score.textContent, "100", "the complete example should pass all preflight checks");
assert.equal(document.querySelectorAll(".signal-list .is-present").length, 6, "all six signals should be present");
assert.match(feedback.textContent, /100\/100/);

document.querySelector("#clear-button").click();
assert.equal(score.textContent, "0", "clear should reset the score");
assert.equal(input.value, "", "clear should reset the prompt");
assert.equal(feedback.hidden, true, "clear should hide completion feedback");

console.log("Prompt checker tests passed for the live UTM route.");
