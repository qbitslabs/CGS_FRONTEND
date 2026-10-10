/* Clinic billing: patient invoices, Meta ads snapshot, and SaaS subscription.
 * Invoices created at complete-visit are already paid; no extra receive-payment step. */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  CreditCard,
  Eye,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Filter,
  Receipt,
  Cloud,
  MessageCircle,
  Bot,
  Sparkles,
  TrendingUp,
  Target,
  Image as ImageIcon,
  Video,
  Layers,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { formatDate } from '../../utils/format';
import {
  PageHeader,
  Button,
  ExportExcelButton,
  SearchInput,
  Select,
  StatCard,
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
  Skeleton,
  EmptyState,
  Tabs,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  useToast,
} from '../../components/ui';
import { BillingService } from '../../services/billing.service';
import { ClinicServiceApi } from '../../services/clinic.service';
import {
  BillingSummary,
  CloudApiBillingSummary,
  CloudInvoice,
  Invoice,
  MetaAdCreative,
  MetaAdsSummary,
  PaymentMethod,
  PaymentStatus,
} from '../../types';
import { useAuth } from '../../context/AuthContext';
import { userSeesAllClinicData } from '../../permissions';
import { downloadInvoicePDF, downloadCloudReceiptPDF } from '../../utils/pdfGenerator';
import { CreateInvoiceModal } from './CreateInvoiceModal';

export const BillingPage: React.FC = () => {
  const { user, can } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'patient-billing' | 'meta-ads' | 'cloud-billing'>('patient-billing');
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [cloudBilling, setCloudBilling] = useState<CloudApiBillingSummary | null>(null);
  const [metaAds, setMetaAds] = useState<MetaAdsSummary | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'All'>('All');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'All'>('All');
  const [dateFilter, setDateFilter] = useState('');

  // Selected Invoice Detail Modal
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Selected Meta Creative Preview Modal
  const [selectedCreative, setSelectedCreative] = useState<MetaAdCreative | null>(null);
  const [isCreativeModalOpen, setIsCreativeModalOpen] = useState(false);

  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [doctors, setDoctors] = useState<Array<{ id: string; name: string }>>([]);
  const [doctorFilter, setDoctorFilter] = useState('All');
  const seesAll = userSeesAllClinicData(user);
  const [sendingWhatsAppId, setSendingWhatsAppId] = useState<string | null>(null);

  // Print container ref
  const printRef = useRef<HTMLDivElement>(null);

  const canSeeCloud = can('billing.crm_view');
  const canSeeMeta = can('billing.meta_ads_view');

  const fetchBillingData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sum, invsRes, cloudRes, metaRes] = await Promise.all([
        BillingService.getBillingSummary(seesAll ? doctorFilter : user?.doctorId),
        BillingService.getInvoices({
          search,
          status: statusFilter,
          paymentMethod: methodFilter,
          date: dateFilter,
          page,
          pageSize,
          doctorId: seesAll ? doctorFilter : user?.doctorId,
        }),
        canSeeCloud ? BillingService.getCloudApiBilling() : Promise.resolve(null),
        canSeeMeta ? BillingService.getMetaAdsPerformance() : Promise.resolve(null),
      ]);
      setSummary(sum);
      setInvoices(invsRes.data);
      setTotalItems(invsRes.total);
      setTotalPages(invsRes.totalPages);
      setCloudBilling(cloudRes);
      setMetaAds(metaRes);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load billing data');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, methodFilter, dateFilter, page, pageSize, doctorFilter, seesAll, user?.doctorId, canSeeCloud, canSeeMeta]);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  useEffect(() => {
    if (activeTab === 'cloud-billing' && !canSeeCloud) setActiveTab('patient-billing');
    if (activeTab === 'meta-ads' && !canSeeMeta) setActiveTab('patient-billing');
  }, [activeTab, canSeeCloud, canSeeMeta]);

  useEffect(() => {
    if (seesAll) {
      ClinicServiceApi.getDoctors()
        .then((list) => setDoctors(list.map((d) => ({ id: d.id, name: d.name }))))
        .catch(() => setDoctors([]));
    }
  }, [seesAll]);

  const handleOpenDetail = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setIsDetailModalOpen(true);
  };

  const handlePrintInvoice = () => {
    if (!selectedInvoice) return;
    toast.info('Printing Invoice', `Opening printable format for ${selectedInvoice.invoiceNumber}`);
    window.print();
  };

  const handleSendWhatsApp = async (inv?: Invoice | null) => {
    const target = inv || selectedInvoice;
    if (!target) return;
    setSendingWhatsAppId(target.id);
    try {
      await BillingService.sendInvoiceWhatsApp(target.id);
      toast.success('Sent on WhatsApp', `Invoice ${target.invoiceNumber} PDF sent to ${target.patientName}.`);
    } catch (err: any) {
      toast.error(err?.message || 'Could not send this invoice on WhatsApp');
    } finally {
      setSendingWhatsAppId(null);
    }
  };

  const handleDownloadInvoicePDF = (inv?: Invoice | null) => {
    const target = inv || selectedInvoice;
    if (!target) return;
    toast.success('Generating Tax Bill', `Downloading official invoice ${target.invoiceNumber}.html & opening PDF preview`);
    downloadInvoicePDF(target);
  };

  const handleDownloadCloudReceipt = (cinv: CloudInvoice) => {
    toast.success('Generating SaaS Receipt', `Downloading ${cinv.invoiceNumber}.html & opening PDF preview`);
    downloadCloudReceiptPDF(cinv);
  };

  const tabs = [
    {
      key: 'patient-billing',
      label: 'Patient Treatment Invoices',
      icon: <Receipt size={16} />,
    },
    ...(can('billing.meta_ads_view')
      ? [
          {
            key: 'meta-ads',
            label: 'Meta Creatives & Ad Spend',
            icon: <Target size={16} />,
          },
        ]
      : []),
    ...(can('billing.crm_view')
      ? [
          {
            key: 'cloud-billing',
            label: 'CRM & Cloud API Subscription',
            icon: <Cloud size={16} />,
          },
        ]
      : []),
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Clinic Billing & Financial Ledger"
        description={
          canSeeCloud || canSeeMeta
            ? 'Manage patient treatment invoices, track Meta ad spend, and view CRM subscription costs.'
            : 'Manage patient treatment invoices for the clinic.'
        }
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {activeTab === 'patient-billing' && (
              <ExportExcelButton
                filename="invoices"
                headers={['Invoice', 'Patient', 'Phone', 'Service', 'Amount', 'Status', 'Method', 'Date']}
                rows={invoices.map((inv) => [
                  inv.invoiceNumber,
                  inv.patientName,
                  inv.patientPhone,
                  inv.service,
                  inv.total,
                  inv.paymentStatus,
                  inv.paymentMethod,
                  formatDate(inv.date),
                ])}
              />
            )}
            {activeTab === 'meta-ads' && metaAds && (
              <ExportExcelButton
                filename="meta-campaigns"
                headers={['Campaign', 'Platform', 'Spend', 'Impressions', 'CTR', 'Leads', 'Cost per lead', 'Status']}
                rows={metaAds.campaigns.map((camp) => [
                  camp.name,
                  camp.platform,
                  camp.spentAmount,
                  camp.impressions,
                  camp.ctr,
                  camp.leadsGenerated,
                  camp.costPerLead,
                  camp.status,
                ])}
              />
            )}
            {activeTab === 'cloud-billing' && cloudBilling && (
              <ExportExcelButton
                filename="cloud-invoices"
                headers={['Period', 'Invoice', 'Plan', 'WhatsApp', 'Total', 'Status']}
                rows={cloudBilling.cloudInvoices.map((cinv) => [
                  formatDate(cinv.billingPeriod),
                  cinv.invoiceNumber,
                  cinv.planAmount,
                  cinv.whatsappUsageAmount,
                  cinv.totalAmount,
                  cinv.status,
                ])}
              />
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateInvoiceOpen(true)}
              leftIcon={<Receipt size={14} />}
            >
              Create Invoice
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatusFilter('All');
                setMethodFilter('All');
                setDateFilter('');
                setPage(1);
              }}
              leftIcon={<Filter size={14} />}
            >
              Reset Filters
            </Button>
          </div>
        }
      />

      {/* Primary Tabs Navigation */}
      {tabs.length > 1 && (
        <Tabs
          tabs={tabs}
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as any)}
        />
      )}

      {/* ========================================================
          TAB 1: PATIENT INVOICES & TREATMENT BILLING
         ======================================================== */}
      {activeTab === 'patient-billing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* KPI Top Summary Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
              gap: '16px',
            }}
          >
            <StatCard
              title="Total Revenue Collected"
              value={summary ? `₹${summary.totalRevenue.toLocaleString('en-IN')}` : '₹0'}
              icon={<DollarSign size={20} />}
              iconBg="#ecfdf5"
              iconColor="#059669"
            />

            <StatCard
              title="Pending Invoices"
              value={summary ? summary.pendingPayments : 0}
              icon={<Clock size={20} />}
              iconBg="#fffbeb"
              iconColor="#d97706"
            />

            <StatCard
              title="Paid Invoices"
              value={summary ? summary.paidInvoicesCount : 0}
              icon={<CheckCircle2 size={20} />}
              iconBg="#f0fdf4"
              iconColor="#16a34a"
            />

            <StatCard
              title="Outstanding Amount"
              value={summary ? `₹${summary.outstandingAmount.toLocaleString('en-IN')}` : '₹0'}
              icon={<AlertCircle size={20} />}
              iconBg="#fff1f2"
              iconColor="#e11d48"
            />
          </div>

          {/* Search and Filters Toolbar */}
          <div className="filter-toolbar">
            <div style={{ flex: '1 1 240px', minWidth: '200px' }}>
              <SearchInput
                value={search}
                onChange={(val) => {
                  setSearch(val);
                  setPage(1);
                }}
                placeholder="Search by invoice ID, patient, service..."
              />
            </div>

            <div className="filter-toolbar-inputs">
              {seesAll && (
                <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
                  <Select
                    options={[
                      { value: 'All', label: 'All doctors' },
                      ...(user?.doctorId ? [{ value: user.doctorId, label: 'My invoices' }] : []),
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
                    { value: 'Paid', label: 'Paid' },
                    { value: 'Pending', label: 'Pending' },
                    { value: 'Partially Paid', label: 'Partially Paid' },
                    { value: 'Cancelled', label: 'Cancelled' },
                    { value: 'Refunded', label: 'Refunded' },
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
                    { value: 'All', label: 'All Methods' },
                    { value: 'UPI', label: 'UPI / GPay' },
                    { value: 'Card', label: 'Debit / Credit Card' },
                    { value: 'Cash', label: 'Cash' },
                    { value: 'Bank Transfer', label: 'Bank Transfer' },
                    { value: 'Other', label: 'Other' },
                  ]}
                  value={methodFilter}
                  onChange={(e) => {
                    setMethodFilter(e.target.value as any);
                    setPage(1);
                  }}
                />
              </div>

              <div style={{ flex: '1 1 140px', minWidth: '130px' }}>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Filter Date"
                />
              </div>
            </div>
          </div>

          {/* Invoices Table */}
          {isLoading ? (
            <TableContainer>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Skeleton height={32} />
                <Skeleton height={32} />
                <Skeleton height={32} />
                <Skeleton height={32} />
              </div>
            </TableContainer>
          ) : invoices.length === 0 ? (
            <EmptyState
              icon={<CreditCard size={36} color="var(--c-slate-400)" />}
              title="No billing records found"
              description="No treatment invoices match the selected status or date filters."
            />
          ) : (
            <TableContainer>
              <Table>
                <Thead>
                  <Tr isHoverable={false}>
                    <Th>Invoice #</Th>
                    <Th>Patient</Th>
                    <Th>Clinical Service</Th>
                    <Th>Amount</Th>
                    <Th>Payment Status</Th>
                    <Th>Payment Method</Th>
                    <Th>Date</Th>
                    <Th style={{ textAlign: 'right' }}>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {invoices.map((inv) => (
                    <Tr
                      key={inv.id}
                      isClickable
                      onClick={() => handleOpenDetail(inv)}
                    >
                      <Td>
                        <span style={{ fontWeight: 700, color: 'var(--c-primary-800)', fontFamily: 'monospace' }}>
                          {inv.invoiceNumber}
                        </span>
                      </Td>
                      <Td>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{inv.patientName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {inv.patientPhone}
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <div style={{ maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {inv.service}
                        </div>
                      </Td>
                      <Td>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                            ₹{inv.total.toLocaleString('en-IN')}
                          </div>
                          {inv.remainingAmount > 0 && (
                            <div style={{ fontSize: '11px', color: 'var(--status-error)', fontWeight: 500 }}>
                              Due: ₹{inv.remainingAmount.toLocaleString('en-IN')}
                            </div>
                          )}
                        </div>
                      </Td>
                      <Td>
                        <StatusBadge status={inv.paymentStatus} size="sm" />
                      </Td>
                      <Td>
                        <Badge variant="neutral" size="sm">
                          {inv.paymentMethod}
                        </Badge>
                      </Td>
                      <Td>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {formatDate(inv.date)}
                        </span>
                      </Td>
                      <Td style={{ textAlign: 'right' }}>
                        <div
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendWhatsApp(inv);
                            }}
                            title="Send on WhatsApp"
                            isLoading={sendingWhatsAppId === inv.id}
                            style={{ padding: '6px', color: 'var(--c-primary-700)' }}
                          >
                            <MessageCircle size={15} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadInvoicePDF(inv);
                            }}
                            title="Download Tax Bill (PDF / Print)"
                            style={{ padding: '6px', color: 'var(--c-primary-700)' }}
                          >
                            <Download size={15} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDetail(inv)}
                            title="View Invoice Details"
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
                onPageChange={setPage}
              />
            </TableContainer>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 2: META ADS & CREATIVES PERFORMANCE (DOCTOR ONLY)
         ======================================================== */}
      {activeTab === 'meta-ads' && metaAds && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Ad Spend Top Metrics Overview */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
              gap: '16px',
            }}
          >
            <StatCard
              title="Total Meta Ad Spend"
              value={`₹${metaAds.totalMonthlyAdSpend.toLocaleString('en-IN')}`}
              change={
                metaAds.monthlyBudget > 0
                  ? `${Math.round((metaAds.totalMonthlyAdSpend / metaAds.monthlyBudget) * 100)}% of ₹${metaAds.monthlyBudget.toLocaleString('en-IN')} budget`
                  : undefined
              }
              changeType="neutral"
              icon={<DollarSign size={20} />}
              iconBg="#f0fdf4"
              iconColor="#16a34a"
            />

            <StatCard
              title="Leads Acquired from Ads"
              value={metaAds.totalLeadsGenerated}
              icon={<Target size={20} />}
              iconBg="#ecfeff"
              iconColor="#0891b2"
            />

            <StatCard
              title="Avg Cost Per Lead (CPL)"
              value={`₹${metaAds.avgCostPerLead.toFixed(2)}`}
              icon={<TrendingUp size={20} />}
              iconBg="#eff6ff"
              iconColor="#2563eb"
            />

            <StatCard
              title="Estimated ROAS"
              value={`${metaAds.roas}x`}
              icon={<Sparkles size={20} />}
              iconBg="#faf5ff"
              iconColor="#9333ea"
            />
          </div>

          {/* Active Campaigns Breakdown */}
          <Card padding="md">
            <CardHeader>
              <div>
                <CardTitle>Active Meta Ad Campaigns</CardTitle>
                <CardDescription>Live performance metrics across Instagram Reels, Facebook Feed, and WhatsApp Ads.</CardDescription>
              </div>
              <Badge variant="success" size="md">
                <CheckCircle2 size={13} />
                3 Campaigns Active
              </Badge>
            </CardHeader>
            <CardContent>
              <TableContainer>
                <Table>
                  <Thead>
                    <Tr isHoverable={false}>
                      <Th>Campaign Name</Th>
                      <Th>Platform</Th>
                      <Th>Ad Spend</Th>
                      <Th>Impressions</Th>
                      <Th>CTR</Th>
                      <Th>Leads</Th>
                      <Th>Cost / Lead</Th>
                      <Th>Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {metaAds.campaigns.map((camp) => (
                      <Tr key={camp.id} isHoverable={false}>
                        <Td>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{camp.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{camp.objective}</div>
                          </div>
                        </Td>
                        <Td>
                          <Badge variant="neutral" size="sm">
                            {camp.platform}
                          </Badge>
                        </Td>
                        <Td>
                          <div>
                            <span style={{ fontWeight: 700, color: 'var(--c-primary-900)' }}>
                              ₹{camp.spentAmount.toLocaleString('en-IN')}
                            </span>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              ₹{camp.dailyBudget}/day
                            </div>
                          </div>
                        </Td>
                        <Td>
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {camp.impressions.toLocaleString('en-IN')}
                          </span>
                        </Td>
                        <Td>
                          <span style={{ fontWeight: 600, color: 'var(--status-success)' }}>
                            {camp.ctr}%
                          </span>
                        </Td>
                        <Td>
                          <span style={{ fontWeight: 700, color: 'var(--c-primary-800)' }}>
                            {camp.leadsGenerated}
                          </span>
                        </Td>
                        <Td>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            ₹{camp.costPerLead.toFixed(2)}
                          </span>
                        </Td>
                        <Td>
                          <Badge variant="success" size="sm">
                            {camp.status}
                          </Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* High-Converting Creative Showcase */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  High-Converting Meta Ad Creatives & Copy
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Visual creative performance, copy messaging, and lead acquisition metrics.
                </p>
              </div>
              <Badge variant="ai" size="md">
                <Sparkles size={13} />
                AI Dynamic Copy Active
              </Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
              {metaAds.creatives.map((creative) => (
                <div
                  key={creative.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-light)',
                    boxShadow: 'var(--shadow-xs)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Creative Header Preview Banner */}
                  <div
                    style={{
                      height: '110px',
                      backgroundColor: creative.thumbnailColor,
                      padding: '12px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      color: '#ffffff',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: 'rgba(0, 0, 0, 0.35)',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        {creative.format === 'Video Reel' && <Video size={12} />}
                        {creative.format === 'Carousel 3D' && <Layers size={12} />}
                        {creative.format === 'Single Image' && <ImageIcon size={12} />}
                        {creative.format === 'Story' && <ExternalLink size={12} />}
                        {creative.format}
                      </span>

                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        {creative.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>
                      {creative.targetProcedure}
                    </div>
                  </div>

                  {/* Copy & Headline */}
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                      {creative.headline}
                    </div>

                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {creative.primaryText}
                    </p>

                    {/* Stats Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '6px',
                        backgroundColor: 'var(--c-slate-50)',
                        padding: '10px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        marginTop: 'auto',
                        textAlign: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CTR</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--status-success)' }}>{creative.ctr}%</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Leads</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--c-primary-800)' }}>{creative.leadsGenerated}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CPL</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>₹{creative.costPerLead}</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div
                    style={{
                      padding: '12px 16px',
                      borderTop: '1px solid var(--border-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#fafafa',
                    }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard?.writeText(`${creative.headline}\n\n${creative.primaryText}`);
                        toast.success('Ad Copy Copied', 'Ad headline and primary copy copied to clipboard.');
                      }}
                      leftIcon={<Copy size={13} />}
                      style={{ fontSize: '11px', height: '28px' }}
                    >
                      Copy Text
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCreative(creative);
                        setIsCreativeModalOpen(true);
                      }}
                      leftIcon={<Eye size={13} />}
                      style={{ fontSize: '11px', height: '28px' }}
                    >
                      Full Preview
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: CRM & CLOUD API USAGE BILLING
         ======================================================== */}
      {activeTab === 'cloud-billing' && cloudBilling && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Subscription Tier Overview Card */}
          <Card padding="lg">
            <CardHeader>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="var(--c-primary-700)" />
                  <CardTitle>CGS CRM Active Subscription</CardTitle>
                </div>
                <CardDescription>Clinic SaaS software plan, multi-doctor capacity, and live billing status.</CardDescription>
              </div>
              <Badge variant="success" size="md">
                <CheckCircle2 size={13} />
                {cloudBilling.paymentStatus}
              </Badge>
            </CardHeader>

            <CardContent>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px' }}>
                <div style={{ backgroundColor: 'var(--c-slate-50)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Plan Package</span>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--c-primary-900)', marginTop: '2px' }}>
                    {cloudBilling.subscriptionPlan}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {cloudBilling.planBillingCycle}
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--c-slate-50)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Monthly Base Fee</span>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--c-primary-800)', marginTop: '2px' }}>
                    ₹{cloudBilling.subscriptionCost.toLocaleString('en-IN')} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>/ month</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Next auto-renewal: <strong>{formatDate(cloudBilling.nextBillingDate)}</strong>
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--c-slate-50)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Payment Method on File</span>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CreditCard size={16} color="var(--c-primary-700)" />
                    {cloudBilling.paymentMethodOnFile.brand} •••• {cloudBilling.paymentMethodOnFile.last4}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Expires: {cloudBilling.paymentMethodOnFile.expiry}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cloud API Live Usage Meters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px' }}>
            {/* WhatsApp Cloud API Usage */}
            <Card padding="md">
              <CardHeader>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageCircle size={18} color="#25D366" />
                  <CardTitle>Meta WhatsApp Cloud API Usage</CardTitle>
                </div>
                <Badge variant="neutral" size="sm">
                  Live Billing Cycle
                </Badge>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    {(() => {
                      const waConsumed = cloudBilling.whatsappApiUsage.conversationsUsed || 0;
                      const waLimit = cloudBilling.whatsappApiUsage.freeTierLimit || 1000;
                      const waPct = Math.min(100, Math.round((waConsumed / Math.max(1, waLimit)) * 100));
                      return (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Service Conversations (Tier 1)</span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {waConsumed} / {waLimit} ({waPct}%)
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--c-slate-200)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${Math.max(4, waPct)}%`,
                                height: '100%',
                                backgroundColor: '#25D366',
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', backgroundColor: 'var(--c-slate-50)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Messages Sent:</span>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{cloudBilling.whatsappApiUsage.messagesSent}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Extra Conv. Cost:</span>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--c-primary-800)' }}>₹{cloudBilling.whatsappApiUsage.totalCost}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Receptionist LLM Token Consumption */}
            <Card padding="md">
              <CardHeader>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bot size={18} color="var(--status-ai)" />
                  <CardTitle>AI Receptionist LLM Consumption</CardTitle>
                </div>
                <Badge variant="ai" size="sm">
                  Active Concierge
                </Badge>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    {(() => {
                      const aiConsumed = cloudBilling.aiTokenUsage.tokensConsumed || 0;
                      const aiLimit = cloudBilling.aiTokenUsage.includedTokens || 1000000;
                      const aiPct = Math.min(100, Math.round((aiConsumed / Math.max(1, aiLimit)) * 100));
                      return (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Tokens Consumed</span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {(aiConsumed / 1000).toFixed(0)}k / {(aiLimit / 1000).toFixed(0)}k ({aiPct}%)
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--c-slate-200)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${Math.max(4, aiPct)}%`,
                                height: '100%',
                                backgroundColor: 'var(--status-ai)',
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', backgroundColor: 'var(--c-slate-50)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Auto Inquiries Handled:</span>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{cloudBilling.aiTokenUsage.conversationsHandled} chats</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Overage Token Charge:</span>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--status-success)' }}>₹0.00 (Within Cap)</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CRM Monthly Invoices & Billing History */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>CGS Software & Cloud API Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <TableContainer>
                <Table>
                  <Thead>
                    <Tr isHoverable={false}>
                      <Th>Billing Period</Th>
                      <Th>Invoice #</Th>
                      <Th>Base Plan</Th>
                      <Th>WhatsApp Cloud API</Th>
                      <Th>Total Amount</Th>
                      <Th>Status</Th>
                      <Th style={{ textAlign: 'right' }}>Receipt</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {cloudBilling.cloudInvoices.map((cinv) => (
                      <Tr key={cinv.id} isHoverable={false}>
                        <Td>
                          <span style={{ fontWeight: 600 }}>{formatDate(cinv.billingPeriod)}</span>
                        </Td>
                        <Td>
                          <span style={{ fontFamily: 'monospace', color: 'var(--c-slate-700)' }}>{cinv.invoiceNumber}</span>
                        </Td>
                        <Td>₹{cinv.planAmount.toLocaleString('en-IN')}</Td>
                        <Td>₹{cinv.whatsappUsageAmount.toLocaleString('en-IN')}</Td>
                        <Td>
                          <span style={{ fontWeight: 700, color: 'var(--c-primary-900)' }}>₹{cinv.totalAmount.toLocaleString('en-IN')}</span>
                        </Td>
                        <Td>
                          <Badge variant="success" size="sm">
                            <CheckCircle2 size={12} />
                            {cinv.status}
                          </Badge>
                        </Td>
                        <Td style={{ textAlign: 'right' }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadCloudReceipt(cinv)}
                            leftIcon={<Download size={13} />}
                            style={{ height: '28px', fontSize: '11px' }}
                          >
                            Receipt
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================
          MODAL: META CREATIVE FULL PREVIEW
         ======================================================== */}
      {selectedCreative && (
        <Modal
          isOpen={isCreativeModalOpen}
          onClose={() => setIsCreativeModalOpen(false)}
          title={`Ad Creative: ${selectedCreative.title}`}
          description={`Target: ${selectedCreative.targetProcedure} • Format: ${selectedCreative.format}`}
          maxWidth="560px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard?.writeText(`${selectedCreative.headline}\n\n${selectedCreative.primaryText}`);
                  toast.success('Ad Copy Copied', 'Ad headline and copy copied to clipboard.');
                }}
                leftIcon={<Copy size={14} />}
              >
                Copy Ad Copy
              </Button>
              <Button variant="primary" size="sm" onClick={() => setIsCreativeModalOpen(false)}>
                Close Preview
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Meta Ad Mock Card */}
            <div
              style={{
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                overflow: 'hidden',
                backgroundColor: '#ffffff',
              }}
            >
              {/* Sponsored Header */}
              <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--c-primary-700)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
                  AD
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Aura Dental Care</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sponsored • Instagram & Facebook</div>
                </div>
              </div>

              {/* Primary Text */}
              <div style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {selectedCreative.primaryText}
              </div>

              {/* Creative Media Banner */}
              <div
                style={{
                  height: '180px',
                  backgroundColor: selectedCreative.thumbnailColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '20px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '18px', fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  {selectedCreative.headline}
                </div>
                <Badge variant="neutral" size="sm" style={{ backgroundColor: 'rgba(255,255,255,0.25)', color: '#ffffff' }}>
                  {selectedCreative.targetProcedure}
                </Badge>
              </div>

              {/* CTA Banner */}
              <div style={{ padding: '12px 14px', backgroundColor: 'var(--c-slate-50)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>auradental.in</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Book Free Consultation</div>
                </div>
                <Button variant="primary" size="sm" style={{ pointerEvents: 'none' }}>
                  Book Now
                </Button>
              </div>
            </div>

            {/* Performance Stats Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
              <div style={{ backgroundColor: 'var(--c-slate-50)', padding: '10px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Impressions</span>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>{selectedCreative.impressions.toLocaleString('en-IN')}</div>
              </div>
              <div style={{ backgroundColor: 'var(--c-slate-50)', padding: '10px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Clicks (CTR)</span>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--status-success)' }}>{selectedCreative.clicks} ({selectedCreative.ctr}%)</div>
              </div>
              <div style={{ backgroundColor: 'var(--c-slate-50)', padding: '10px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Leads Generated</span>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--c-primary-800)' }}>{selectedCreative.leadsGenerated}</div>
              </div>
              <div style={{ backgroundColor: 'var(--c-slate-50)', padding: '10px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cost Per Lead</span>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>₹{selectedCreative.costPerLead}</div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================
          MODAL: INVOICE DETAIL & PRINT/DOWNLOAD
         ======================================================== */}
      {selectedInvoice && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Invoice ${selectedInvoice.invoiceNumber}`}
          description={`Treatment receipt for ${selectedInvoice.patientName}`}
          maxWidth="640px"
          footer={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSendWhatsApp(selectedInvoice)}
                  leftIcon={<MessageCircle size={14} />}
                  isLoading={sendingWhatsAppId === selectedInvoice.id}
                >
                  Send on WhatsApp
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintInvoice}
                  leftIcon={<Printer size={14} />}
                >
                  Print Invoice
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadInvoicePDF(selectedInvoice)}
                  leftIcon={<Download size={14} />}
                >
                  Download PDF
                </Button>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          }
        >
          <div ref={printRef} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Header Meta */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                paddingBottom: '14px',
                borderBottom: '1px solid var(--border-light)',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--c-primary-900)' }}>
                  {selectedInvoice.clinicName || user?.clinicName || 'Clinic'}
                </div>
                {selectedInvoice.clinicAddress && (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {selectedInvoice.clinicAddress}
                  </div>
                )}
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {[selectedInvoice.clinicPhone && `Phone: ${selectedInvoice.clinicPhone}`, selectedInvoice.clinicGstin && `GSTIN: ${selectedInvoice.clinicGstin}`]
                    .filter(Boolean)
                    .join(' | ')}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <StatusBadge status={selectedInvoice.paymentStatus} />
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Date: <strong>{formatDate(selectedInvoice.date)}</strong>
                </div>
              </div>
            </div>

            {/* Patient Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', backgroundColor: 'var(--c-slate-50)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Billed To:</span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedInvoice.patientName}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{selectedInvoice.patientPhone}</div>
                {selectedInvoice.patientEmail && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedInvoice.patientEmail}</div>}
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Payment Details:</span>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Method: <strong>{selectedInvoice.paymentMethod}</strong></div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Status: <strong>{selectedInvoice.paymentStatus}</strong></div>
                {selectedInvoice.dueDate && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Due Date: {selectedInvoice.dueDate}</div>}
              </div>
            </div>

            {/* Itemized Services Table */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--c-slate-700)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Itemized Treatment Services
              </div>

              <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: '400px', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--c-slate-100)', borderBottom: '1px solid var(--border-light)' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Procedure / Item</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600 }}>Qty</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Unit Price</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.services.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '8px 12px' }}>{item.name}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>₹{item.unitPrice.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>₹{item.total.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Breakdown */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
                  <span>₹{selectedInvoice.subtotal.toLocaleString('en-IN')}</span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--status-success)' }}>
                    <span>Clinic Discount:</span>
                    <span>-₹{selectedInvoice.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {selectedInvoice.tax > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                      GST{selectedInvoice.taxPercent ? ` ${selectedInvoice.taxPercent}%` : ''}:
                    </span>
                    <span>₹{selectedInvoice.tax.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '15px', paddingTop: '6px', borderTop: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
                  <span>Total Amount:</span>
                  <span>₹{selectedInvoice.total.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--status-success)', fontWeight: 600 }}>
                  <span>Amount Paid:</span>
                  <span>₹{selectedInvoice.paidAmount.toLocaleString('en-IN')}</span>
                </div>
                {selectedInvoice.remainingAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--status-error)', fontWeight: 700 }}>
                    <span>Remaining Due:</span>
                    <span>₹{selectedInvoice.remainingAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {selectedInvoice.notes && (
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', backgroundColor: '#fffbeb', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid #fef08a', whiteSpace: 'pre-line' }}>
                <strong>Notes & Audit Trail:</strong>
                <br />
                {selectedInvoice.notes}
              </div>
            )}
          </div>
        </Modal>
      )}

      <CreateInvoiceModal
        isOpen={isCreateInvoiceOpen}
        onClose={() => setIsCreateInvoiceOpen(false)}
        onCreated={() => {
          fetchBillingData();
        }}
      />
    </div>
  );
};
