// File: components/PatientList.tsx
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface Patient {
  id: number;
  name: string;
  status?: string; // e.g. "New" or other flags
}

interface Props {
  patients: Patient[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export default function PatientList({ patients, selectedId, onSelect }: Props) {
  return (
    <ul className="divide-y">
      {patients.map(patient => (
        <li
          key={patient.id}
          onClick={() => onSelect(patient.id)}
          className={`px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center 
            ${patient.id === selectedId ? 'bg-gray-200 font-bold' : ''}`}
        >
          <span>{patient.name}</span>
          {/* Example status badge for new patients */}
          {patient.status === 'New' && (
            <Badge variant="outline" className="ml-auto bg-green-100 text-green-800">
              New
            </Badge>
          )}
        </li>
      ))}
    </ul>
  );
}
