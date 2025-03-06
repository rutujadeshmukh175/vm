import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaRegFileAlt, FaDownload, FaFileInvoice, FaCheck, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const AssignedDistributorsList = () => {
    const [distributors, setDistributors] = useState([]);
    const [certificates, setCertificates] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [documents, setDocuments] = useState([]);
    const [users, setUsers] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch assigned documents from the new API
        axios
            .get("http://localhost:3000/documents/assigned-list")
            .then((response) => {
                const sortedDocuments = response.data.documents.sort(
                    (a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at)
                );
                setDocuments(sortedDocuments);
            })
            .catch((error) => console.error("Error fetching assigned documents:", error));

        // Fetch distributors
        axios
            .get("http://localhost:3000/users/distributors")
            .then((response) => setDistributors(response.data))
            .catch((error) => console.error("Error fetching distributors:", error));

        // Fetch certificates
        axios
            .get("http://localhost:3000/certificates")
            .then((response) => setCertificates(response.data))
            .catch((error) => console.error("Error fetching certificates:", error));

        // Fetch users
        axios
            .get("http://localhost:3000/users/register")
            .then((response) => setUsers(response.data))
            .catch((error) => console.error("Error fetching users:", error));
    }, []);

    const handleStatusFilterChange = (e) => {
        setStatusFilter(e.target.value);
    };

    const handleSearchQueryChange = (e) => {
        setSearchQuery(e.target.value);
    };

    // Update document status
    const handleUpdateStatus = async (documentId, newStatus) => {
        try {
            await axios.put(`http://localhost:3000/documents/update-status/${documentId}`, {
                status: newStatus,
            });
            setDocuments((prev) =>
                prev.map((doc) =>
                    doc.document_id === documentId ? { ...doc, status: newStatus } : doc
                )
            );
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status.");
        }
    };

    const filteredDocuments = documents
        .filter((doc) => doc.status === "Completed" || doc.status === "Rejected") // Only Rejected or Completed
        .filter((doc) =>
            statusFilter ? doc.status?.toLowerCase() === statusFilter.toLowerCase() : true
        )
        .filter((doc) => {
            if (!searchQuery) return true;

            const lowerQuery = searchQuery.toLowerCase();

            return (
                doc.document_id?.toString().toLowerCase().includes(lowerQuery) ||
                doc.name?.toLowerCase().includes(lowerQuery) ||
                doc.email?.toLowerCase().includes(lowerQuery) ||
                doc.phone?.toString().toLowerCase().includes(lowerQuery) ||
                doc.category_name?.toLowerCase().includes(lowerQuery) ||
                doc.subcategory_name?.toLowerCase().includes(lowerQuery) ||
                doc.address?.toLowerCase().includes(lowerQuery)
            );
        });

    const getDistributorName = (distributorId) => {
        const distributor = users.find((user) => Number(user.user_id) === Number(distributorId));
        return distributor ? distributor.name : "";
    };

    const handleViewInvoice = (documentId, categoryId, subcategoryId) => {
        navigate(`/Invoice/${documentId}`, { state: { categoryId, subcategoryId } });
    };

    const handleView = (documentId, categoryId, subcategoryId) => {
        navigate(`/View/${documentId}`, { state: { categoryId, subcategoryId } });
    };

    const getCertificateByDocumentId = (documentId) => {
        const matchedCertificate = certificates.find((cert) => cert.document_id === documentId);
        return matchedCertificate ? matchedCertificate.certificate_id : null;
    };

    const handleViewCertificate = async (documentId) => {
        const certificateId = getCertificateByDocumentId(documentId);
        if (!certificateId) {
            alert("Certificate not found.");
            return;
        }
        try {
            const response = await axios.get(`http://localhost:3000/certificates/${certificateId}`);
            if (response.data && response.data.file_url) {
                window.open(response.data.file_url, "_blank");
            } else {
                alert("Certificate not found.");
            }
        } catch (error) {
            console.error("Error fetching certificate:", error);
            alert("Failed to fetch certificate.");
        }
    };

    const handleDownloadCertificate = async (documentId, name) => {
        try {
            const response = await axios.get(
                `http://localhost:3000/download-certificate/${documentId}`,
                {
                    responseType: "blob", // Important to handle file downloads
                }
            );

            // Create a downloadable link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `${name}.zip`); // Set ZIP file name based on user name
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error("Error downloading certificate:", error);
            alert("Failed to download certificate.");
        }
    };

    return (
        <div className="ml-[295px] flex flex-col items-center min-h-screen p-10 bg-gray-100  max-h-[1000px]">
            <div className="w-full p-6 bg-white rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Verify Documents</h2>

                    <div className="flex items-center space-x-4">
                        <div>
                            <label htmlFor="statusFilter" className="mr-2">Filter by Status:</label>
                            <select
                                id="statusFilter"
                                value={statusFilter}
                                onChange={handleStatusFilterChange}
                                className="p-2 border rounded"
                            >
                                <option value="">All</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>

                        <input
                            type="text"
                            placeholder="Search documents..."
                            value={searchQuery}
                            onChange={handleSearchQueryChange}
                            className="p-2 border rounded w-[200px]"
                        />
                    </div>
                </div>

                <div className="table-container border border-gray-300 rounded-lg shadow-md">
                    <table className="table border-collapse border border-gray-300 min-w-full">
                        <thead className="bg-gray-300">
                            <tr>
                                <th className="border p-2 text-center font-bold">Sr No.</th>
                                <th className="border p-2 text-center font-bold">Application Id</th>
                                <th className="border p-2 font-bold">Category</th>
                                <th className="border p-2 font-bold">Subcategory</th>
                                <th className="border p-2 font-bold">Name</th>
                                <th className="border p-2 font-bold">Email</th>
                                <th className="border p-2 font-bold">Assign Distributor</th>
                                <th className="border p-2 font-bold">Verification</th>
                                <th className="border p-2 font-bold">Completed</th>

                                <th className="border p-2 font-bold">Action</th>
                                <th className="border p-2 font-bold">View</th>
                                <th className="border p-2 font-bold">Certificate</th>
                                <th className="border p-2 font-bold">Download Certificate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDocuments.map((doc, index) => (
                                <tr
                                    key={doc.document_id}
                                    className={`border-t ${index % 2 === 0 ? "bg-white" : "bg-white"} hover:bg-gray-100`}
                                >
                                    <td className="border p-2 text-center">{index + 1}</td>
                                    <td className="border p-2 text-center">{doc.application_id}</td>
                                    <td className="border p-2">{doc.category_name}</td>
                                    <td className="border p-2">{doc.subcategory_name}</td>
                                    <td className="border p-2">{doc.name}</td>
                                    <td className="border p-2 break-words">{doc.email}</td>
                                    <td className="border p-2">{getDistributorName(doc.distributor_id)}</td>

                                    <td className="border p-2">
                                        <span
                                            className={`px-3 py-1 rounded-full text-white text-sm ${doc.status === "Approved"
                                                ? "bg-green-500"
                                                : doc.status === "Rejected"
                                                    ? "bg-red-500"
                                                    : "bg-blue-500"
                                                }`}
                                        >
                                            {doc.status}
                                        </span>
                                    </td>

                                    <td className="border p-2">
                                        <button
                                            onClick={() => handleUpdateStatus(doc.document_id, "Completed")}
                                            className="bg-blue-900 rounded flex justify-center items-center hover:bg-blue-600 px-3 py-1 text-white text-sm"
                                        >
                                            <FaCheck className="text-white" />
                                        </button>
                                    </td>




                                    <td className="border p-2 text-center">
                                        <button
                                            onClick={() => handleViewInvoice(doc.document_id)}
                                            className="bg-red-500 text-white px-3 py-1 rounded flex justify-center items-center hover:bg-red-600 transition"
                                        >
                                            <FaFileInvoice className="mr-1" /> Action
                                        </button>
                                    </td>

                                    <td className="border p-2 text-center">
                                        <button onClick={() => handleView(doc.document_id, doc.category_id, doc.subcategory_id)} className="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600 transition">
                                            <FaRegFileAlt className="mr-1" /> View
                                        </button>
                                    </td>

                                    <td className="border p-2 text-center">
                                        <button onClick={() => handleViewCertificate(doc.document_id)} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition">
                                            <FaCheck className="mr-1" /> Certificate
                                        </button>
                                    </td>

                                    <td className="border p-2 text-center">
                                        <button onClick={() => handleDownloadCertificate(doc.document_id, doc.name)} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition">
                                            <FaDownload className="mr-1" /> Download
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AssignedDistributorsList;
