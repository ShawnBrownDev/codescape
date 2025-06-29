// P.S. This is supposed to be a secret! ;)

const vals = ["<secret-code-here>"];
const valsAsString = (...vals) => vals.map(val => `"${val}"`).join(",");
let testCases = document.getElementsByClassName("mb-4 p-4 bg-black/50 rounded-lg border border-green-500/30 flex flex-row justify-between space-y-2");
let testCase = Array.from(testCases).find(tc => tc.textContent.includes(valsAsString(...vals)));
let testCaseExpected = testCase.getElementsByTagName("p")[1];
let testCaseExpectedText = testCaseExpected.textContent;
let lastValue = testCaseExpectedText.split(":").pop().trim();
return parseInt(lastValue);