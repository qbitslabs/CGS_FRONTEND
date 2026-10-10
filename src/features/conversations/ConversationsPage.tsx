/* WhatsApp inbox: thread list plus message pane for staff takeover.
 * Shows AI vs human state; sending goes through the CGS conversation API. */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Bot,
  UserCheck,
  AlertCircle,
  Send,
  Phone,
  Check,
  CheckCheck,
  FileText,
  ArrowLeft,
} from 'lucide-react';
import { formatDateTime } from '../../utils/format';
import {
  PageHeader,
  Button,
  SearchInput,
  Select,
  StatusBadge,
  Avatar,
  Modal,
  Skeleton,
  EmptyState,
  useToast,
} from '../../components/ui';
import { ConversationService } from '../../services/conversation.service';
import { Conversation, ConversationState, Doctor, Message } from '../../types';
import { ClinicServiceApi } from '../../services/clinic.service';
import { useAuth } from '../../context/AuthContext';
import { userSeesAllClinicData } from '../../permissions';

export const ConversationsPage: React.FC = () => {
  const { id: routeConvId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(routeConvId || null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Mobile View state: when true on small screens, show chat details; when false, show chat list
  const [showMobileChat, setShowMobileChat] = useState<boolean>(!!routeConvId);

  // Filters
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState<ConversationState | 'All'>('All');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorFilter, setDoctorFilter] = useState('All');
  const seesAll = userSeesAllClinicData(user);

  // Internal Note Modal
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [internalNoteText, setInternalNoteText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversationsList = useCallback(async () => {
    try {
      const list = await ConversationService.getConversations(
        stateFilter,
        search,
        seesAll ? doctorFilter : user?.doctorId
      );
      setConversations(list);
      if (!selectedConvId && list.length > 0) {
        setSelectedConvId(list[0].id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load conversations');
    }
  }, [stateFilter, search, selectedConvId, toast, doctorFilter, seesAll, user?.doctorId]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await fetchConversationsList();
      setIsLoading(false);
    };
    init();
  }, [fetchConversationsList]);

  useEffect(() => {
    if (seesAll) {
      ClinicServiceApi.getDoctors().then(setDoctors).catch(() => setDoctors([]));
    }
  }, [seesAll]);

  // When route ID changes or selectedConvId changes
  useEffect(() => {
    if (routeConvId && routeConvId !== selectedConvId) {
      setSelectedConvId(routeConvId);
      setShowMobileChat(true);
    }
  }, [routeConvId, selectedConvId]);

  // Load messages whenever selected conversation changes
  useEffect(() => {
    const loadConversationDetails = async () => {
      if (!selectedConvId) return;
      try {
        const conv = await ConversationService.getConversationById(selectedConvId);
        setActiveConversation(conv);
        const msgs = await ConversationService.getMessages(selectedConvId);
        setMessages(msgs);
        setConversations((prev) =>
          prev.map((c) => (c.id === selectedConvId ? { ...c, unreadCount: 0 } : c))
        );
        window.dispatchEvent(new CustomEvent('cgs:conversations-seen'));
      } catch (err) {
        console.error(err);
      }
    };
    loadConversationDetails();
  }, [selectedConvId]);

  // Scroll to bottom of message thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConversation = (convId: string) => {
    setSelectedConvId(convId);
    setShowMobileChat(true);
    navigate(`/conversations/${convId}`);
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedConvId || !messageText.trim()) return;

    setIsSending(true);
    try {
      const senderName = user?.name ? `${user.name} (${user.role === 'doctor' ? 'Doctor' : 'Staff'})` : 'Clinic Staff';
      const newMsg = await ConversationService.sendMessage(selectedConvId, messageText.trim(), senderName);
      setMessages((prev) => [...prev, newMsg]);
      setMessageText('');
      fetchConversationsList();
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleSimulateInbound = async () => {
    if (!selectedConvId || !messageText.trim()) return;
    setIsSending(true);
    try {
      const result = await ConversationService.simulatePatientMessage(selectedConvId, messageText.trim());
      setMessages((prev) => [
        ...prev,
        result.patientMessage,
        ...(result.aiMessage ? [result.aiMessage] : []),
      ]);
      setMessageText('');
      fetchConversationsList();
    } catch (err) {
      toast.error('Failed to simulate inbound message');
    } finally {
      setIsSending(false);
    }
  };

  const handleTakeOver = async () => {
    if (!selectedConvId) return;
    try {
      const staffName = user?.name || 'Clinic Coordinator';
      const updated = await ConversationService.takeOver(selectedConvId, staffName);
      setActiveConversation(updated);
      const updatedMsgs = await ConversationService.getMessages(selectedConvId);
      setMessages(updatedMsgs);
      fetchConversationsList();
      toast.success('Conversation Taken Over', `AI suspended. Communicating directly with ${updated.participantName}.`);
    } catch (err) {
      toast.error('Failed to take over');
    }
  };

  const handleReturnToAi = async () => {
    if (!selectedConvId) return;
    try {
      const updated = await ConversationService.returnToAi(selectedConvId);
      setActiveConversation(updated);
      const updatedMsgs = await ConversationService.getMessages(selectedConvId);
      setMessages(updatedMsgs);
      fetchConversationsList();
      toast.info('Returned to AI', 'Virtual Concierge resumed automated patient support.');
    } catch (err) {
      toast.error('Failed to return to AI');
    }
  };

  const handleCloseConversation = async () => {
    if (!selectedConvId) return;
    try {
      const updated = await ConversationService.closeConversation(selectedConvId);
      setActiveConversation(updated);
      fetchConversationsList();
      toast.info('Conversation Closed', 'Thread marked resolved.');
    } catch (err) {
      toast.error('Failed to close conversation');
    }
  };

  const handleAddInternalNote = async () => {
    if (!selectedConvId || !internalNoteText.trim()) return;
    try {
      const updated = await ConversationService.addNote(selectedConvId, internalNoteText.trim());
      setActiveConversation(updated);
      setInternalNoteText('');
      setIsNoteModalOpen(false);
      toast.success('Note Added', 'Internal note updated.');
    } catch (err) {
      toast.error('Failed to add note');
    }
  };

  return (
    <div className="animate-fade-in conversations-page-wrapper">
      {/* Top Header */}
      <PageHeader
        title="Patient Communications Inbox"
        description="Monitor automated AI patient conversations, handle human escalations, and reply via WhatsApp."
      />

      {/* Main Inbox Panel */}
      <div className={`inbox-container ${showMobileChat ? 'mobile-show-chat' : 'mobile-show-list'}`}>
        {/* Left Column: Conversation List */}
        <div className="inbox-sidebar">
          {/* Search & Filter */}
          <div style={{ padding: '12px', borderBottom: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search conversations..."
              style={{ height: '34px', fontSize: '13px', width: '100%', maxWidth: '100%' }}
            />
            {seesAll && (
              <Select
                options={[
                  { value: 'All', label: 'All doctors' },
                  ...(user?.doctorId ? [{ value: user.doctorId, label: 'My chats' }] : []),
                  ...doctors
                    .filter((d) => d.id !== user?.doctorId)
                    .map((d) => ({ value: d.id, label: d.name })),
                ]}
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                style={{ height: '32px', fontSize: '12px', padding: '0 8px' }}
              />
            )}
            <Select
              options={[
                { value: 'All', label: 'All Channels & States' },
                { value: 'AI Active', label: 'AI Active' },
                { value: 'Human Active', label: 'Human Active' },
                { value: 'Handoff Pending', label: 'Handoff Pending' },
                { value: 'Closed', label: 'Closed' },
              ]}
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value as any)}
              style={{ height: '32px', fontSize: '12px', padding: '0 8px' }}
            />
          </div>

          {/* Conversations List */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {isLoading ? (
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Skeleton height={50} />
                <Skeleton height={50} />
                <Skeleton height={50} />
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No conversations matching filter.
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = conv.id === selectedConvId;
                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border-subtle)',
                      backgroundColor: isSelected ? '#ffffff' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--c-primary-700)' : '3px solid transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--c-slate-100)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {conv.participantName}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: 'var(--status-error)',
                              color: '#ffffff',
                            }}
                          >
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDateTime(conv.lastMessageTime)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <p
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          flex: 1,
                        }}
                      >
                        {conv.lastMessage}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        {conv.isCritical && <StatusBadge status="Critical Situation" size="sm" />}
                        {(conv.needsHumanHandoff || conv.state === 'Handoff Pending') && !conv.isCritical && (
                          <StatusBadge status="Human Handoff Required" size="sm" />
                        )}
                        {conv.isCritical && <StatusBadge status="Human Handoff Required" size="sm" />}
                        {conv.state !== 'Handoff Pending' && <StatusBadge status={conv.state} size="sm" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Thread & Composer */}
        {activeConversation ? (
          <div className="inbox-main">
            {/* Thread Header */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#ffffff',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                {/* Mobile Back Button */}
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="mobile-chat-back-btn"
                  title="Back to conversation list"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--c-slate-700)',
                    padding: '6px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ArrowLeft size={18} />
                </button>

                <Avatar name={activeConversation.participantName} size="md" />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {activeConversation.participantName}
                    </h3>
                    {activeConversation.isCritical && <StatusBadge status="Critical Situation" size="sm" />}
                    {(activeConversation.needsHumanHandoff || activeConversation.state === 'Handoff Pending') && (
                      <StatusBadge status="Human Handoff Required" size="sm" />
                    )}
                    {activeConversation.state !== 'Handoff Pending' && (
                      <StatusBadge status={activeConversation.state} size="sm" />
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <Phone size={12} color="var(--c-primary-700)" />
                    {activeConversation.participantPhone}
                    {activeConversation.serviceInterested && ` • ${activeConversation.serviceInterested}`}
                  </div>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {activeConversation.state !== 'Human Active' && activeConversation.state !== 'Closed' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleTakeOver}
                    leftIcon={<UserCheck size={14} />}
                    style={{ height: '30px', fontSize: '12px' }}
                  >
                    Take Over
                  </Button>
                )}

                {activeConversation.state === 'Human Active' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReturnToAi}
                    leftIcon={<Bot size={14} color="var(--status-ai)" />}
                    style={{ height: '30px', fontSize: '12px' }}
                  >
                    Return to AI
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNoteModalOpen(true)}
                  leftIcon={<FileText size={14} />}
                  style={{ height: '30px', fontSize: '12px' }}
                >
                  Note
                </Button>

                {activeConversation.state !== 'Closed' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCloseConversation}
                    style={{ height: '30px', fontSize: '12px', color: 'var(--status-error)' }}
                    title="Close and mark resolved"
                  >
                    Close
                  </Button>
                )}
              </div>
            </div>

            {/* Handoff Notice Banner if Pending */}
            {activeConversation.state === 'AI Active' && (
              <div
                style={{
                  backgroundColor: 'var(--status-ai-bg)',
                  borderBottom: '1px solid var(--status-ai-border)',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: 'var(--status-ai)',
                  flexWrap: 'wrap',
                }}
              >
                <Bot size={15} />
                <span>
                  <strong>AI receptionist is live.</strong> Messages you send here are treated as the
                  patient. Replies, leads, bookings, and usage are written to CGS.
                </span>
              </div>
            )}

            {activeConversation.state === 'Handoff Pending' && (
              <div
                style={{
                  backgroundColor: activeConversation.isCritical
                    ? 'var(--status-error-bg)'
                    : 'var(--status-warning-bg)',
                  borderBottom: `1px solid ${
                    activeConversation.isCritical
                      ? 'var(--status-error-border)'
                      : 'var(--status-warning-border)'
                  }`,
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: activeConversation.isCritical ? 'var(--status-error)' : 'var(--status-warning)',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={15} />
                  <span>
                    <strong>
                      {activeConversation.isCritical ? 'Critical Situation:' : 'Human Handoff Required:'}
                    </strong>{' '}
                    {activeConversation.handoffReason || 'Patient requested staff assistance.'}
                  </span>
                </div>
                <Button variant="primary" size="sm" onClick={handleTakeOver} style={{ height: '26px', fontSize: '11px' }}>
                  Take Over Chat
                </Button>
              </div>
            )}

            {/* Internal Notes Bar */}
            {activeConversation.internalNotes && (
              <div
                style={{
                  backgroundColor: '#fffbeb',
                  borderBottom: '1px solid #fef08a',
                  padding: '6px 16px',
                  fontSize: '11px',
                  color: '#92400e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <FileText size={13} />
                <span style={{ fontWeight: 600 }}>Staff Note:</span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeConversation.internalNotes}
                </span>
              </div>
            )}

            {/* Messages Feed (Scrollable) */}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                padding: '16px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                backgroundColor: 'var(--c-slate-50)',
              }}
              className="chat-message-feed"
            >
              {messages.map((m) => {
                const isPatient = m.sender === 'patient';
                const isAi = m.sender === 'ai';
                const isHumanStaff = m.sender === 'human';

                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isPatient ? 'flex-start' : 'flex-end',
                      width: '100%',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '85%',
                        backgroundColor: isPatient
                          ? '#ffffff'
                          : isAi
                          ? 'var(--status-ai-bg)'
                          : 'var(--c-primary-700)',
                        color: isPatient
                          ? 'var(--text-primary)'
                          : isAi
                          ? 'var(--c-slate-800)'
                          : '#ffffff',
                        border: isPatient
                          ? '1px solid var(--border-light)'
                          : isAi
                          ? '1px solid var(--status-ai-border)'
                          : 'none',
                        borderRadius: 'var(--radius-lg)',
                        padding: '10px 14px',
                        boxShadow: 'var(--shadow-xs)',
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {/* Sender Info Tag */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: isPatient
                            ? 'var(--c-slate-600)'
                            : isAi
                            ? 'var(--status-ai)'
                            : 'var(--c-primary-100)',
                          marginBottom: '4px',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {isAi && <Bot size={13} />}
                          {isHumanStaff && <UserCheck size={13} />}
                          {m.senderName}
                        </span>

                        <span style={{ fontSize: '10px', opacity: 0.8 }}>{formatDateTime(m.timestamp)}</span>
                      </div>

                      {/* Message Text Body */}
                      <div style={{ fontSize: '13px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {m.text}
                      </div>

                      {/* Delivery Status Indicator */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          marginTop: '4px',
                          fontSize: '10px',
                          opacity: 0.7,
                          gap: '3px',
                        }}
                      >
                        {m.status === 'read' ? (
                          <CheckCheck size={13} color={isHumanStaff ? '#a7f3d0' : 'var(--c-primary-600)'} />
                        ) : (
                          <Check size={13} />
                        )}
                        <span>{m.status}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Composer */}
            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid var(--border-light)',
                backgroundColor: '#ffffff',
                flexShrink: 0,
              }}
            >
              <form
                onSubmit={handleSendMessage}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <input
                  type="text"
                  placeholder="Type a staff reply to send via WhatsApp..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    height: '42px',
                    padding: '0 14px',
                    fontSize: '13px',
                    backgroundColor: 'var(--c-slate-50)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-focus)';
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-light)';
                    e.currentTarget.style.backgroundColor = 'var(--c-slate-50)';
                  }}
                />

                {import.meta.env.DEV && (
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    disabled={!messageText.trim() || isSending}
                    onClick={handleSimulateInbound}
                    style={{ height: '42px', padding: '0 12px', flexShrink: 0 }}
                    title="Developer only: simulate an inbound patient message"
                  >
                    Demo inbound
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!messageText.trim() || isSending}
                  isLoading={isSending}
                  rightIcon={<Send size={15} />}
                  style={{ height: '42px', padding: '0 16px', flexShrink: 0 }}
                >
                  Send
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <EmptyState
            title="No conversation selected"
            description="Select a conversation thread to view messages and respond."
          />
        )}
      </div>

      {/* Internal Note Modal */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title="Add Internal Conversation Note"
        description="Log confidential notes visible only to the clinic staff and doctor."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsNoteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddInternalNote}>
              Save Note
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <textarea
            rows={4}
            value={internalNoteText}
            onChange={(e) => setInternalNoteText(e.target.value)}
            placeholder="Internal notes for this conversation"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '13px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>
      </Modal>
    </div>
  );
};
