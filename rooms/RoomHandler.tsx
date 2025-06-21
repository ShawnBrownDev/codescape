import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Intro from './Intro'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Timer, Trophy } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

type Puzzle = {
    id: number
    title: string
    description: string
    expected_output: string
    time_limit: number
    hint: string
    allows_loops: boolean
    difficulty: 'easy' | 'medium' | 'hard'
}

const XP_REWARDS = {
    easy: 50,
    medium: 100,
    hard: 200
}

function Rooms() {
    const [roomNumber, setRoomNumber] = useState<number>(1)
    const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
    const [userSolution, setUserSolution] = useState<string>("")
    const [message, setMessage] = useState<string>("")
    const [showHint, setShowHint] = useState<boolean>(false)
    const [timeLeft, setTimeLeft] = useState<number | null>(null)
    const { user } = useAuth()
    const { toast } = useToast()

    useEffect(() => {
        const fetchPuzzle = async () => {
            const { data, error } = await supabase
                .from("puzzles")
                .select("*")
                .eq('id', roomNumber)
                .single()

            if (error) {
                setMessage(`Error fetching puzzle: ${error.message}`)
            } else if (data) {
                setPuzzle(data)
                setTimeLeft(data.time_limit)
                
                // Extract the function name from the description
                const funcNameMatch = data.description.match(/function\s+(\w+)\s*\(/);
                const funcName = funcNameMatch ? funcNameMatch[1] : 'solution';
                
                // Extract test input from the description
                const testInputMatch = data.description.match(/result of \w+\(([^)]+)\)/);
                let testInput = testInputMatch ? testInputMatch[1] : '"coding"';
                
                // If the input looks like an array, keep it as is, otherwise make it a string literal
                if (!testInput.includes('[') && !testInput.includes('"')) {
                    testInput = `"${testInput.replace(/"/g, '')}"`;
                }
                
                // Provide a function template for the user with the correct test case in comment
                setUserSolution(
                    `function ${funcName}(input) {\n` +
                    `  // Write your solution here\n` +
                    `  // Should return ${data.expected_output} when input is ${testInput}\n` +
                    `}`
                );
                setShowHint(false)
            } else {
                setMessage("No puzzle found.")
            }
        }
        fetchPuzzle()
    }, [roomNumber])

    // Timer effect
    useEffect(() => {
        if (!timeLeft || timeLeft <= 0) return

        const timer = setInterval(() => {
            setTimeLeft(prev => prev ? prev - 1 : null)
        }, 1000)

        return () => clearInterval(timer)
    }, [timeLeft])

    async function awardXP(difficulty: 'easy' | 'medium' | 'hard') {
        if (!user) return

        try {
            // First, get current XP
            const { data: xpData, error: xpError } = await supabase
                .from('user_xp')
                .select('total_xp, current_level')
                .eq('user_id', user.id)
                .single()

            if (xpError) throw xpError

            const xpToAdd = XP_REWARDS[difficulty]
            const newTotalXP = (xpData?.total_xp || 0) + xpToAdd
            const newLevel = Math.floor(newTotalXP / 1000) + 1 // Level up every 1000 XP

            // Update XP and level using upsert with onConflict
            const { error: updateError } = await supabase
                .from('user_xp')
                .upsert({
                    user_id: user.id,
                    total_xp: newTotalXP,
                    current_level: newLevel,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id'
                })

            if (updateError) {
                console.error('Error updating XP:', updateError)
                throw updateError
            }

            // Show XP gain toast
            toast({
                title: `+${xpToAdd} XP`,
                description: `Congratulations on solving the puzzle!${newLevel > (xpData?.current_level || 1) ? ' Level Up!' : ''}`,
                variant: "default",
            })

        } catch (error) {
            console.error('Error awarding XP:', error)
            toast({
                title: "Error",
                description: "Failed to award XP. Please try again.",
                variant: "destructive",
            })
        }
    }

    const evaluateCode = async (code: string, expectedOutput: string) => {
        try {
            const fullCode = `
                ${code}
                ${expectedOutput}
            `;

            const result = await eval(fullCode);

            return result === expectedOutput;
        } catch (error) {
            console.error('Code evaluation error:', error);
            return false;
        }
    };

    async function handleSubmit() {
        if (!puzzle) {
            setMessage("Wait until the puzzle has loaded.")
            return
        }

        if (timeLeft && timeLeft <= 0) {
            setMessage("Time's up! Try again.")
            return
        }

        if (puzzle.allows_loops === false && /for|while|do/.test(userSolution)) {
            setMessage("Loops are not allowed in this puzzle!")
            return
        }

        const isCorrect = await evaluateCode(userSolution, puzzle.expected_output)
        if (isCorrect) {
            setMessage("Congratulations! You've solved the puzzle.")
            // Award XP before moving to next room
            await awardXP(puzzle.difficulty)
            // Wait a bit before moving to next room
            setTimeout(() => {
                setRoomNumber(roomNumber + 1)
                setMessage("") // Clear the message
                setShowHint(false) // Reset hint state
                setUserSolution("") // Clear the solution
            }, 2000)
        } else {
            setMessage("Solution is incorrect! Try again!")
        }
    }

    return (
        <div className="space-y-6 text-green-400">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">Room {roomNumber}</h2>
                {timeLeft !== null && (
                    <div className="flex items-center text-lg">
                        <Timer className="mr-2 h-5 w-5" />
                        {timeLeft}s
                    </div>
                )}
            </div>

            {puzzle ? (
                <div className="space-y-6">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-semibold">{puzzle.title}</h3>
                            <div className="flex items-center text-green-500/70">
                                <Trophy className="h-4 w-4 mr-1" />
                                {XP_REWARDS[puzzle.difficulty]} XP
                            </div>
                        </div>
                        <p className="text-green-500/70 mb-2">Difficulty: {puzzle.difficulty}</p>
                        <p className="text-green-400/90">{puzzle.description}</p>
                    </div>

                <div>
                        <Textarea
                            value={userSolution}
                            onChange={(e) => setUserSolution(e.target.value)}
                            className="font-mono h-48 bg-black/50 border-green-500/30 text-green-400 placeholder:text-green-500/50"
                        />
                    </div>

                    <div className="flex space-x-4">
                        <Button
                            onClick={handleSubmit}
                            disabled={!timeLeft || timeLeft <= 0}
                            className="bg-green-900/20 hover:bg-green-900/40 text-green-400 border-green-500/30"
                        >
                            Submit Solution
                        </Button>
                        <Button
                            onClick={() => setShowHint(!showHint)}
                            variant="outline"
                            className="border-green-500/30 text-green-400 hover:bg-green-900/20"
                        >
                            {showHint ? 'Hide Hint' : 'Show Hint'}
                        </Button>
                    </div>

                    {showHint && (
                        <Alert className="bg-green-900/20 border-green-500/30">
                            <AlertDescription className="text-green-400">
                                {puzzle.hint}
                            </AlertDescription>
                        </Alert>
                    )}

                    {message && (
                        <Alert className={message.includes("Congratulations") ? 
                            "bg-green-900/20 border-green-500/30" : 
                            "bg-red-900/20 border-red-500/30"
                        }>
                            <AlertDescription className={message.includes("Congratulations") ?
                                "text-green-400" :
                                "text-red-400"
                            }>
                                {message}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            ) : (
                <div className="text-center py-8">
                    <p className="text-xl text-green-500/70">Loading puzzle...</p>
                </div>
            )}
        </div>
    )
}

export default function RoomHandler() {
    const [hasStarted, setHasStarted] = useState(false)

    if (!hasStarted) {
        return <Intro onStart={() => setHasStarted(true)} />
    }

    return <Rooms />
}