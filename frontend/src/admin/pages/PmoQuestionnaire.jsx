import React, { useEffect, useMemo, useState } from 'react';
import { Stack, Button, Modal, TextInput, Select, Loader, Checkbox } from '@mantine/core';
import { showNotification } from '@mantine/notifications';

import { createPmoAdminQuestion, getPmoAdminQuestionnaire, updatePmoAdminQuestion } from '../../api/pmoAdmin.js';
import { socket } from '../../socket.js';

export function PmoQuestionnaire() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    question_text: '',
    question_type: 'Standalone',
    parent_question_id: null,
    sort_order: 0,
    is_invisible: false
  });

  const resetForm = () => {
    setEditing(null);
    setForm({ question_text: '', question_type: 'Standalone', parent_question_id: null, sort_order: 0, is_invisible: false });
  };

  const fillerOptions = useMemo(() => {
    const excludeId = editing?.questionID;
    return (rows || [])
      .filter((q) => q.question_type === 'Filler')
      .filter((q) => (excludeId ? q.questionID !== excludeId : true))
      .sort((a, b) => (a.sort_order - b.sort_order) || (a.questionID - b.questionID))
      .map((q) => ({
        value: String(q.questionID),
        label: `${q.sort_order} - ${q.question_text}`
      }));
  }, [rows, editing]);

  const normalizedForm = useMemo(() => {
    const type = form.question_type;
    const parentAllowed = type === 'Sub-question' || type === 'Filler' || type === 'Standalone';
    return {
      ...form,
      parent_question_id: parentAllowed ? form.parent_question_id : null
    };
  }, [form]);

  useEffect(() => {
    const handler = () => load();
    socket.on('pmo:updated', handler);
    return () => socket.off('pmo:updated', handler);
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getPmoAdminQuestionnaire();
      setRows(res.data.data || []);
    } catch (e) {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (normalizedForm.question_type === 'Sub-question' && !normalizedForm.parent_question_id) {
        showNotification({ title: 'Validation', message: 'Parent question is required for Sub-question.', color: 'red' });
        return;
      }

      if (editing) {
        await updatePmoAdminQuestion(editing.questionID, normalizedForm);
        showNotification({ title: 'Saved', message: 'Question updated.', color: 'green' });
      } else {
        await createPmoAdminQuestion(normalizedForm);
        showNotification({ title: 'Saved', message: 'Question created.', color: 'green' });
      }

      setModalOpen(false);
      resetForm();
      await load();
    } catch (error) {
      const msg = error?.response?.data?.error?.message || 'Failed to create question';
      showNotification({ title: 'Error', message: msg, color: 'red' });
    }
  };

  const byParent = useMemo(() => {
    const map = new Map();
    for (const q of rows || []) {
      const key = q.parent_question_id ?? null;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(q);
    }
    for (const [k, list] of map.entries()) {
      list.sort((a, b) => (a.sort_order - b.sort_order) || (a.questionID - b.questionID));
      map.set(k, list);
    }
    return map;
  }, [rows]);

  const openAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (q) => {
    setEditing(q);
    setForm({
      question_text: q.question_text,
      question_type: q.question_type,
      parent_question_id: q.parent_question_id ?? null,
      sort_order: q.sort_order,
      is_invisible: Boolean(q.is_invisible)
    });
    setModalOpen(true);
  };

  // Flat nav rows: navy type, no gray card chrome. Filler rows are emphasised,
  // sub-questions are indented under their parent.
  const renderNode = (q, depth, parentIsFiller) => {
    const children = byParent.get(q.questionID) || [];
    const isFiller = q.question_type === 'Filler';
    const isSub = q.question_type === 'Sub-question';

    const rowClass = [
      'adm-qtree__row',
      depth === 0 ? 'adm-qtree__row--root' : '',
      isFiller ? 'adm-qtree__row--filler' : '',
      isSub ? 'adm-qtree__row--sub' : ''
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        key={q.questionID}
        className={`adm-qtree__node adm-qtree__node--depth-${Math.min(depth, 5)}`}
      >
        <div className={rowClass}>
          <div className="adm-qtree__text">
            <span className="adm-qtree__label">
              {isSub || (parentIsFiller && !isFiller) ? `• ${q.question_text}` : q.question_text}
            </span>
            <span className="adm-qtree__type">{q.question_type}</span>
          </div>
          <button
            type="button"
            className="adm-btn-secondary"
            onClick={() => openEdit(q)}
            aria-label={`Edit question: ${q.question_text}`}
          >
            Edit
          </button>
        </div>

        {children.length > 0 ? (
          <div className="adm-qtree__children">
            {children.map((child) => renderNode(child, depth + 1, isFiller || parentIsFiller))}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="adm-page">
      <div className="adm-head">
        <div>
          <h1 className="adm-head__title">PMO &ndash; Questionnaire</h1>
          <p className="adm-head__desc">Manage PMO questionnaire items.</p>
          <hr className="adm-head__rule" />
        </div>
        <div className="adm-head__toolbar">
          <button type="button" className="adm-btn-primary" onClick={openAdd}>
            Add Question
          </button>
        </div>
      </div>

      {loading ? (
        <div className="adm-page-loader"><Loader size="sm" /></div>
      ) : rows.length === 0 ? (
        <div className="adm-empty">No questions found.</div>
      ) : (
        <div className="adm-qtree">
          {(byParent.get(null) || []).map((q) => renderNode(q, 0, false))}
        </div>
      )}

      <Modal
        className="adm-modal"
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title={editing ? 'Edit Question' : 'Add Question'}
        centered
      >
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="Question"
              value={form.question_text}
              onChange={(e) => setForm((f) => ({ ...f, question_text: e.currentTarget.value }))}
              required
            />
            <Select
              label="Type"
              data={[
                { value: 'Standalone', label: 'Standalone' },
                { value: 'Filler', label: 'Filler' },
                { value: 'Sub-question', label: 'Sub-question' }
              ]}
              value={form.question_type}
              onChange={(v) => {
                const nextType = v;
                setForm((f) => ({
                  ...f,
                  question_type: nextType,
                  parent_question_id: nextType === 'Sub-question' || nextType === 'Filler' ? f.parent_question_id : null
                }));
              }}
            />
            <Select
              label="Parent question (optional)"
              placeholder="None"
              searchable
              clearable
              data={fillerOptions}
              required={form.question_type === 'Sub-question'}
              value={form.parent_question_id ? String(form.parent_question_id) : null}
              onChange={(v) => setForm((f) => ({ ...f, parent_question_id: v ? Number(v) : null }))}
            />
            <Select
              label="Sort order"
              data={[
                { value: '0', label: '0' },
                { value: '1', label: '1' },
                { value: '2', label: '2' },
                { value: '3', label: '3' },
                { value: '4', label: '4' },
                { value: '5', label: '5' },
                { value: '6', label: '6' },
                { value: '7', label: '7' },
                { value: '8', label: '8' },
                { value: '9', label: '9' },
                { value: '10', label: '10' }
              ]}
              value={String(form.sort_order)}
              onChange={(v) => {
                const nextOrder = Number(v || 0);
                setForm((f) => ({ ...f, sort_order: nextOrder }));
              }}
            />
            <Checkbox
              label="Invisible (hide from questionnaire and make optional)"
              checked={form.is_invisible}
              onChange={(event) =>
                setForm((f) => ({ ...f, is_invisible: event.currentTarget.checked }))
              }
            />
            <div className="adm-dlg__footer">
              <Button
 onClick={() => {
 setModalOpen(false);
 resetForm();
 }}
  className="adm-btn adm-btn--neutral">
                Cancel
              </Button>
              <Button type="submit" className="adm-btn adm-btn--primary">Save</Button>
            </div>
          </Stack>
        </form>
      </Modal>
    </div>
  );
}
