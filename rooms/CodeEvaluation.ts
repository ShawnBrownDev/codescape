
type CodeEvaluationResult = {
    isValid: boolean;
    message: string;
    testCases?: TestCase[];
}

type TestCase = {
    input: any;
    expected: any;
    result?: any;
}


// Worker code to run the test function in a separate thread
const codeTesterWorker = () => {
    return `
      self.onmessage = function (e) {
        const { code, input } = e.data;
        try {
          const testFunction = new Function('input', \`\${code}\`);
          const result = testFunction(input);
          self.postMessage({ result });
        } catch (err) {
          self.postMessage({ error: err.message });
        }
      };
    `;
};


async function runTestFunction({code, input, timeout = 10000}: {
  code: string;
  input: any;
  timeout?: number;
}): Promise<any> {
  const blob = new Blob([codeTesterWorker()], { type: 'application/javascript' });
  const worker = new Worker(URL.createObjectURL(blob));

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      worker.terminate();
      reject(new Error('Timeout or infinite loop detected.'));
    }, timeout);

    worker.onmessage = (e) => {
      clearTimeout(timeoutId);
      const { result, error } = e.data;
      if (error) reject(new Error('Code error: ' + error));
      else resolve(result);
    };

    worker.onerror = (e) => {
      clearTimeout(timeoutId);
      reject(new Error('Worker crashed: ' + e.message));
    };

    worker.postMessage({ code, input });
  });
}


async function evaluateCode(code: string, testCases: TestCase[]): Promise<CodeEvaluationResult> {
    if (!testCases?.length) return { isValid: false, message: "No test cases provided." };

    const bannedWords = ['eval', 'Function', 'import', 'require', 'console', 'window', 'document', 'XMLHttpRequest', 'fetch', 'supabase'];

    const functionNameMatch = code.match(/function\s+(\w+)/);
    if (!functionNameMatch) {
        return { isValid: false, message: "Could not find function name in code." };
    }
    const functionName = functionNameMatch[1];

    for (const word of bannedWords) {
        if (code.includes(word)) {
            return { isValid: false, message: `Usage of banned word detected: ${word}` };
        }
    }
    
    let executionError = '';
    const testFunctionString = `
        try {
            ${code}
            // If input is an array, spread it as arguments
            return Array.isArray(input) ? ${functionName}(...input) : ${functionName}(input);
        } catch (e) {
            console.error('Test execution error:', e);
            executionError = e.message;
            return 'Code error: ' + e.message;
        }
    `;

    const tested: TestCase[] = await Promise.all(testCases.map(async testCase => {
        try {
            const result = await runTestFunction({ code: testFunctionString, input: testCase.input });
            testCase.result = result;
        } catch (e: any) {
            executionError = e.message;
            testCase.result = `Error: ${e.message}`;
        }
        return testCase;
    }));

    if (executionError) return { isValid: false, message: `Test execution error: ${executionError}` };

    for (const testCase of tested) {
        const isEqual = JSON.stringify(testCase.result) === JSON.stringify(testCase.expected);

        if (!isEqual) {
            return {
                isValid: false,
                message: `Test failed for input ${JSON.stringify(testCase.input)}. Expected ${JSON.stringify(testCase.expected)}, but got ${JSON.stringify(testCase.result)}.`,
                testCases: tested
            };
        }
    }
    return { isValid: true, message: "All tests passed." };
}

export type { CodeEvaluationResult, TestCase };
export { evaluateCode };