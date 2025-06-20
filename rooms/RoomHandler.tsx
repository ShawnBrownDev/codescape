import Intro from "./Intro"
import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react"


type TestCase = {
    input: string
    expected: string
}

type Puzzle = {
    id: number
    title: string
    description: string
    initial_code: string
    solution: string
    test_cases: TestCase[]
    time_limit: number
    difficulty: 'easy' | 'medium' | 'hard'
}

function Rooms() {
    const [roomNumber, setRoomNumber] = useState<number>(1)
    const [roomData, setRoomData] = useState<Puzzle | null>(null)
    const [userSolution, setUserSolution] = useState<string>("");


    const [message, setMessage] = useState<string>("");

    useEffect(() => {
        const fetchRandomPuzzle = async () => {
            const { data, error } = await supabase
                .from("puzzles")
                .select("*")

            if (error) {
                setMessage(`Error fetching puzzles: ${error.message}`);
            } else if (data && data.length > 0) {
                const randomIndex = Math.floor(Math.random() * data.length);
                setRoomData(data[randomIndex]);
            } else {
                setMessage("No puzzles found.");
            }
        }
        fetchRandomPuzzle();
    }, [roomNumber]);

    function checkSolution(solution: string, testCases: TestCase[]): boolean {
        try {
            const func = new Function("input", solution);
            return testCases.every(test => {
                const result = func(test.input);
                return result === test.expected;
            });
        } catch (e) {
            setMessage(`Error evaluating solution: ${e}`);
            return false;
        }
    }

    function handleSubmit() {  // This should check the solution, and update the RoomNumber if correct
        if (!roomData) {
            setMessage("Wait until the room data has loaded.");
            return;
        }

        const isCorrect = checkSolution(userSolution, roomData.test_cases);
        if (isCorrect) {
            setMessage("Congratulations! You've solved the puzzle.");
            setRoomNumber(roomNumber + 1);
        } else {
            setMessage("Solution is incorrect! Try again!");
        }
    }

    return (
        <div className="relative min-h-screen overflow-hidden">
            <h2 className="text-3xl font-bold mb-4">Room {roomNumber}</h2>
            <p className="text-lg mb-4">Solve the puzzle to escape!</p>
            <div>{!roomData ? "Loading..." : (
                <div>
                    <h3>{roomData.title}</h3>
                    <p className="text-gray-500 mb-2">Difficulty: {roomData.difficulty}</p>
                    <p>{roomData.description}</p>
                    <textarea name="code" id="codebox" onChange={(e) => setUserSolution(e.target.value)}>
                        {roomData.initial_code}
                    </textarea>
                    <button onClick={handleSubmit}>Submit</button>
                </div>
            )}</div>
            <div className="messages">{message}</div>
        </div>
    )
}

export default function RoomHandler() {
  return (
    <div>
      <Intro />
      <Rooms />
    </div>
  )
}