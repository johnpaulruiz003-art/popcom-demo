import React, { useEffect, useMemo, useState } from 'react';
import {
  Stack,
  Group,
  Button,
  Table,
  Modal,
  TextInput,
  Textarea,
  FileInput,
  Progress,
  Loader,
  Pagination,
  Select
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { showNotification } from '@mantine/notifications';
import { DatePickerInput } from '@mantine/dates';
import { IconArchive, IconEye } from '@tabler/icons-react';

import { getNewsAdminList, createNews, updateNews, archiveNews, unarchiveNews } from '../../api/news.js';
import { socket } from '../../socket.js';
import { uploadNewsImage } from '../../api/uploads.js';
import { DeleteConfirmModal } from '../../components/common/DeleteConfirmModal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export function NewsAdmin() {
  const { user, isAdmin, isOfficer } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 7;
  const [summaryOpened, setSummaryOpened] = useState(false);
  const [summaryFilterType, setSummaryFilterType] = useState(''); // date | location | lead | status
  const [summaryDate, setSummaryDate] = useState(null);
  const [summaryLocation, setSummaryLocation] = useState('');
  const [summaryLead, setSummaryLead] = useState('');
  const [summaryStatus, setSummaryStatus] = useState('');
  const [summaryPage, setSummaryPage] = useState(1);
  const [zoomImageUrl, setZoomImageUrl] = useState(null);

  const form = useForm({
    initialValues: {
      title: '',
      content: '',
      imageFile: null
    },
    validate: {
      title: (v) => (String(v).trim() ? null : 'Title is required'),
      content: (v) => (String(v).trim() ? null : 'Content is required')
    }
  });

  const clearImagePreview = () => {
    if (imagePreviewUrl) {
      try { URL.revokeObjectURL(imagePreviewUrl); } catch (_) {}
    }
    setImagePreviewUrl(null);
  };

  const closeModal = () => {
    setModalOpened(false);
    setEditingId(null);
    form.reset();
    clearImagePreview();
    setUploadProgress(0);
    setFileInputKey((k) => k + 1);
  };

  useEffect(() => {
    const handler = () => fetchNews();
    socket.on('news:updated', handler);
    return () => socket.off('news:updated', handler);
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await getNewsAdminList({ page: 1, limit: 100 });
      setItems(res.data.data || []);
    } catch (err) {
      console.error(err);
      showNotification({ title: 'Error', message: 'Failed to load news', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews().catch(() => {});
  }, []);

  const openCreate = () => {
    setEditingId(null);
    form.setValues({ title: '', content: '', imageFile: null });
    clearImagePreview();
    setUploadProgress(0);
    setFileInputKey((k) => k + 1);
    setModalOpened(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    form.setValues({
      title: item.title || '',
      content: item.content || item.shortDescription || '',
      imageFile: null
    });
    clearImagePreview();
    setUploadProgress(0);
    setFileInputKey((k) => k + 1);
    setModalOpened(true);
  };

  const existingImageUrl = useMemo(() => {
    if (!editingId) return null;
    const found = items.find((n) => String(n.id) === String(editingId));
    return found?.imageUrl || null;
  }, [editingId, items]);

  const handleSubmit = async (values) => {
    const { hasErrors } = form.validate();
    if (hasErrors) return;

    try {
      let imageUrl = existingImageUrl;
      if (values.imageFile instanceof File) {
        setUploadProgress(1);
        const up = await uploadNewsImage(values.imageFile, { onProgress: (pct) => setUploadProgress(pct) });
        imageUrl = up?.data?.data?.publicUrl || null;
      }

      const payload = {
        title: values.title,
        content: values.content,
        imageUrl,
        isPublished: true
      };

      if (editingId) {
        await updateNews(editingId, payload);
        showNotification({ title: 'Saved', message: 'News updated', color: 'green' });
      } else {
        await createNews(payload);
        showNotification({ title: 'Created', message: 'News created', color: 'green' });
      }

      closeModal();
      await fetchNews();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.error?.message || 'Failed to save news';
      showNotification({ title: 'Error', message: msg, color: 'red' });
      setUploadProgress(0);
    }
  };

  const isPublishedItem = (n) => (typeof n.isPublished === 'boolean' ? n.isPublished : !!n.is_published);

  const handleArchive = async (id) => {
    try {
      await archiveNews(id);
      showNotification({ title: 'Archived', message: 'News archived.', color: 'green' });
      await fetchNews();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.error?.message || 'Failed to archive news';
      showNotification({ title: 'Error', message: msg, color: 'red' });
    }
  };

  const handleUnarchive = async (item) => {
    try {
      await unarchiveNews(item.id);
      showNotification({ title: 'Unarchived', message: 'News published again.', color: 'green' });
      await fetchNews();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.error?.message || 'Failed to unarchive news';
      showNotification({ title: 'Error', message: msg, color: 'red' });
    }
  };

  const getCurrentUserId = () => {
    if (!user) return null;
    return user.id ?? user.userId ?? null;
  };

  const isOwnedByCurrentUser = (n) => {
    const currentId = getCurrentUserId();
    if (!currentId) return false;
    const ownerId =
      n.createdById ??
      n.createdByUserId ??
      n.userId ??
      n.authorId ??
      n.createdBy ??
      null;
    if (ownerId == null) return false;
    return String(ownerId) === String(currentId);
  };

  const visibleItems = items.filter((n) => {
    if (showArchived) {
      return !isPublishedItem(n);
    }
    return isPublishedItem(n);
  });

  const filteredItems = visibleItems.filter((n) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      String(n.title || '').toLowerCase().includes(q) ||
      String(n.content || n.shortDescription || '').toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const summaryPageSize = 10;

  const summaryLocationOptions = Array.from(
    new Set(
      items
        .map((n) => {
          const locationVal = n.location || n.venue || '';
          return String(locationVal).trim();
        })
        .filter((v) => v !== '')
    )
  )
    .sort((a, b) => a.localeCompare(b))
    .map((loc) => ({ value: loc, label: loc }));

  const summaryLeadOptions = Array.from(
    new Set(
      items
        .map((n) => {
          const leadVal = n.lead || n.leader || n.facilitator || '';
          return String(leadVal).trim();
        })
        .filter((v) => v !== '')
    )
  )
    .sort((a, b) => a.localeCompare(b))
    .map((lead) => ({ value: lead, label: lead }));

  const summaryStatusOptions = Array.from(
    new Set(
      items
        .map((n) => (n.status != null ? String(n.status).trim() : ''))
        .filter((v) => v !== '')
    )
  )
    .sort((a, b) => a.localeCompare(b))
    .map((status) => ({ value: status, label: status }));

  const summaryFilteredItems = items.filter((n) => {
    if (!summaryFilterType) return true;

    const locationVal = n.location || n.venue || '';
    const leadVal = n.lead || n.leader || n.facilitator || '';
    const statusVal = n.status || '';

    if (summaryFilterType === 'date') {
      if (!summaryDate) return true;
      const created = n.created_at ? new Date(n.created_at) : (n.date ? new Date(n.date) : null);
      if (!created) return false;
      return (
        created.getFullYear() === summaryDate.getFullYear() &&
        created.getMonth() === summaryDate.getMonth() &&
        created.getDate() === summaryDate.getDate()
      );
    }

    if (summaryFilterType === 'location') {
      if (!summaryLocation) return true;
      return String(locationVal).trim() === String(summaryLocation).trim();
    }

    if (summaryFilterType === 'lead') {
      if (!summaryLead) return true;
      return String(leadVal).trim() === String(summaryLead).trim();
    }

    if (summaryFilterType === 'status') {
      if (!summaryStatus) return true;
      return String(statusVal).trim().toLowerCase() === String(summaryStatus).trim().toLowerCase();
    }

    return true;
  });

  const summaryTotalPages = Math.max(1, Math.ceil(summaryFilteredItems.length / summaryPageSize));
  const summaryCurrentPage = Math.min(summaryPage, summaryTotalPages);
  const summaryPagedItems = summaryFilteredItems.slice(
    (summaryCurrentPage - 1) * summaryPageSize,
    summaryCurrentPage * summaryPageSize
  );

  return (
    <div className="adm-page">
      <div className="adm-head">
        <div>
          <h1 className="adm-head__title">News</h1>
          <p className="adm-head__desc">
            Publish and manage news articles shown on the public portal.
          </p>
          <hr className="adm-head__rule" />
        </div>
        <div className="adm-head__toolbar">
          <TextInput
            className="adm-search"
            size="sm"
            placeholder="Search news..."
            aria-label="Search news"
            value={search}
            onChange={(e) => { setSearch(e.currentTarget.value); setPage(1); }}
          />
          <Button
            className="adm-btn adm-btn--secondary adm-btn--sm adm-btn--icon-mobile"
            aria-pressed={showArchived}
            leftSection={showArchived ? <IconEye size={16} /> : <IconArchive size={16} />}
            onClick={() => { setShowArchived((v) => !v); setPage(1); }}
            aria-label={showArchived ? 'Show active news' : 'Show archived news'}
          >
            <span className="adm-btn__label">{showArchived ? 'Showing archived' : 'Show archived'}</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="adm-page-loader"><Loader /></div>
      ) : (
        <>
          <div className="adm-table-wrap">
          <Table
            highlightOnHover
            verticalSpacing="xs"
            fontSize="sm"
          >
            <caption className="adm-cap">
              News articles, showing {filteredItems.length} of {items.length} entries.
            </caption>
            <Table.Thead>
              <Table.Tr>
                <Table.Th className="adm-table__no">No.</Table.Th>
                <Table.Th>Title</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Author</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {pagedItems.map((n, index) => {
                const rowNumber = (currentPage - 1) * pageSize + index + 1;
                return (
                  <Table.Tr key={n.id}>
                    <Table.Td className="adm-table__no">{rowNumber}</Table.Td>
                    <Table.Td width="20%" className="adm-table__wrap-any">{n.title}</Table.Td>
                  <Table.Td>
                    <span className="adm-table__desc">
                      {(() => {
                        const full = n.content || n.shortDescription || '';
                        return full.length > 200 ? `${full.slice(0, 200)}...` : full;
                      })()}
                    </span>
                  </Table.Td>
                  <Table.Td>{n.authorUsername || '-'}</Table.Td>
                  <Table.Td>
                    <Group gap={8} justify="flex-end" wrap="nowrap">
                      {(isAdmin || (isOfficer && isOwnedByCurrentUser(n))) && (
                        <Button
                          className="adm-btn adm-btn--secondary adm-btn--xs" onClick={() => openEdit(n)}
 >
                          Edit
                        </Button>
                      )}
                      {(isAdmin || (isOfficer && isOwnedByCurrentUser(n))) &&
                        (isPublishedItem(n) ? (
                          <Button
                            className="adm-btn adm-btn--secondary adm-act--archive adm-btn--xs" onClick={() => handleArchive(n.id)}
 >
                            Archive
                          </Button>
                        ) : (
                          <Button
                            className="adm-btn adm-btn--secondary adm-btn--xs" onClick={() => handleUnarchive(n)}
 >
                            Unarchive
                          </Button>
                        ))}
                    </Group>
                  </Table.Td>
                </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
          </div>

          {filteredItems.length > pageSize && (
            <div className="adm-pager">
              <span className="adm-pager__info">
                Showing {pagedItems.length} of {filteredItems.length} news articles
              </span>
              <Pagination
                size="md"
                value={currentPage}
                onChange={setPage}
                total={totalPages}
              />
            </div>
          )}
        </>
      )}


      <Modal
        className="adm-modal"
        opened={modalOpened}
        onClose={closeModal}
        withCloseButton={false}
        centered
        size="xl"
        padding={0}
        styles={{
          content: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
          },
          body: {
            padding: 0,
          },
        }}
        overlayProps={{ opacity: 1, color: '#050000ff' }}
      >
        <div className="card border-0 shadow-lg" style={{ borderRadius: '0.75rem' }}>
          <div className="row g-0 align-items-stretch">
          {/* Preview on the left */}
          <div
            className="col-md-5 d-none d-md-block bg-light"
            style={{ borderRight: '1px solid #e5e7eb' }}
          >
            <div className="h-100 w-100 p-4 d-flex flex-column justify-content-center align-items-center" align="center">
              <div className="mb-3 small text-muted w-100">Preview</div>
              {(() => {
                const currentUrl = existingImageUrl;
                const replacementUrl = imagePreviewUrl;

                if (!currentUrl && !replacementUrl) {
                  return (
                    <div
                      className="border rounded d-flex align-items-center justify-content-center text-muted"
                      style={{ width: '100%', maxWidth: 320, height: 160, fontSize: 12 }}
                    >
                      No image selected
                    </div>
                  );
                }

                return (
                  <div className="w-100 d-flex flex-column gap-3 align-items-center">
                    {currentUrl && (
                      <div className="w-100" style={{ maxWidth: 260 }}>
                        <div className="small text-muted mb-2"><b>Current image</b></div>
                        <img
                          src={currentUrl}
                          alt="Current news visual"
                          className="img-fluid rounded border"
                          style={{ maxHeight: 160, objectFit: 'cover', cursor: 'pointer' }}
                          onClick={() => setZoomImageUrl(currentUrl)}
                        />
                      </div>
                    )}
                    <br />
                    <br /> 
                    {replacementUrl && (
                      <div className="w-100" style={{ maxWidth: 260 }}>
                        <div className="small text-muted mb-2"><b>Replacement image</b></div>
                        <img
                          src={replacementUrl}
                          alt="Replacement news visual"
                          className="img-fluid rounded border"
                          style={{ maxHeight: 320, objectFit: 'cover', cursor: 'pointer' }}
                          onClick={() => setZoomImageUrl(replacementUrl)}
                        />
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Form on the right */}
          <div className="col-12 col-md-7 p-4 bg-white">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <div className="text-uppercase small text-muted mb-1">News</div>
                <h2 className="h5 mb-0">{editingId ? 'Edit News' : 'Add News'}</h2>
              </div>
              <button
                type="button"
                className="adm-iconbtn adm-iconbtn--neutral"
                aria-label="Close"
                onClick={closeModal}
              />
            </div>

            <form
              onSubmit={form.onSubmit((values) => {
                handleSubmit(values).catch(() => {});
              })}
            >
              <Stack>
                <TextInput label="Title" required {...form.getInputProps('title')} />
                <Textarea
                  label="Content"
                  required
                  minRows={14}
                  autosize={false}
                  styles={{ input: { maxHeight: 650, minHeight: 260, overflowY: 'auto' } }}
                  {...form.getInputProps('content')}
                />

                <FileInput
                  label={editingId ? 'Replace image (optional)' : 'Image (optional)'}
                  accept="image/*"
                  key={fileInputKey}
                  onChange={(file) => {
                    clearImagePreview();
                    if (file instanceof File) {
                      try {
                        setImagePreviewUrl(URL.createObjectURL(file));
                      } catch {
                        setImagePreviewUrl(null);
                      }
                    }
                    form.setFieldValue('imageFile', file || null);
                    setUploadProgress(0);
                  }}
                />

                {uploadProgress > 0 && uploadProgress < 100 && <Progress value={uploadProgress} />}

                <div className="d-flex justify-content-end gap-2 pt-2 mt-1 border-top">
                  <Button type="submit" className="adm-btn adm-btn--primary">Save changes</Button>
                </div>
              </Stack>
            </form>
          </div>
        </div>
        </div>
      </Modal>

      <Modal
        opened={!!zoomImageUrl}
        onClose={() => setZoomImageUrl(null)}
        centered
        size="xl"
        withCloseButton
        title="Image preview"
      >
        {zoomImageUrl && (
          <div className="w-100 d-flex justify-content-center">
            <img
              src={zoomImageUrl}
              alt="Zoomed news visual"
              className="img-fluid rounded border"
              style={{ maxHeight: '70vh', objectFit: 'contain' }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
