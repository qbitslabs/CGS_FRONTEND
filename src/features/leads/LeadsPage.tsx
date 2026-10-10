/* Lead inbox for the clinic: search, status tabs, and create/edit drawers.
 * New leads assign to the signed-in staff member, not a hardcoded name. */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '../../utils/format';
import {
  Plus,
  Eye,
  MessageSquare,
  Users,
  Flame,
  CalendarCheck,
  UserCheck,
  XCircle,
} from 'lucide-react';
import {
  PageHeader,
  Button,
  ExportExcelButton,
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
  Tabs,
  TabItem,
} from '../../components/ui';
import { LeadService } from '../../services/lead.service';
import { ClinicServiceApi } from '../../services/clinic.service';
import { ClinicService, Doctor, Lead, LeadSource, LeadStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { userSeesAllClinicData } from '../../permissions';

export const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const seesAll = userSeesAllClinicData(user);

  const [isLoading, setIsLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeTab, setActiveTab] = useState<'all' | 'pipeline' | 'booked' | 'converted' | 'lost'>('all');

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'All'>('All');
  const [sourceFilter, setSourceFilter] = useState<LeadSource | 'All'>('All');
  const [sortBy, setSortBy] = useState<'name' | 'createdDate' | 'score' | 'lastActivity'>('createdDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorFilter, setDoctorFilter] = useState('All');

  // New Lead Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clinicServices, setClinicServices] = useState<ClinicService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newSource, setNewSource] = useState<LeadSource>('WhatsApp');
  const [newService, setNewService] = useState('');
  const [newIntent, setNewIntent] = useState<'High' | 'Medium' | 'Low'>('High');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      let queryStatus: any = statusFilter;
      if (activeTab === 'pipeline') {
        queryStatus = 'New,Contacted,Qualified,Appointment Requested';
      } else if (activeTab === 'booked') {
        queryStatus = 'Booked';
      } else if (activeTab === 'converted') {
        queryStatus = 'Converted';
      } else if (activeTab === 'lost') {
        queryStatus = 'Lost';
      }

      const res = await LeadService.getLeads({
        search,
        status: queryStatus,
        source: sourceFilter,
        sortBy,
        sortOrder,
        page,
        pageSize,
        doctorId: seesAll ? doctorFilter : user?.doctorId,
      });
      setLeads(res.data);
      setTotalItems(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load leads');
    } finally {
      setIsLoading(false);
    }
  }, [search, activeTab, statusFilter, sourceFilter, sortBy, sortOrder, page, pageSize, toast, doctorFilter, seesAll, user?.doctorId]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    if (seesAll) {
      ClinicServiceApi.getDoctors().then(setDoctors).catch(() => setDoctors([]));
    }
  }, [seesAll]);

  const openCreateLeadModal = async () => {
    setIsModalOpen(true);
    setServicesLoading(true);
    try {
      const services = await ClinicServiceApi.getServices();
      const active = (services || []).filter((s) => s.isActive !== false);
      setClinicServices(active);
      if (active.length > 0) {
        setNewService((prev) =>
          prev && active.some((s) => s.name === prev) ? prev : active[0].name
        );
      } else {
        setNewService('');
      }
    } catch (err: any) {
      setClinicServices([]);
      setNewService('');
      toast.error(err.message || 'Failed to load clinic services');
    } finally {
      setServicesLoading(false);
    }
  };

  const handleSort = (field: 'name' | 'createdDate' | 'score' | 'lastActivity') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      toast.error('Name and phone number are required');
      return;
    }
    if (!newService.trim()) {
      toast.error('Please select a service of interest');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await LeadService.createLead({
        name: newName,
        phone: newPhone,
        email: newEmail || undefined,
        source: newSource,
        status: 'New',
        assignedTo: user?.name || '',
        score: newIntent === 'High' ? 85 : newIntent === 'Medium' ? 65 : 40,
        interestedService: newService,
        intent: newIntent,
        notes: newNotes || 'Direct inquiry recorded via dashboard.',
      });
      toast.success('Lead Created', `${created.name} was added to the pipeline.`);
      setIsModalOpen(false);
      // Reset
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      setNewNotes('');
      setNewService(clinicServices[0]?.name || '');
      fetchLeads();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const leadTabs: TabItem[] = [
    {
      key: 'all',
      label: 'All Leads',
      icon: <Users size={15} />,
      badge: activeTab === 'all' ? <Badge variant="neutral" size="sm">{totalItems}</Badge> : undefined,
    },
    {
      key: 'pipeline',
      label: 'Active Pipeline',
      icon: <Flame size={15} color="var(--c-primary-700)" />,
      badge: activeTab === 'pipeline' ? <Badge variant="default" size="sm">{totalItems}</Badge> : undefined,
    },
    {
      key: 'booked',
      label: 'Booked',
      icon: <CalendarCheck size={15} color="var(--status-info)" />,
      badge: activeTab === 'booked' ? <Badge variant="info" size="sm">{totalItems}</Badge> : undefined,
    },
    {
      key: 'converted',
      label: 'Converted to Patient',
      icon: <UserCheck size={15} color="var(--status-success)" />,
      badge: activeTab === 'converted' ? <Badge variant="success" size="sm">{totalItems}</Badge> : undefined,
    },
    {
      key: 'lost',
      label: 'Lost / Dropped',
      icon: <XCircle size={15} color="var(--status-error)" />,
      badge: activeTab === 'lost' ? <Badge variant="error" size="sm">{totalItems}</Badge> : undefined,
    },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Lead Management"
        description="Track, qualify, and convert incoming patient inquiries into clinic appointments."
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <ExportExcelButton
              filename="leads"
              headers={['Name', 'Phone', 'Email', 'Source', 'Service', 'Status', 'Score', 'Assigned to', 'Last activity']}
              rows={leads.map((lead) => [
                lead.name,
                lead.phone,
                lead.email || '',
                lead.source,
                lead.interestedService,
                lead.status,
                lead.score,
                lead.assignedTo,
                formatDateTime(lead.lastActivity),
              ])}
            />
            <Button
              variant="primary"
              size="md"
              onClick={() => openCreateLeadModal()}
              leftIcon={<Plus size={16} />}
            >
              Add New Lead
            </Button>
          </div>
        }
      />

      {/* Tabs Navigation */}
      <Tabs
        tabs={leadTabs}
        activeKey={activeTab}
        onChange={(k) => {
          setActiveTab(k as any);
          setPage(1);
        }}
      />

      {/* Filter Toolbar */}
      <div className="filter-toolbar">
        <div style={{ flex: '1 1 240px', minWidth: '200px' }}>
          <SearchInput
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search by name, phone, service..."
          />
        </div>

        <div className="filter-toolbar-inputs">
          {seesAll && (
            <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
              <Select
                options={[
                  { value: 'All', label: 'All doctors' },
                  ...(user?.doctorId ? [{ value: user.doctorId, label: 'My leads' }] : []),
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
          <div style={{ flex: '1 1 150px', minWidth: '130px' }}>
            <Select
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'New', label: 'New' },
                { value: 'Contacted', label: 'Contacted' },
                { value: 'Qualified', label: 'Qualified' },
                { value: 'Appointment Requested', label: 'Apt Requested' },
                { value: 'Booked', label: 'Booked' },
                { value: 'Lost', label: 'Lost' },
              ]}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
            />
          </div>

          <div style={{ flex: '1 1 150px', minWidth: '130px' }}>
            <Select
              options={[
                { value: 'All', label: 'All Sources' },
                { value: 'WhatsApp', label: 'WhatsApp' },
                { value: 'Website', label: 'Website' },
                { value: 'Google Ad', label: 'Google Ad' },
                { value: 'Instagram', label: 'Instagram' },
                { value: 'Walk-in', label: 'Walk-in' },
                { value: 'Referral', label: 'Referral' },
              ]}
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value as any);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Leads Data Table */}
      {isLoading ? (
        <TableContainer>
          <TableSkeleton rows={6} cols={6} />
        </TableContainer>
      ) : leads.length === 0 ? (
        <EmptyState
          title="No leads found"
          description="Try adjusting your search query or status filters to see patient leads."
          actionLabel="Add First Lead"
          actionIcon={<Plus size={14} />}
          onAction={() => openCreateLeadModal()}
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
                  Patient Lead
                </Th>
                <Th>Phone</Th>
                <Th>Source</Th>
                <Th>Interested Service</Th>
                <Th>Status</Th>
                <Th
                  sortable
                  isSorted={sortBy === 'score'}
                  sortOrder={sortOrder}
                  onClick={() => handleSort('score')}
                >
                  Score
                </Th>
                <Th>Assigned To</Th>
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
              {leads.map((lead) => (
                <Tr
                  key={lead.id}
                  isClickable
                  onClick={() => navigate(`/leads/${lead.id}`)}
                >
                  <Td>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{lead.name}</div>
                      {lead.email && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{lead.email}</div>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <span style={{ fontSize: '12px', color: 'var(--c-slate-700)', fontFamily: 'monospace' }}>
                      {lead.phone}
                    </span>
                  </Td>
                  <Td>
                    <Badge variant="neutral" size="sm">
                      {lead.source}
                    </Badge>
                  </Td>
                  <Td>
                    <div style={{ maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {lead.interestedService}
                    </div>
                  </Td>
                  <Td>
                    <StatusBadge status={lead.status} size="sm" />
                  </Td>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '12px',
                          color:
                            lead.score >= 80
                              ? 'var(--status-success)'
                              : lead.score >= 50
                              ? 'var(--status-warning)'
                              : 'var(--text-muted)',
                        }}
                      >
                        {lead.score}
                      </span>
                      <div
                        style={{
                          width: '40px',
                          height: '4px',
                          backgroundColor: 'var(--c-slate-200)',
                          borderRadius: 'var(--radius-full)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${lead.score}%`,
                            height: '100%',
                            backgroundColor:
                              lead.score >= 80
                                ? 'var(--status-success)'
                                : lead.score >= 50
                                ? 'var(--status-warning)'
                                : 'var(--text-muted)',
                          }}
                        />
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {lead.assignedTo}
                    </span>
                  </Td>
                  <Td>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {formatDateTime(lead.lastActivity)}
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
                        onClick={() => navigate(`/leads/${lead.id}`)}
                        title="View Lead Details"
                        style={{ padding: '6px' }}
                      >
                        <Eye size={15} />
                      </Button>
                      {lead.linkedConversationId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/conversations/${lead.linkedConversationId}`)}
                          title="Open WhatsApp Thread"
                          style={{ padding: '6px' }}
                        >
                          <MessageSquare size={15} color="var(--c-primary-700)" />
                        </Button>
                      )}
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
            pageSizeOptions={[5, 10, 20, 50]}
          />
        </TableContainer>
      )}

      {/* New Lead Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Patient Lead"
        description="Record a walk-in, phone query, or offline referral inquiry."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleCreateLead}
            >
              Save & Add Lead
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateLead} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input
            label="Patient Name"
            placeholder="Lead name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <Input
              label="Phone Number"
              placeholder="+91 98860 11223"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              required
            />
            <Input
              label="Email Address (Optional)"
              placeholder="patient@gmail.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            <Select
              label="Lead Source"
              options={[
                { value: 'WhatsApp', label: 'WhatsApp' },
                { value: 'Website', label: 'Website' },
                { value: 'Walk-in', label: 'Walk-in' },
                { value: 'Google Ad', label: 'Google Ad' },
                { value: 'Instagram', label: 'Instagram' },
                { value: 'Referral', label: 'Referral' },
              ]}
              value={newSource}
              onChange={(e) => setNewSource(e.target.value as any)}
            />

            <Select
              label="Patient Intent"
              options={[
                { value: 'High', label: 'High (Immediate need)' },
                { value: 'Medium', label: 'Medium (Exploring)' },
                { value: 'Low', label: 'Low (Price check)' },
              ]}
              value={newIntent}
              onChange={(e) => setNewIntent(e.target.value as any)}
            />
          </div>

          <Select
            label="Service of Interest"
            options={
              clinicServices.length > 0
                ? clinicServices.map((s) => ({ value: s.name, label: s.name }))
                : [{ value: '', label: servicesLoading ? 'Loading services...' : 'No services configured' }]
            }
            value={newService}
            onChange={(e) => setNewService(e.target.value)}
            disabled={servicesLoading || clinicServices.length === 0}
          />
          {!servicesLoading && clinicServices.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--status-error)', marginTop: -8 }}>
              Add services in Settings → Clinical Services, or during clinic onboarding.
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--c-slate-700)' }}>
              Clinical / Initial Notes
            </label>
            <textarea
              rows={3}
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Symptoms, previous dental history, preferred appointment time..."
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
