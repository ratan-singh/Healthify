'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Patient {
  id: string;
  name: string;
}

interface Vital {
  heartRate: number;
  bloodPressure: string;
  timestamp: number;
}

interface Diagnosis {
  doctorId: string;
  notes: string;
  prescription: string;
  timestamp: number;
}

interface PatientData {
  vitals: Vital[];
  diagnoses: Diagnosis[];
}

export default function DoctorDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [newDiagnosis, setNewDiagnosis] = useState({ notes: '', prescription: '' });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchedPatient, setSearchedPatient] = useState<{ id: string; name: string; role: string } | null>(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = new URLSearchParams(window.location.search).get('userId');
      setDoctorId(id);
    }
  }, []);

  useEffect(() => {
    if (!doctorId) return;

    const fetchPatients = async () => {
      try {
        const res = await fetch(`/api/doctor/${doctorId}/patients`);
        const data = await res.json();
        setPatients(data);
        if (data.length > 0) {
          setSelectedPatient(data[0]);
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [doctorId]);

  useEffect(() => {
    if (!selectedPatient) return;

    const fetchPatientData = async () => {
      try {
        const [vitalsRes, diagnosisRes] = await Promise.all([
          fetch(`/api/patient/${selectedPatient.id}/vitals`),
          fetch(`/api/patient/${selectedPatient.id}/diagnosis`),
        ]);

        const vitals = await vitalsRes.json();
        const diagnoses = await diagnosisRes.json();

        setPatientData({ vitals, diagnoses });
      } catch (error) {
        console.error('Error fetching patient data:', error);
      }
    };

    fetchPatientData();
  }, [selectedPatient]);

  const handleAddDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !doctorId) return;

    try {
      await fetch(`/api/patient/${selectedPatient.id}/diagnosis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId,
          notes: newDiagnosis.notes,
          prescription: newDiagnosis.prescription,
        }),
      });

      // Refresh patient data
      const res = await fetch(`/api/patient/${selectedPatient.id}/diagnosis`);
      const diagnoses = await res.json();
      setPatientData((prev) => (prev ? { ...prev, diagnoses } : null));
      setNewDiagnosis({ notes: '', prescription: '' });
    } catch (error) {
      console.error('Error adding diagnosis:', error);
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  const searchPatientById = async (id: string) => {
    if (!id.trim()) {
      setSearchError('Please enter a patient ID');
      return;
    }

    setSearchLoading(true);
    setSearchError('');
    setSearchedPatient(null);
    setRequestSuccess(false);

    try {
      const res = await fetch(`/api/patient/search?id=${encodeURIComponent(id.trim())}`);
      const data = await res.json();

      if (res.ok && data.success) {
        // Check if patient is already in doctor's patient list
        const patientInList = patients.find(p => p.id === data.patient.id);
        
        if (patientInList) {
          setSelectedPatient(patientInList);
          setSearchQuery(''); // Clear search
          setSidebarOpen(false); // Close sidebar on mobile
          setSearchError('');
        } else {
          // Show the searched patient details for sending request
          setSearchedPatient(data.patient);
          setSearchError('');
        }
      } else {
        setSearchError(data.error || 'Patient not found');
      }
    } catch (error) {
      console.error('Error searching patient:', error);
      setSearchError('Error searching for patient');
    } finally {
      setSearchLoading(false);
    }
  };

  const sendAccessRequest = async (patientId: string) => {
    if (!doctorId) return;

    setRequestLoading(true);
    try {
      const res = await fetch(`/api/patient/${patientId}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId }),
      });

      if (res.ok) {
        setRequestSuccess(true);
        setTimeout(() => {
          setSearchedPatient(null);
          setSearchQuery('');
          setRequestSuccess(false);
        }, 3000);
      } else {
        setSearchError('Failed to send access request');
      }
    } catch (error) {
      console.error('Error sending access request:', error);
      setSearchError('Error sending access request');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      searchPatientById(searchQuery);
    }
  };

  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden mr-2 text-gray-600 dark:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">H</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">Healthify</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="hidden sm:inline-flex">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
                Doctor
              </Badge>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar - Patient List */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out overflow-y-auto`}
          style={{ top: '64px' }}
        >
          <div className="p-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                My Patients ({patients.length})
              </h2>
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSearchError('');
                    }}
                    onKeyPress={handleSearchKeyPress}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <svg
                    className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <button
                  onClick={() => searchPatientById(searchQuery)}
                  disabled={searchLoading}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                >
                  {searchLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Searching...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Search Patient
                    </>
                  )}
                </button>
                {searchError && (
                  <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
                    {searchError}
                  </div>
                )}
                {searchedPatient && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {searchedPatient.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{searchedPatient.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">ID: {searchedPatient.id}</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                        Patient
                      </Badge>
                    </div>
                    
                    {requestSuccess ? (
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Access request sent successfully!
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-gray-700 dark:text-gray-300">
                          This patient is not in your list yet. Send an access request to view their records.
                        </p>
                        <button
                          onClick={() => sendAccessRequest(searchedPatient.id)}
                          disabled={requestLoading}
                          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                        >
                          {requestLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Sending Request...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Send Access Request
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {filteredPatients.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                  {searchQuery ? 'No patients found' : 'No patients'}
                </p>
              ) : (
                filteredPatients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => {
                      setSelectedPatient(patient);
                      setSidebarOpen(false);
                    }}
                    className={`w-full text-left p-4 rounded-lg transition-colors ${
                      selectedPatient?.id === patient.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-600'
                        : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                          selectedPatient?.id === patient.id ? 'bg-blue-600' : 'bg-gray-400'
                        }`}
                      >
                        {patient.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium truncate ${
                            selectedPatient?.id === patient.id
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {patient.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">ID: {patient.id}</p>
                      </div>
                      {selectedPatient?.id === patient.id && (
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <button
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
            style={{ top: '64px' }}
            onClick={() => setSidebarOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setSidebarOpen(false);
            }}
            aria-label="Close sidebar"
            type="button"
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {!selectedPatient ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p className="text-gray-600 dark:text-gray-400">Select a patient to view details</p>
            </div>
          ) : (
            <>
              {/* Patient Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {selectedPatient.name.charAt(0)}
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {selectedPatient.name}
                      </h1>
                      <p className="text-gray-600 dark:text-gray-400">Patient ID: {selectedPatient.id}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Active Patient
                  </Badge>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Vitals</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {patientData?.vitals.length || 0}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Latest Heart Rate</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {patientData?.vitals.at(-1)?.heartRate || '--'} <span className="text-sm">bpm</span>
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Blood Pressure</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {patientData?.vitals.at(-1)?.bloodPressure || '--'}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          />
                        </svg>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="vitals">Vitals History</TabsTrigger>
                  <TabsTrigger value="diagnosis">Diagnosis & Treatment</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Recent Vitals
                      </h3>
                      {patientData?.vitals.length ? (
                        <div className="space-y-3">
                          {patientData.vitals.slice(-3).reverse().map((vital) => (
                            <div
                              key={vital.timestamp}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  HR: {vital.heartRate} bpm | BP: {vital.bloodPressure}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {new Date(vital.timestamp).toLocaleString()}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  vital.heartRate >= 60 && vital.heartRate <= 100 ? 'default' : 'destructive'
                                }
                              >
                                {vital.heartRate >= 60 && vital.heartRate <= 100 ? 'Normal' : 'Abnormal'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">No vitals recorded</p>
                      )}
                    </Card>

                    <Card className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Recent Diagnoses
                      </h3>
                      {patientData?.diagnoses.length ? (
                        <div className="space-y-3">
                          {patientData.diagnoses.slice(-3).reverse().map((diagnosis) => (
                            <div
                              key={diagnosis.timestamp}
                              className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                            >
                              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                {diagnosis.notes}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                Prescription: {diagnosis.prescription}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                {new Date(diagnosis.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">No diagnoses recorded</p>
                      )}
                    </Card>
                  </div>
                </TabsContent>

                {/* Vitals History Tab */}
                <TabsContent value="vitals" className="space-y-6">
                  <Card className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Complete Vitals History
                    </h2>
                    {patientData?.vitals.length ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Date & Time
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Heart Rate
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Blood Pressure
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {patientData.vitals.slice().reverse().map((vital) => (
                              <tr key={vital.timestamp}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                  {new Date(vital.timestamp).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                      <path
                                        fillRule="evenodd"
                                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                      {vital.heartRate} bpm
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                  {vital.bloodPressure} mmHg
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Badge
                                    variant={
                                      vital.heartRate >= 60 && vital.heartRate <= 100 ? 'default' : 'destructive'
                                    }
                                  >
                                    {vital.heartRate >= 60 && vital.heartRate <= 100 ? 'Normal' : 'Needs Attention'}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg
                          className="w-16 h-16 text-gray-400 mx-auto mb-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                        <p className="text-gray-600 dark:text-gray-400">No vitals recorded yet</p>
                      </div>
                    )}
                  </Card>
                </TabsContent>

                {/* Diagnosis Tab */}
                <TabsContent value="diagnosis" className="space-y-6">
                  {/* Add New Diagnosis Form */}
                  <Card className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Add New Diagnosis
                    </h2>
                    <form onSubmit={handleAddDiagnosis} className="space-y-4">
                      <div>
                        <label htmlFor="diagnosisNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Diagnosis Notes
                        </label>
                        <textarea
                          id="diagnosisNotes"
                          rows={3}
                          placeholder="Enter diagnosis notes..."
                          value={newDiagnosis.notes}
                          onChange={(e) => setNewDiagnosis({ ...newDiagnosis, notes: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="prescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Prescription
                        </label>
                        <input
                          id="prescription"
                          type="text"
                          placeholder="Enter prescription..."
                          value={newDiagnosis.prescription}
                          onChange={(e) => setNewDiagnosis({ ...newDiagnosis, prescription: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Diagnosis
                      </Button>
                    </form>
                  </Card>

                  {/* Diagnosis History */}
                  <Card className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Diagnosis History
                    </h2>
                    {patientData?.diagnoses.length ? (
                      <div className="space-y-4">
                        {patientData.diagnoses.slice().reverse().map((diagnosis) => (
                          <div
                            key={diagnosis.timestamp}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900 dark:text-white">Diagnosis</h3>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    by Dr. ID: {diagnosis.doctorId}
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(diagnosis.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes:</p>
                                <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded mt-1">
                                  {diagnosis.notes}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Prescription:</p>
                                <p className="text-sm text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-900/20 p-3 rounded mt-1">
                                  {diagnosis.prescription}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg
                          className="w-16 h-16 text-gray-400 mx-auto mb-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <p className="text-gray-600 dark:text-gray-400">No diagnoses recorded yet</p>
                      </div>
                    )}
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
