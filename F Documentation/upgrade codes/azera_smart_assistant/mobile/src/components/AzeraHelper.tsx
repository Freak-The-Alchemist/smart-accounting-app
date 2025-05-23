// mobile/src/components/AzeraHelper.tsx
import React, { useState } from 'react';
import { View, Text, Picker } from 'react-native';

const knowledge = {
  faq: [
    {
      q: "How do I know my journal is balanced?",
      a: "The total of all debit entries must equal the total of all credit entries."
    },
    {
      q: "What is a trial balance?",
      a: "A trial balance ensures your books are correct before preparing financial statements."
    },
    {
      q: "Can I export my reports?",
      a: "Yes! Use the 'Download Excel' or 'Download PDF' button to export your journal."
    }
  ]
};

export default function AzeraHelper() {
  const [selected, setSelected] = useState();

  return (
    <View style={{ marginTop: 20, backgroundColor: '#eef', padding: 10, borderRadius: 10 }}>
      <Text style={{ fontWeight: 'bold' }}>Ask Azera 💬</Text>
      <Text>Select a question:</Text>
      <Picker selectedValue={selected} onValueChange={(val, i) => setSelected(val)}>
        <Picker.Item label="Choose a question" value={null} />
        {knowledge.faq.map((item, i) => (
          <Picker.Item key={i} label={item.q} value={item.a} />
        ))}
      </Picker>
      {selected && (
        <View style={{ marginTop: 10 }}>
          <Text><Text style={{ fontWeight: 'bold' }}>Answer:</Text> {selected}</Text>
        </View>
      )}
    </View>
  );
}