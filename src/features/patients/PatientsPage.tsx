/* Clinic patient directory with search and status filters.
 * Opens a patient record; data is live from CGS. */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Eye,
} from 'lucide-react';
import {
  PageHeader,
  Button,
  SearchInput,
  Select,
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TablePagination,
  StatusBadge,
  Badge,
  Modal,
  Input,
  EmptyState,
  TableSkeleton,
  useToast,
} from '../../components/ui';
import { PatientService } from '../../services/patient.service';
import { ClinicServiceApi } from '../../services/clinic.service';
import { Doctor, Patient, PatientStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { userSeesAllClinicData } from '../../permissions';

export const PatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const seesAll = userSeesAllClinicData(user);

  const [isLoading, setIsLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PatientStatus | 'All'>('All');
  const [sortBy, setSortBy] = useState<'name' | 'lastActivity' | 'createdDate' | 'age'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorFilter, setDoctorFilter] = useState('All');

  // New Patient Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newGender, setNewGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [newAge, setNewAge] = useState('32');
  const [newBloodGroup, setNewBloodGroup] = useState('O+');
  const [newMedicalNotes, setNewMedicalNotes] = useState('');
  const [newAllergies, setNewAllergies] = useState('None');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await PatientService.getPatients({
        search,
        status: statusFilter,
        sortBy,
        sortOrder,
        page,
        pageSize,
        doctorId: seesAll ? doctorFilter : user?.doctorId,
      });
      setPatients(res.data);
      setTotalItems(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load patient records');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, sortBy, sortOrder, page, pageSize, toast, doctorFilter, seesAll, user?.doctorId]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    if (seesAll) {
      ClinicServiceApi.getDoctors().then(setDoctors).catch(() => setDoctors([]));
    }
  }, [seesAll]);

  const handleSort = (field: 'name' | 'lastActivity' | 'createdDate' | 'age') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      toast.error('Name and phone are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await PatientService.createPatient({
        name: newName,
        phone: newPhone,
        email: newEmail || `${newName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
        gender: newGender,
        age: newAge.trim() ? parseInt(newAge, 10) : undefined,
        bloodGroup: newBloodGroup,
        medicalHistoryNotes: newMedicalNotes || 'Healthy. No chronic contraindications noted.',
        allergies: newAllergies ? newAllergies.split(',').map((s) => s.trim()) : ['None'],
        status: 'Active',
      });
      toast.success('Patient Registered', `${created.name} was added to the clinic database.`);
      setIsModalOpen(false);
      // Reset
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      setNewMedicalNotes('');
      fetchPatients();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Patient Directory"
        description="Search, view, and maintain active patient records and clinical history."
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus size={16} />}
          >
            Register Patient
          </Button>
        }
      />

      {/* Filters Toolbar */}
      <div className="filter-toolbar">
        <div style={{ flex: '1 1 260px', minWidth: '200px' }}>
          <SearchInput
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search by patient name, phone, medical notes..."
          />
        </div>

        <div className="filter-toolbar-inputs" style={{ flex: '0 1 200px', minWidth: '150px' }}>
          <div style={{ width: '100%' }}>
            <Select
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'Active', label: 'Active' },
                { value: 'Pending Followup', label: 'Pending Followup' },
                { value: 'Inactive', label: 'Inactive' },
              ]}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
            />
          </div>
          {seesAll && (
            <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
              <Select
                options={[
                  { value: 'All', label: 'All doctors' },
                  ...(user?.doctorId ? [{ value: user.doctorId, label: 'My patients' }] : []),
                  ...doctors
                    .filter((d) => d.id !== user?.doctorId)
                    .map((d) => ({ value: d.id, label: d.name })),
                ]}
                value={doctorFilter}
                onChange={(e) => {
                  setDoctorFilter(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Patients Data Table */}
      {isLoading ? (
        <TableContainer>
          <TableSkeleton rows={6} cols={6} />
        </TableContainer>
      ) : patients.length === 0 ? (
        <EmptyState
          title="No patients found"
          description="No clinical records match your query."
          actionLabel="Register New Patient"
          actionIcon={<Plus size={14} />}
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <TableContainer>
          <Table>
            <Thead>
              <Tr isHoverable={false}>
                <Th
                  sortable
                  isSorted={sortBy === 'name'}
                  sortOrder={sortOrder}
                  onClick={() => handleSort('name')}
                >
                  Patient Name
                </Th>
                <Th>Phone</Th>
                <Th>Gender / Age</Th>
                <Th>Last Appointment</Th>
                <Th>Next Appointment</Th>
                <Th>Status</Th>
                <Th
                  sortable
                  isSorted={sortBy === 'lastActivity'}
                  sortOrder={sortOrder}
                  onClick={() => handleSort('lastActivity')}
                >
                  Last Activity
                </Th>
                <Th style={{ textAlign: 'right' }}>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {patients.map((pat) => (
                <Tr
                  key={pat.id}
                  isClickable
                  onClick={() => navigate(`/patients/${pat.id}`)}
                >
                  <Td>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{pat.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pat.email}</div>
                    </div>
                  </Td>
                  <Td>
                    <span style={{ fontSize: '12px', color: 'var(--c-slate-700)', fontFamily: 'monospace' }}>
                      {pat.phone}
                    </span>
                  </Td>
                  <Td>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {pat.gender || 'Gender unknown'}{pat.age != null ? `, ${pat.age} yrs` : ''}
                    </span>
                  </Td>
                  <Td>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {pat.lastAppointment || 'None recorded'}
                    </span>
                  </Td>
                  <Td>
                    {pat.nextAppointment ? (
                      <Badge variant="default" size="sm">
                        {pat.nextAppointment}
                      </Badge>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>None scheduled</span>
                    )}
                  </Td>
                  <Td>
                    <StatusBadge status={pat.status} size="sm" />
                  </Td>
                  <Td>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {pat.lastActivity}
                    </span>
                  </Td>
                  <Td style={{ textAlign: 'right' }}>
                    <div
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/patients/${pat.id}`)}
                        title="View Medical Chart"
                        style={{ padding: '6px' }}
                      >
                        <Eye size={15} />
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>

          <TablePagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={(newPage) => setPage(newPage)}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            pageSizeOptions={[10, 20, 50]}
          />
        </TableContainer>
      )}

      {/* New Patient Registration Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Patient"
        description="Create an official clinical profile record."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleCreatePatient}
            >
              Complete Registration
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreatePatient} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input
            label="Full Name"
            placeholder="Patient full name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <Input
              label="Phone Number"
              placeholder="+91 98440 12345"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              required
            />
            <Input
              label="Email Address"
              placeholder="patient@gmail.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
            <Select
              label="Gender"
              options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Other', label: 'Other' },
              ]}
              value={newGender}
              onChange={(e) => setNewGender(e.target.value as any)}
            />
            <Input
              label="Age"
              type="number"
              value={newAge}
              onChange={(e) => setNewAge(e.target.value)}
            />
            <Select
              label="Blood Group"
              options={[
                { value: 'A+', label: 'A+' },
                { value: 'A-', label: 'A-' },
                { value: 'B+', label: 'B+' },
                { value: 'B-', label: 'B-' },
                { value: 'O+', label: 'O+' },
                { value: 'O-', label: 'O-' },
                { value: 'AB+', label: 'AB+' },
                { value: 'AB-', label: 'AB-' },
              ]}
              value={newBloodGroup}
              onChange={(e) => setNewBloodGroup(e.target.value)}
            />
          </div>

          <Input
            label="Known Drug Allergies"
            placeholder="e.g. Penicillin, Sulfa drugs, None"
            value={newAllergies}
            onChange={(e) => setNewAllergies(e.target.value)}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--c-slate-700)' }}>
              Medical History & Background Notes
            </label>
            <textarea
              rows={3}
              value={newMedicalNotes}
              onChange={(e) => setNewMedicalNotes(e.target.value)}
              placeholder="Chronic conditions (Diabetes, Hypertension), ongoing medications..."
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
