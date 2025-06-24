'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import CodeEditor from '@/components/simulation/CodeEditor'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'

interface Puzzle {
  id: number
  title: string
  description: string
  difficulty: string
  initial_code: string
  test_cases: Array<{
    input: any[]
    expected: any
  }>
  hint?: string
  time_limit?: number
}

export default function PuzzlesPage() {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([])
  const [selectedPuzzle, setSelectedPuzzle] = useState<Puzzle | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchPuzzles = async () => {
      const { data, error } = await supabase
        .from('puzzles')
        .select('*')
        .order('id', { ascending: true })

      if (error) {
        console.error('Error fetching puzzles:', error)
        return
      }

      setPuzzles(data || [])
      if (data?.length > 0) {
        setSelectedPuzzle(data[0])
      }
    }

    fetchPuzzles()
  }, [])

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Coding Puzzles</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Available Puzzles</h2>
          {puzzles.map((puzzle) => (
            <Card
              key={puzzle.id}
              className={`p-4 cursor-pointer transition-colors ${
                selectedPuzzle?.id === puzzle.id
                  ? 'bg-primary/10'
                  : 'hover:bg-primary/5'
              }`}
              onClick={() => setSelectedPuzzle(puzzle)}
            >
              <h3 className="font-semibold">{puzzle.title}</h3>
              <div className="text-sm text-muted-foreground">
                Difficulty: {puzzle.difficulty}
              </div>
            </Card>
          ))}
        </div>

        <div className="md:col-span-2">
          {selectedPuzzle ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">{selectedPuzzle.title}</h2>
                <p className="text-muted-foreground mb-4">
                  {selectedPuzzle.description}
                </p>
                <div className="text-sm">
                  Difficulty:{' '}
                  <span
                    className={`font-semibold ${
                      selectedPuzzle.difficulty === 'easy'
                        ? 'text-green-500'
                        : selectedPuzzle.difficulty === 'medium'
                        ? 'text-yellow-500'
                        : 'text-red-500'
                    }`}
                  >
                    {selectedPuzzle.difficulty}
                  </span>
                </div>
              </div>

              <CodeEditor
                puzzleId={selectedPuzzle.id}
                initialCode={selectedPuzzle.initial_code}
                testCases={selectedPuzzle.test_cases}
                hint={selectedPuzzle.hint}
                timeLimit={selectedPuzzle.time_limit}
                onSolutionCorrect={() => {
                  toast({
                    title: "Correct Solution!",
                    description: "Great job! This is practice mode, so no XP is awarded.",
                    variant: "default",
                  });
                }}
              />
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              Select a puzzle to begin
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 