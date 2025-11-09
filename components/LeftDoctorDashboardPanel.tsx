import { useState } from "react";

interface Patient {
    id: number;
    name: string;
}

export default function LeftDoctorDashboardPanel({ patients, onSelectPatient }:
    {
        patients: Array<Patient>,
        onSelectPatient: (id: number) => void
    }) {
    const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
    function handleClick(id: number) {
        onSelectPatient(id);
        setSelectedPatientId(id);
    }
    return (
        <div className="w-full h-full scroll-auto mt-5 ml-5">
            <div className="flex items-center justify-between h-16">
                <div className="font-bold text-xl">My Patients</div>
                <button className="p-2 rounded-3xl bg-violet-500 text-white">+ Add New Patient</button>
            </div>
            <div>
                {patients.map(patient => {
                    return (
                        <div key={patient.id} onClick={handleClick.bind(null, patient.id)}
                            className={`flex flex-col justify-center w-full pl-3 h-16 hover:bg-violet-50 cursor-pointer transition`
                                + (selectedPatientId === patient.id ? ' bg-violet-100' : '')
                            }
                        >
                            <div className="text-[18px]">{patient.name}</div>
                            <div className="text-[15px] font-light">ID: {patient.id}</div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
