'use client'

import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase'
import { AlertCircle, CheckCircle2, Timer, PlayCircle, Trophy, HelpCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface CodeEditorProps {
  puzzleId: number
  initialCode: string
  testCases: Array<{
    input: any[]
    expected: any
  }>
  timeLimit?: number
  hint?: string
  onSolutionCorrect: (isCorrect: boolean) => void
  isFillInBlanks?: boolean
  templateSolution?: string
  blanks?: string[]
}

interface TestResult {
  input: any[]
  expected: any
  actual?: any
  error?: string
  passed: boolean
}

interface ExecutionResults {
  results?: TestResult[]
  error?: string
  allPassed?: boolean
}

// Add this helper function before the CodeEditor component
function arraysEqual(arr1: any[], arr2: any[]): boolean {
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
  if (arr1.length !== arr2.length) return false;
  return arr1.every((val, idx) => {
    if (Array.isArray(val) && Array.isArray(arr2[idx])) {
      return arraysEqual(val, arr2[idx]);
    }
    return val === arr2[idx];
  });
}

// Wrapper component to ensure fresh editor instance
function EditorWrapper({ initialCode, onChange }: { initialCode: string, onChange: (value: string) => void }) {
  // Force the editor to use the initial code when mounted
  useEffect(() => {
    onChange(initialCode)
  }, [initialCode, onChange])

  return (
    <Editor
      height="400px"
      defaultLanguage="javascript"
      value={initialCode}
      onChange={(value) => onChange(value || "")}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        readOnly: false,
        theme: 'vs-dark'
      }}
      loading={<div className="h-[400px] flex items-center justify-center">Loading editor...</div>}
    />
  )
}

export default function CodeEditor({ puzzleId, initialCode, testCases, timeLimit = 300, hint, onSolutionCorrect, isFillInBlanks, templateSolution, blanks }: CodeEditorProps) {
  const [code, setCode] = useState(initialCode)
  const [results, setResults] = useState<ExecutionResults | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const [showHint, setShowHint] = useState(false)
  const [isTestRun, setIsTestRun] = useState(false)
  const [mountKey, setMountKey] = useState(0)
  const supabase = createClient()

  // Reset state when puzzle changes
  useEffect(() => {
    setCode(initialCode)
    setResults(null)
    setIsRunning(false)
    setAttempts(0)
    setTimeLeft(timeLimit)
    setShowHint(false)
    setIsTestRun(false)
    setMountKey(prev => prev + 1)

    // Clear any stored code in Monaco
    window.monaco?.editor.getModels().forEach(model => {
      model.dispose()
    })
  }, [puzzleId, initialCode, timeLimit])

  // Timer effect
  useEffect(() => {
    if (!timeLeft || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const evaluateCode = (code: string, testCases: CodeEditorProps['testCases']): TestResult[] => {
    try {
      // For fill-in-the-blanks, first validate that all blanks are filled
      if (isFillInBlanks && blanks) {
        const missingBlanks = code.includes('_____');
        if (missingBlanks) {
          throw new Error('Please fill in all the blanks before submitting.');
        }

        // Compare with template solution
        if (templateSolution) {
          const userBlanks = code.match(/filter\(num => (.*?)\)/)?.[1]?.trim();
          if (!userBlanks || !blanks.includes(userBlanks)) {
            throw new Error('Your solution doesn\'t match the expected pattern. Try again!');
          }
        }
      }

      // Extract function name from the code
      const funcMatch = code.match(/function\s+(\w+)\s*\(/);
      if (!funcMatch) {
        throw new Error('Could not find function definition');
      }
      const functionName = funcMatch[1];

      // Create a safe evaluation environment
      const safeEval = new Function('code', `
        try {
          ${code}
          return ${functionName};
        } catch (e) {
          throw e;
        }
      `);

      // Get the function
      const userFunction = safeEval(code);

      // Run test cases
      return testCases.map(test => {
        try {
          const result = userFunction(test.input[0]);
          const passed = Array.isArray(result) && Array.isArray(test.expected) ?
            arraysEqual(result, test.expected) :
            result === test.expected;

          return {
            input: test.input[0],
            expected: test.expected,
            actual: result,
            passed: passed
          };
        } catch (e) {
          return {
            input: test.input[0],
            expected: test.expected,
            error: e instanceof Error ? e.message : String(e),
            passed: false
          };
        }
      });
    } catch (error) {
      return testCases.map(test => ({
        input: test.input[0],
        expected: test.expected,
        error: error instanceof Error ? error.message : String(error),
        passed: false
      }));
    }
  };

  const handleRunCode = async (isTest: boolean = false) => {
    setIsRunning(true)
    setResults(null)
    if (!isTest) setAttempts(prev => prev + 1)
    setIsTestRun(isTest)

    try {
      const testResults = evaluateCode(code, testCases);
      const allPassed = testResults.every(r => r.passed);
      setResults({ results: testResults, allPassed });

      if (allPassed && !isTest && onSolutionCorrect) {
        onSolutionCorrect(true);
      }
    } catch (error) {
      console.error('Code execution error:', error);
      setResults({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      });
      onSolutionCorrect(false);
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-green-400">
            <Trophy className="w-5 h-5" />
            <span>50 XP</span>
          </div>
        </div>
        {hint && (
          <Button
            variant="outline"
            className="text-green-400 border-green-400/30 hover:bg-green-400/10"
            onClick={() => setShowHint(!showHint)}
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            {showHint ? 'Hide Hint' : 'Show Hint'}
          </Button>
        )}
      </div>

      {showHint && hint && (
        <Alert className="bg-green-950/20 border-green-400/30">
          <HelpCircle className="w-4 h-4 text-green-400" />
          <AlertDescription className="text-green-400">
            {hint}
          </AlertDescription>
        </Alert>
      )}

      <div className="relative">
        <div key={`editor-${puzzleId}-${mountKey}`}>
          <EditorWrapper
            initialCode={initialCode}
            onChange={setCode}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => handleRunCode(true)}
          disabled={isRunning}
          variant="outline"
          className="gap-2"
        >
          <PlayCircle className="w-4 h-4" />
          Test Run
        </Button>
        <Button
          onClick={() => handleRunCode(false)}
          disabled={isRunning}
          className="gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          Submit Solution
        </Button>
      </div>

      {results && (
        <div className="space-y-4 mt-4">
          {results.error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {results.error}
              </AlertDescription>
            </Alert>
          ) : (
            results.results?.map((result, index) => (
              <Alert
                key={index}
                variant={result.passed ? "default" : "destructive"}
                className={result.passed ? "bg-green-950/20 border-green-400/30" : undefined}
              >
                <div className="flex items-start gap-4">
                  {result.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-400 mt-1" />
                  ) : (
                    <AlertCircle className="h-4 w-4 mt-1" />
                  )}
                  <div className="flex-1">
                    <div className="font-mono text-sm">
                      Input: {JSON.stringify(result.input)}
                      <br />
                      Expected: {result.expected}
                      <br />
                      Got: {result.error ? result.error : result.actual}
                    </div>
                  </div>
                </div>
              </Alert>
            ))
          )}
        </div>
      )}
    </div>
  )
} 