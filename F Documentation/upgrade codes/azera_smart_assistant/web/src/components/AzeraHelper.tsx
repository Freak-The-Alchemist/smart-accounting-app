// web/src/components/AzeraHelper.tsx
import React, { useState } from 'react';
import knowledge from '../../assets/azera_knowledge.json';

export default function AzeraHelper() {
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const handleSelect = (e) => {
    const index = parseInt(e.target.value);
    setSelectedQuestion(knowledge.faq[index]);
  };

  return (
    <div style={{ background: '#eef', padding: 10, borderRadius: 8, marginTop: 20 }}>
      <strong>Ask Azera 💬</strong>
      <p>Select a question to get help:</p>
      <select onChange={handleSelect}>
        <option value="">Choose a question</option>
        {knowledge.faq.map((item, idx) => (
          <option key={idx} value={idx}>{item.q}</option>
        ))}
      </select>
      {selectedQuestion && (
        <div style={{ marginTop: 10 }}>
          <strong>Answer:</strong>
          <p>{selectedQuestion.a}</p>
        </div>
      )}
    </div>
  );
}