'use client';

import { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/db/firebase';
import ChallengeGoalInput from './ChallengeGoalInput';
import { ChallengeGoalInputData } from '@/lib/types/Challenge';

export default function AddChallengePage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [bonus, setBonus] = useState('');
  const [goals, setGoals] = useState<ChallengeGoalInputData[]>([]);

  function handleAddGoal() {
    setGoals((prev) => [...prev, { id: crypto.randomUUID(), description: '' }]);
  }

  function handleGoalChange(id: string, updated: ChallengeGoalInputData) {
    setGoals((prev) => prev.map((goal) => (goal.id === id ? updated : goal)));
  }

  function resetForm() {
    setName('');
    setDescription('');
    setBonus('');
    setGoals([]);
  }

  async function handleSubmit() {
    if (!name || !description || goals.length === 0) {
      alert('Need to input name, description and at least one goal');
      return;
    }

    const challenge = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      description,
      goals,
      ...(bonus ? { bonus } : {}),
    };

    await addDoc(collection(db, 'challenges'), challenge);
    alert('Challenge created!');
    resetForm();
  }

  return (
    <div className="p-6 max-w-3xl my-6 mx-auto space-y-6 flex flex-col bg-gray-100 rounded-lg shadow text-black">
      <h1 className="text-2xl font-bold">Add Challenge</h1>

      <input
        className="px-3 py-2 border rounded bg-white placeholder-gray-400"
        placeholder="Challenge name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <textarea
        className="px-3 py-2 border rounded bg-white placeholder-gray-400"
        placeholder="Challenge description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      
      <textarea
        className="px-3 py-2 border rounded bg-white placeholder-gray-400"
        placeholder="Challenge bonus (optional)"
        value={bonus}
        onChange={(e) => setBonus(e.target.value)}
      />

      <div className="space-y-4">
        {goals.map((goal) => (
          <ChallengeGoalInput
            key={goal.id}
            data={goal}
            onChange={(updated) => handleGoalChange(goal.id, updated)}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-4 pt-4">
        <button className="btn" onClick={handleAddGoal} style={{ backgroundColor: 'var(--color-accent)', color: 'white', padding: '8px 16px', borderRadius: '4px' }}>
          ➕ Add Goal
        </button>

        <button className="btn btn-primary" onClick={handleSubmit} style={{ backgroundColor: 'var(--color-primary)', color: 'white', padding: '8px 16px', borderRadius: '4px' }}>
          💾 Save Challenge
        </button>
      </div>
    </div>
  );
}
