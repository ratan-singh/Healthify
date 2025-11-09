
import DoctorDashboardSearchNavbar from "@/components/DoctorDashboardSearchNavbar";

export default function DoctorNavbar() {
    const handleSearch = (value) => {
        console.log("Search query:", value);
        // You could call an API or filter local data here
    };
    return (
        <div className="flex justify-between items-center h-18 w-full bg-white shadow-2xl">
            <div className="flex gap-x-1 items-center">
                <h1 className="text-2xl text-violet-500 font-bold ml-4">Healthify - Doctor Dashboard</h1>
                <p className="text-gray-600 ml-4">Welcome back, Doctor!</p>
            </div>
            <div className="flex gap-x-1">
                <DoctorDashboardSearchNavbar onSearch={handleSearch} />
                <button className="bg-violet-500 text-white px-4 py-2 rounded-md mr-4">Logout</button>
            </div>
        </div>
    )
}