import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey)

async function updatePuzzleTemplate() {
  // Update the Sum Two Numbers puzzle (id: 1)
  const { error } = await supabase
    .from('puzzles')
    .update({
      initial_code: `function solution(input) {
  // Fill in the blank to return the sum of the two numbers in the input array
  return input[0] + _____ ;
}`,
      template_solution: `function solution(input) {
  // Complete solution that will be used to verify user's input
  return input[0] + input[1];
}`,
      description: "Write a function that takes an array of two numbers as input and returns their sum. Example: - Input: [1, 2] returns 3 - Input: [-1, 1] returns 0 - Input: [0, 0] returns 0",
      blanks: ['input[1]'], // The expected answer for the blank
      is_fill_in_blanks: true,
      hint: "Remember that array elements are accessed using square brackets and an index. The first number is at index 0, so the second number would be at index...?"
    })
    .eq('id', 1)

  if (error) {
    console.error('Error updating puzzle template:', error)
    return
  }
}

// Function to update multiple puzzles
async function updateAllPuzzles() {
  const puzzleTemplates = [
    {
      id: 1,
      title: "Sum Two Numbers",
      initial_code: `function solution(input) {
  // Fill in the blank to return the sum of the two numbers in the input array
  return input[0] + _____ ;
}`,
      template_solution: `function solution(input) {
  return input[0] + input[1];
}`,
      description: "Write a function that takes an array of two numbers as input and returns their sum. Example: - Input: [1, 2] returns 3 - Input: [-1, 1] returns 0 - Input: [0, 0] returns 0",
      blanks: JSON.stringify(['input[1]']),
      hint: "Remember that array elements are accessed using square brackets and an index. The first number is at index 0, so the second number would be at index...?"
    },
    {
      id: 5,
      title: "Even Numbers",
      initial_code: `function solution(input) {
  // Fill in the blank to return all even numbers from the input array
  return input[0].filter(num => _____ );
}`,
      template_solution: `function solution(input) {
  return input[0].filter(num => num % 2 === 0);
}`,
      description: "Write a function that returns an array of all even numbers from the input array. Example: - Input: [1, 2, 3, 4] returns [2, 4] - Input: [1, 3, 5] returns [] - Input: [2, 4, 6] returns [2, 4, 6]",
      blanks: JSON.stringify(['num % 2 === 0']),
      hint: "Use the modulo operator (%) to check if a number is even. A number is even if dividing by 2 gives no remainder."
    },
    // Add more puzzle templates here...
  ]

  for (const template of puzzleTemplates) {
    const { error } = await supabase
      .from('puzzles')
      .update({
        initial_code: template.initial_code,
        template_solution: template.template_solution,
        description: template.description,
        blanks: template.blanks,
        is_fill_in_blanks: true,
        hint: template.hint,
        title: template.title
      })
      .eq('id', template.id)

    if (error) {
      console.error(`Error updating puzzle ${template.id}:`, error)
    } else {
      console.log(`Successfully updated puzzle ${template.id}`)
    }
  }
}

// Run the update
updateAllPuzzles().catch(console.error) 