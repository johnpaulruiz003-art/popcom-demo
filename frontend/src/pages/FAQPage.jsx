import React, { useEffect, useMemo, useState } from 'react';
import { Accordion, Loader, Center, Modal, Textarea, TextInput, Autocomplete, Stack } from '@mantine/core';
import { IconSearch, IconX, IconPlus, IconPencil, IconTrash, IconChevronDown } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { showNotification } from '@mantine/notifications';

import { createFaq, deleteFaq, getFaqs, getFaqTopics, updateFaq } from '../api/faq.js';
import { useAuth } from '../context/AuthContext.jsx';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal.jsx';
import '../styles/faqPage.css';
import '../styles/dialog.css';

// Contact details for the end-of-list callout. These are the same values the
// site footer renders (layout/AppShellLayout.jsx), reused as literals so this
// page does not need its own API call.
const OFFICE_CONTACT = {
  phone: '0915-811-2320',
  email: 'sanfabian.munpopcom@gmail.com'
};

const SERVICE_LINKS = [
  ['/services/pre-marriage-orientation', 'Pre-Marriage Orientation (PMOC)'],
  ['/services/usapan-series', 'Usapan Series'],
  ['/services/rpfp', 'Responsible Parenthood &amp; Family Development (RPFP)'],
  ['/services/ahdp', 'Adolescent Health and Development Program (AHDP)'],
  ['/services/iec', 'Population Awareness &amp; IEC Activities'],
  ['/services/population-profiling', 'Demographic Data Collection &amp; Population Profiling'],
  ['/services/community-events', 'Support During Community Events'],
  ['/services/other-assistance', 'Other Assistance']
];

export function FAQPage() {
  const auth = useAuth() || {};
  const { isAdmin } = auth;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalOpened, setModalOpened] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [topics, setTopics] = useState([]);
  const [query, setQuery] = useState('');

  const form = useForm({
    initialValues: { topic: '', question: '', answer: '' },
    validate: {
      topic: () => null,
      question: (v) => (String(v || '').trim() ? null : 'Question is required'),
      answer: (v) => (String(v || '').trim() ? null : 'Answer is required')
    }
  });

  const fetchFaqs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getFaqs();
      setItems(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs().catch(() => {});
  }, []);

  const fetchTopics = async () => {
    try {
      const res = await getFaqTopics();
      const list = Array.isArray(res.data.data) ? res.data.data : [];
      setTopics(list);
    } catch (err) {
      console.error(err);
      setTopics([]);
    }
  };

  useEffect(() => {
    fetchTopics().catch(() => {});
  }, []);

  const openCreate = () => {
    setEditingId(null);
    form.setValues({ topic: '', question: '', answer: '' });
    form.resetDirty();
    setModalOpened(true);
  };

  const openEdit = (faq) => {
    setEditingId(faq.id);
    form.setValues({ topic: faq.topic || '', question: faq.question || '', answer: faq.answer || '' });
    form.resetDirty();
    setModalOpened(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingId) {
        await updateFaq(editingId, values);
        showNotification({ title: 'Updated', message: 'FAQ updated successfully', color: 'green' });
      } else {
        await createFaq(values);
        showNotification({ title: 'Created', message: 'FAQ created successfully', color: 'green' });
      }
      setModalOpened(false);
      setEditingId(null);
      await fetchFaqs();
      await fetchTopics();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.error?.message || 'Failed to save FAQ';
      showNotification({ title: 'Error', message: msg, color: 'red' });
    }
  };

  const handleDelete = (id) => {
    setDeleteId(id);
  };

  const filteredItems = useMemo(() => {
    const q = String(query || '').toLowerCase().trim();
    if (!q) return items || [];
    return (items || []).filter((it) =>
      [it.topic, it.question, it.answer]
        .map((v) => String(v || '').toLowerCase())
        .some((text) => text.includes(q))
    );
  }, [items, query]);

  const sortedItems = useMemo(() => {
    return [...(filteredItems || [])].sort((a, b) => Number(a.id) - Number(b.id));
  }, [filteredItems]);

  const groupedItems = useMemo(() => {
    if (!sortedItems || sortedItems.length === 0) return {};
    return sortedItems.reduce((acc, item) => {
      const topic = String(item.topic || '').trim() || 'General';
      if (!acc[topic]) acc[topic] = [];
      acc[topic].push(item);
      return acc;
    }, {});
  }, [sortedItems]);

  // FAQ answers are plain text that may contain line breaks. Split them into
  // paragraphs so each can be justified independently by CSS.
  const answerToParagraphs = (answer) =>
    String(answer || '')
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

  return (
    <>
    <div className="sf-faq">
      <div className="sf-faq__container">
        <div className="sf-faq__grid">
        <div className="sf-faq__main">
            <div className="sf-faq__headrow">
              <div>
                <h1 className="sf-faq__title">Inquiries (FAQ)</h1>
                <hr className="sf-faq__rule" />
                <p className="sf-faq__lede">
                  Answers to common questions about family planning, counseling and our services.
                </p>
              </div>
              {isAdmin ? (
                <button type="button" className="btn-primary sf-btn--sm sf-faq__add" onClick={openCreate}>
                  <IconPlus width={16} height={16} aria-hidden="true" />
                  Add FAQ
                </button>
              ) : null}
            </div>

            <div className="sf-faq__search">
              <TextInput
                aria-label="Search FAQs"
                placeholder="Search by topic, question, or answer..."
                leftSection={<IconSearch aria-hidden="true" />}
                rightSection={
                  query ? (
                    <button
                      type="button"
                      className="sf-faq__clear"
                      aria-label="Clear search"
                      onClick={() => setQuery('')}
                    >
                      <IconX width={16} height={16} aria-hidden="true" />
                    </button>
                  ) : null
                }
                rightSectionPointerEvents={query ? 'all' : 'none'}
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
              />
            </div>

            {query ? (
              <p className="sf-faq__count">
                {sortedItems.length} result{sortedItems.length === 1 ? '' : 's'}
              </p>
            ) : null}

            {loading ? (
              <Center py="lg">
                <Loader />
              </Center>
            ) : error ? (
              <p className="sf-faq__empty-text" style={{ color: '#B91C1C' }}>{error}</p>
            ) : items.length === 0 ? (
              <div className="sf-faq__empty">
                <p className="sf-faq__empty-text">No FAQs available.</p>
              </div>
            ) : sortedItems.length === 0 ? (
              <div className="sf-faq__empty">
                <p className="sf-faq__empty-text">No FAQs match your search.</p>
                <button type="button" className="btn-secondary sf-btn--sm" onClick={() => setQuery('')}>
                  Clear search
                </button>
              </div>
            ) : (
              <>
                {Object.entries(groupedItems).map(([topic, topicItems]) => (
                  <section key={topic}>
                    <h2 className="sf-faq__category">{topic}</h2>
                    <Accordion variant="unstyled" radius={0} multiple={false} chevron={null}>
                      {topicItems.map((item) => (
                        <Accordion.Item
                          key={item.id}
                          value={String(item.id)}
                          unstyled
                          className="sf-faq__item"
                        >
                          <Accordion.Control unstyled chevron={null} className="sf-faq__trigger">
                            {item.question}
                          </Accordion.Control>

                          {/* SIBLINGS of the trigger button, never nested
                              inside it (invalid HTML, breaks keyboard use). */}
                          {isAdmin ? (
                            <div className="sf-faq__actions">
                              <button
                                type="button"
                                className="sf-btn-icon"
                                aria-label={`Edit FAQ: ${item.question}`}
                                title="Edit FAQ"
                                onClick={() => openEdit(item)}
                              >
                                <IconPencil aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                className="sf-btn-icon sf-btn-danger"
                                aria-label={`Delete FAQ: ${item.question}`}
                                title="Delete FAQ"
                                onClick={() => handleDelete(item.id)}
                              >
                                <IconTrash aria-hidden="true" />
                              </button>
                            </div>
                          ) : null}

                          <IconChevronDown className="sf-faq__chevron" aria-hidden="true" />

                          <Accordion.Panel unstyled className="sf-faq__answer">
                            {answerToParagraphs(item.answer).length > 0 ? (
                              answerToParagraphs(item.answer).map((para, i) => (
                                <p key={i}>{para}</p>
                              ))
                            ) : (
                              <p>No answer provided yet.</p>
                            )}
                          </Accordion.Panel>
                        </Accordion.Item>
                      ))}
                    </Accordion>
                  </section>
                ))}

                <div className="sf-faq__callout">
                  <h2 className="sf-faq__callout-title">Can&apos;t find your answer?</h2>
                  <p className="sf-faq__callout-text">
                    Send us your question through the Feedback Form on the About Us page, or
                    contact the office directly.
                  </p>
                  <p className="sf-faq__callout-contact">
                    Contact Number:{' '}
                    <a href={`tel:${OFFICE_CONTACT.phone}`}>{OFFICE_CONTACT.phone}</a>
                    {' · '}
                    Email: <a href={`mailto:${OFFICE_CONTACT.email}`}>{OFFICE_CONTACT.email}</a>
                  </p>
                  <a className="btn-primary sf-btn--sm" href="/contact">
                    Go to About Us
                  </a>
                </div>
              </>
            )}
          </div>

          <aside className="sf-faq__aside" aria-label="Services and office location">
            <div className="sf-faq__card">
              <h2 className="sf-faq__card-title">Services</h2>
              <ul className="sf-faq__nav">
                {SERVICE_LINKS.map(([href, label]) => (
                  <li key={href}>
                    <a href={href}>{label}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sf-faq__card">
              <h2 className="sf-faq__card-title">Population Office Location</h2>
              <iframe
                className="sf-faq__map"
                title="San Fabian Population Office Location"
                src="https://www.google.com/maps?q=16.120723263859666,120.40280245009167&z=15&output=embed"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </aside>
        </div>
      </div>
    </div>

      <Modal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setEditingId(null);
        }}
        withCloseButton={false}
        centered
        size="xl"
        padding={0}
        zIndex={1000}
        classNames={{ content: 'sf-dlg' }}
        overlayProps={{ backgroundOpacity: 0.5, blur: 0, transitionProps: { duration: 150 } }}
        transitionProps={{ transition: 'fade', duration: 150 }}
      >
        <div className="sf-dlg__shell">
          <div className="sf-dlg__aside">
            <p className="sf-dlg__aside-title">Preview</p>
            <dl className="sf-dlg__preview-row">
              <dt>Topic</dt>
              <dd>{form.values.topic || 'General'}</dd>
            </dl>
            <dl className="sf-dlg__preview-row">
              <dt>Question</dt>
              <dd>{form.values.question || '—'}</dd>
            </dl>
            <dl className="sf-dlg__preview-row">
              <dt>Answer</dt>
              <dd style={{ whiteSpace: 'pre-wrap' }}>{form.values.answer || '—'}</dd>
            </dl>
          </div>

          <div className="sf-dlg__form">
            <div className="sf-dlg__header">
              <div>
                <p className="sf-dlg__eyebrow">FAQ / Inquiries</p>
                <h2 className="sf-dlg__title">{editingId ? 'Edit FAQ' : 'Add FAQ'}</h2>
              </div>
              <button
                type="button"
                className="sf-dlg__close"
                aria-label="Close"
                onClick={() => {
                  setModalOpened(false);
                  setEditingId(null);
                }}
              >
                <IconX width={20} height={20} aria-hidden="true" />
              </button>
            </div>

            <form
              onSubmit={form.onSubmit((values) => {
                handleSubmit(values).catch(() => {});
              })}
              style={{ display: 'contents' }}
            >
              <div className="sf-dlg__body">
                <Stack>
                  <Autocomplete
                    label="Topic"
                    placeholder="Type or select a topic"
                    data={topics || []}
                    value={form.values.topic}
                    onChange={(value) => form.setFieldValue('topic', value)}
                    searchable
                    clearable
                    comboboxProps={{ withinPortal: true, zIndex: 1200 }}
                  />
                  <TextInput label="Question" required {...form.getInputProps('question')} />
                  <Textarea label="Answer" required minRows={8} autosize {...form.getInputProps('answer')} />
                </Stack>
              </div>

              <div className="sf-dlg__footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setModalOpened(false);
                    setEditingId(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>

      <DeleteConfirmModal
        opened={deleteId != null}
        onCancel={() => { if (!deleteLoading) setDeleteId(null); }}
        onConfirm={async () => {
          if (!deleteId) return;
          setDeleteLoading(true);
          try {
            await deleteFaq(deleteId);
            showNotification({ title: 'Deleted', message: 'FAQ deleted', color: 'green' });
            setItems((prev) => prev.filter((x) => x.id !== deleteId));
            setDeleteId(null);
          } catch (err) {
            console.error(err);
            showNotification({ title: 'Error', message: 'Failed to delete FAQ', color: 'red' });
          } finally {
            setDeleteLoading(false);
          }
        }}
        confirmLabel="Delete FAQ"
        message="This FAQ will be permanently removed from the list. This action cannot be undone."
        loading={deleteLoading}
      />

    </>
  );
}
