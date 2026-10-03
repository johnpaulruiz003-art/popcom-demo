import React, { useMemo, useState } from 'react';
import { Text, Stack, TextInput, Textarea, Button, Modal, Select, Loader, Center } from '@mantine/core';
import {
  IconBuilding, IconPhone, IconMail, IconUser,
  IconLock, IconCamera, IconPlus, IconPencil, IconTrash, IconX,
  IconCheck, IconAlertCircle
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { showNotification } from '@mantine/notifications';

import { submitFeedback } from '../api/feedback.js';
import { getHierarchy, createHierarchyEntry, updateHierarchyEntry, deleteHierarchyEntry } from '../api/hierarchy.js';
import { getMainOffice, updateMainOffice } from '../api/offices.js';
import { uploadAboutUsImage } from '../api/uploads.js';
import { useAuth } from '../context/AuthContext.jsx';
import { LoginModal } from '../components/auth/LoginModal.jsx';
import { RegisterModal } from '../components/auth/RegisterModal.jsx';
import aboutUsImage from '../content/About Us/AboutUs.jpg';
import sanFabianLogo from '../content/About Us/SanFabian-Logo.png';
import '../styles/contactPage.css';
import '../styles/faqPage.css';
import '../styles/dialog.css';

const HIERARCHY_POSITIONS = [
  'Mayor',
  'Vice Mayor',
  'Population Office Head',
  'Population Office Staff',
  'Barangay Representative'
];

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

/**
 * Split a hierarchy name of the form "Bessie Disu (Alacan)" into the person
 * and the barangay. Display-time only - the stored name is never changed.
 * Returns null when the string does not match, so the caller can fall back to
 * showing the raw name.
 */
const splitNameAndBarangay = (rawName) => {
  const match = /^(.*?)\s*\((.+)\)\s*$/.exec(String(rawName || ''));
  if (!match) return null;
  const name = match[1].trim();
  const barangay = match[2].trim();
  if (!name || !barangay) return null;
  return { name, barangay };
};

export function ContactPage() {
  const { user, accessToken, isAdmin } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [hierarchy, setHierarchy] = useState([]);
  const [hierarchyLoading, setHierarchyLoading] = useState(false);
  const [hierarchyModalMode, setHierarchyModalMode] = useState(null); // 'add' | 'edit' | 'delete'
  const [hierarchyModalOpen, setHierarchyModalOpen] = useState(false);
  const [hierarchySaving, setHierarchySaving] = useState(false);
  const [selectedHierarchyId, setSelectedHierarchyId] = useState(null);
  const [hierarchyName, setHierarchyName] = useState('');
  const [hierarchyPosition, setHierarchyPosition] = useState('');
  const [feedbackConfirmOpen, setFeedbackConfirmOpen] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [office, setOffice] = useState(null);
  const [officeLoading, setOfficeLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [officeEditOpen, setOfficeEditOpen] = useState(false);

  const officeForm = useForm({
    initialValues: {
      officeName: '',
      address: '',
      contactNumber: '',
      email: '',
      officeHead: ''
    },
    validate: {
      officeName: (v) => (v.trim().length === 0 ? 'Office name is required' : null),
      address: (v) => (v.trim().length === 0 ? 'Address is required' : null),
      contactNumber: (v) => (v.trim().length === 0 ? 'Contact number is required' : null),
      email: (v) => (v.trim().length === 0 ? 'Email is required' : null),
      officeHead: (v) => (v.trim().length === 0 ? 'Office head is required' : null)
    }
  });

  const initialUser = useMemo(() => ({
    fullName: user?.fullName || '',
    email: user?.email || '',
    contactNumber: user?.contactNumber || '',
    barangay: user?.barangay || ''
  }), [user]);

  const form = useForm({
    initialValues: {
      fullName: initialUser.fullName,
      email: initialUser.email,
      contactNumber: initialUser.contactNumber,
      barangay: initialUser.barangay,
      message: ''
    },
    validate: {
      message: (v) => (v.trim().length === 0 ? 'Please enter your message' : null)
    }
  });

  // Sync read-only user fields when auth state changes (e.g., after login)
  React.useEffect(() => {
    form.setValues({
      fullName: initialUser.fullName,
      email: initialUser.email,
      contactNumber: initialUser.contactNumber,
      barangay: initialUser.barangay,
      message: form.values.message
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUser.fullName, initialUser.email, initialUser.contactNumber, initialUser.barangay]);

  // Load hierarchy data
  React.useEffect(() => {
    const loadHierarchy = async () => {
      setHierarchyLoading(true);
      try {
        const res = await getHierarchy();
        setHierarchy(res.data?.data || []);
      } catch (err) {
        console.error('Failed to load hierarchy', err);
      } finally {
        setHierarchyLoading(false);
      }
    };
    loadHierarchy().catch(() => {});
  }, []);

  const handleReplaceImage = async () => {
    if (!isAdmin || imageUploading) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async () => {
      const file = input.files && input.files[0];
      if (!file) return;

      try {
        setImageUploading(true);
        const uploadRes = await uploadAboutUsImage(file);
        const publicUrl = uploadRes?.data?.data?.publicUrl;
        if (!publicUrl) {
          showNotification({ title: 'Error', message: 'Failed to upload image.', color: 'red' });
          return;
        }

        const payload = { officeImageUrl: publicUrl };
        const updateRes = await updateMainOffice(payload);
        setOffice(updateRes.data?.data || null);
        showNotification({ title: 'Updated', message: 'Office image updated.', color: 'green' });
      } catch (err) {
        console.error('Failed to replace office image', err);
        const msg = err?.response?.data?.error?.message || 'Failed to replace office image.';
        showNotification({ title: 'Error', message: msg, color: 'red' });
      } finally {
        setImageUploading(false);
      }
    };

    input.click();
  };

  const openOfficeEdit = () => {
    if (office) {
      officeForm.setValues({
        officeName: office.officeName || '',
        address: office.address || '',
        contactNumber: office.contactNumber || '',
        email: office.email || '',
        officeHead: office.officeHead || ''
      });
    }
    setOfficeEditOpen(true);
  };

  const handleOfficeSave = async (values) => {
    try {
      const payload = {
        officeName: values.officeName,
        address: values.address,
        contactNumber: values.contactNumber,
        email: values.email,
        officeHead: values.officeHead
      };

      const res = await updateMainOffice(payload);
      setOffice(res.data?.data || null);
      showNotification({ title: 'Saved', message: 'Office details updated.', color: 'green' });
      setOfficeEditOpen(false);
    } catch (err) {
      console.error('Failed to update office details', err);
      const msg = err?.response?.data?.error?.message || 'Failed to update office details.';
      showNotification({ title: 'Error', message: msg, color: 'red' });
    }
  };

  // Load main office contact info
  React.useEffect(() => {
    const loadOffice = async () => {
      setOfficeLoading(true);
      try {
        const res = await getMainOffice();
        setOffice(res.data?.data || null);
        const data = res.data?.data;
        if (data) {
          officeForm.setValues({
            officeName: data.officeName || '',
            address: data.address || '',
            contactNumber: data.contactNumber || '',
            email: data.email || '',
            officeHead: data.officeHead || ''
          });
        }
      } catch (err) {
        console.error('Failed to load office info', err);
      } finally {
        setOfficeLoading(false);
      }
    };

    loadOffice().catch(() => {});
  }, []);

  const handleSubmit = async (values) => {
    try {
      // require authentication
      if (!accessToken) {
        setLoginOpen(true);
        return;
      }

      setFeedbackSubmitting(true);
      setFeedbackMessage(null);

      // Submit only the message; backend attaches userID from token
      await submitFeedback({ message: values.message });
      setFeedbackMessage({ type: 'success', text: 'Thank you for your feedback. We will review your message shortly.' });
      form.reset();
    } catch (err) {
      console.error(err);
      setFeedbackMessage({ type: 'error', text: 'Failed to send feedback. Please try again.' });
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const openHierarchyModal = (mode) => {
    setHierarchyModalMode(mode);
    setHierarchySaving(false);

    if (mode === 'add') {
      setSelectedHierarchyId(null);
      setHierarchyName('');
      setHierarchyPosition('');
    } else {
      setSelectedHierarchyId(null);
      setHierarchyName('');
      setHierarchyPosition('');
    }

    setHierarchyModalOpen(true);
  };

  const closeHierarchyModal = () => {
    setHierarchyModalOpen(false);
    setHierarchyModalMode(null);
    setSelectedHierarchyId(null);
    setHierarchyName('');
    setHierarchyPosition('');
  };

  const extractBarangay = (fullName) => {
    if (!fullName) return '';
    const start = fullName.indexOf('(');
    const end = fullName.indexOf(')', start + 1);
    if (start === -1 || end === -1) return fullName;
    return fullName.slice(start + 1, end).trim();
  };

  const sortedHierarchyForOptions = [...hierarchy].sort((a, b) =>
    extractBarangay(a.name).localeCompare(extractBarangay(b.name))
  );

  const hierarchyOptions = sortedHierarchyForOptions.map((item) => ({
    value: String(item.id),
    label: `${item.position}: ${item.name}`
  }));

  const handleHierarchyPrimaryChange = (idValue) => {
    setSelectedHierarchyId(idValue || null);
    const found = hierarchy.find((h) => String(h.id) === String(idValue));
    if (found) {
      setHierarchyName(found.name || '');
      setHierarchyPosition(found.position || '');
    } else {
      setHierarchyName('');
      setHierarchyPosition('');
    }
  };

  const submitHierarchy = async () => {
    try {
      setHierarchySaving(true);

      if (hierarchyModalMode === 'add') {
        if (!hierarchyName.trim() || !hierarchyPosition) return;
        await createHierarchyEntry({ name: hierarchyName.trim(), position: hierarchyPosition });
      } else if (hierarchyModalMode === 'edit') {
        if (!selectedHierarchyId || !hierarchyName.trim() || !hierarchyPosition) return;
        await updateHierarchyEntry(selectedHierarchyId, { name: hierarchyName.trim(), position: hierarchyPosition });
      } else if (hierarchyModalMode === 'delete') {
        if (!selectedHierarchyId) return;
        await deleteHierarchyEntry(selectedHierarchyId);
      }

      const res = await getHierarchy();
      setHierarchy(res.data?.data || []);
      closeHierarchyModal();
      showNotification({
        title: 'Saved',
        message:
          hierarchyModalMode === 'add'
            ? 'Hierarchy entry added'
            : hierarchyModalMode === 'edit'
            ? 'Hierarchy entry updated'
            : 'Hierarchy entry deleted',
        color: 'green'
      });
    } catch (err) {
      console.error('Failed to save hierarchy', err);
      const msg = err?.response?.data?.error?.message || 'Failed to save hierarchy entry';
      showNotification({ title: 'Error', message: msg, color: 'red' });
    } finally {
      setHierarchySaving(false);
    }
  };

  const mayor = hierarchy.find((h) => h.position === 'Mayor');
  const viceMayor = hierarchy.find((h) => h.position === 'Vice Mayor');
  const head = hierarchy.find((h) => h.position === 'Population Office Head');
  const staffMembers = hierarchy.filter((h) => h.position === 'Population Office Staff');
  const barangayReps = hierarchy
    .filter((h) => h.position === 'Barangay Representative')
    .sort((a, b) => extractBarangay(a.name).localeCompare(extractBarangay(b.name)));

  return (
    <>
    <div className="sf-about">
      <div className="sf-about__container">
        <div className="sf-about__grid">
        <div className="sf-about__main">
          <div className="sf-about__hero">
            <div className="sf-about__hero-frame">
              <img
                className="sf-about__hero-img"
                src={office?.officeImageUrl || aboutUsImage}
                alt="Staff of the Municipal Population Office of San Fabian"
              />
              {isAdmin && (
                <button
                  type="button"
                  className="sf-btn-sm sf-btn-light sf-about__replace"
                  onClick={handleReplaceImage}
                  disabled={imageUploading}
                >
                  <IconCamera width={16} height={16} aria-hidden="true" />
                  {imageUploading ? 'Uploading...' : 'Replace'}
                </button>
              )}
            </div>
          </div>

          <Stack spacing="sm">
            <div>
              <h1 className="sf-about__title">
                About Our <span className="sf-about__title-accent">Municipal Population Office</span>
              </h1>
              <hr className="sf-about__rule" />
            </div>
            <div className="sf-about__prose">
              <p>
                The <strong>Municipal Population Office (MPO) of San Fabian</strong> serves as
                the primary frontline department dedicated to managing and implementing the
                <strong> Philippine Population and Development Program (PPDP)</strong> at the
                local level.
              </p>
              <p>
                We believe that a well-informed and empowered community is the foundation of a resilient San Fabian.
                Our work focuses on the intersection of people, resources, and environment to ensure that every
                San Fabianense is accounted for and supported.
              </p>
            </div>

            <hr className="sf-about__divider" />

            <div className="sf-about__card">
              <h2 className="sf-about__h2">Mission &amp; Vision</h2>
              <h3 className="sf-about__h3">Our Vision</h3>
              <div className="sf-about__statement">
                <p>
                  &quot;We envision a progressive and empowered San Fabian where every family is well-informed and capable of making responsible decisions regarding their size and well-being, leading to a high quality of life within a sustainable and ecologically balanced community.&quot;
                </p>
              </div>
              <h3 className="sf-about__h3">Our Mission</h3>
              <div className="sf-about__statement">
                <p>
                  &quot;To provide comprehensive population and development services through the integration of Responsible Parenthood and Family Planning (RPFP), Adolescent Health and Development (AHD), and Population-Development (POPDEV) strategies. We commit to strengthening the capacity of every San Fabianense to contribute to and benefit from the municipality&rsquo;s socio-economic progress.&quot;
                </p>
              </div>
            </div>

            <hr className="sf-about__divider" />

            <h2 className="sf-about__h2">Core Programs &amp; Services</h2>
            <p className="sf-about__prose">
              The MPO leads several key program areas to support San Fabian families and communities:
            </p>
            <ul className="sf-about__list">
              <li>
                <strong>Responsible Parenthood &amp; Family Planning (RPFP)</strong> – Providing education and access to family
                planning methods to help couples achieve their desired family size.
              </li>
              <li>
                <strong>Adolescent Health and Development (AHD)</strong> – Youth-focused initiatives aimed at preventing
                teenage pregnancy and promoting healthy lifestyle choices among the San Fabian youth.
              </li>
              <li>
                <strong>Pre-Marriage Orientation and Counseling (PMOC)</strong> – Mandatory sessions for engaged couples to
                prepare them for the psychological and social responsibilities of married life.
              </li>
              <li>
                <strong>Population Data Management</strong> – Maintaining the Municipal Population Information System to help
                the local government unit (LGU) make informed decisions for infrastructure and social services.
              </li>
            </ul>

            <h3 className="sf-about__h3" style={{ marginTop: 24 }}>Why Population Matters</h3>
            <p className="sf-about__prose">
              Population management is not just about numbers; it is about human development. By understanding our
              demographics, we can:
            </p>
            <ul className="sf-about__list">
              <li>Ensure there are enough classrooms for our students.</li>
              <li>Optimize healthcare delivery to our barangays.</li>
              <li>Support the economic productivity of our labor force.</li>
            </ul>
          </Stack>
        </div>
            

            <aside className="sf-about__aside" aria-label="Contact, feedback and office location">
            <div className="sf-about__card">
              <div className="sf-about__card-head">
                <h2 className="sf-about__card-title">Contact Us</h2>
                {isAdmin && (
                  <button
                    type="button"
                    className="sf-btn-sm"
                    onClick={openOfficeEdit}
                  >
                    <IconPencil width={16} height={16} aria-hidden="true" />
                    Edit
                  </button>
                )}
              </div>

              {officeLoading ? (
                <p className="sf-about__contact-text">Loading office information...</p>
              ) : office ? (
                <>
                  <p className="sf-about__contact-office">{office.officeName}</p>
                  <ul className="sf-about__contact-list">
                    <li className="sf-about__contact-row">
                      <IconBuilding className="sf-about__contact-icon" aria-hidden="true" />
                      <span className="sf-about__contact-text">
                        <span className="sf-about__contact-label">Address</span>
                        <span className="sf-about__contact-value">{office.address}</span>
                      </span>
                    </li>
                    <li className="sf-about__contact-row">
                      <IconPhone className="sf-about__contact-icon" aria-hidden="true" />
                      <span className="sf-about__contact-text">
                        <span className="sf-about__contact-label">Contact number</span>
                        <span className="sf-about__contact-value">
                          <a href={`tel:${office.contactNumber}`}>{office.contactNumber}</a>
                        </span>
                      </span>
                    </li>
                    <li className="sf-about__contact-row">
                      <IconMail className="sf-about__contact-icon" aria-hidden="true" />
                      <span className="sf-about__contact-text">
                        <span className="sf-about__contact-label">Email</span>
                        <span className="sf-about__contact-value">
                          <a href={`mailto:${office.email}`}>{office.email}</a>
                        </span>
                      </span>
                    </li>
                    <li className="sf-about__contact-row">
                      <IconUser className="sf-about__contact-icon" aria-hidden="true" />
                      <span className="sf-about__contact-text">
                        <span className="sf-about__contact-label">Office Head</span>
                        <span className="sf-about__contact-value">{office.officeHead}</span>
                      </span>
                    </li>
                  </ul>
                </>
              ) : null}
            </div>

                <div className="sf-about__card">
              <h2 className="sf-about__card-title">Feedback Form</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const result = form.validate();
                  if (result.hasErrors) return;
                  setFeedbackConfirmOpen(true);
                }}
              >
                <Stack>
                  <div className="sf-about__field sf-about__field--locked">
                    <TextInput
                      label="Full Name"
                      value={form.values.fullName}
                      readOnly
                      disabled
                      rightSection={<IconLock className="sf-about__lock" aria-hidden="true" />}
                    />
                  </div>
                  <div className="sf-about__field sf-about__field--locked">
                    <TextInput
                      label="Email"
                      value={form.values.email}
                      readOnly
                      disabled
                      rightSection={<IconLock className="sf-about__lock" aria-hidden="true" />}
                    />
                  </div>
                  <div className="sf-about__field sf-about__field--locked">
                    <TextInput
                      label="Contact Number"
                      value={form.values.contactNumber}
                      readOnly
                      disabled
                      rightSection={<IconLock className="sf-about__lock" aria-hidden="true" />}
                    />
                  </div>
                  <div
                    className={
                      isAdmin ? 'sf-about__field' : 'sf-about__field sf-about__field--locked'
                    }
                  >
                    <TextInput
                      label="Barangay"
                      value={form.values.barangay}
                      readOnly={!isAdmin}
                      disabled={!isAdmin}
                      rightSection={
                        isAdmin ? null : <IconLock className="sf-about__lock" aria-hidden="true" />
                      }
                      onChange={(event) => {
                        if (isAdmin) {
                          form.setFieldValue('barangay', event.currentTarget.value);
                        }
                      }}
                    />
                  </div>
                  <div className="sf-about__field">
                    <Textarea
                      label="Message"
                      placeholder="Your feedback, inquiry, or concern"
                      required
                      minRows={4}
                      {...form.getInputProps('message')}
                    />
                  </div>
                  {feedbackMessage && (
                    <div
                      className={`sf-about__alert sf-about__alert--${feedbackMessage.type}`}
                      role={feedbackMessage.type === 'error' ? 'alert' : 'status'}
                    >
                      {feedbackMessage.type === 'success' ? (
                        <IconCheck aria-hidden="true" />
                      ) : (
                        <IconAlertCircle aria-hidden="true" />
                      )}
                      <span>{feedbackMessage.text}</span>
                    </div>
                  )}
                  <button
                    type="submit"
                    className="sf-btn-submit"
                    disabled={feedbackSubmitting}
                  >
                    {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </Stack>
              </form>
            </div>

                <div className="sf-about__seal">
              <img
                className="sf-about__seal-img"
                src={sanFabianLogo}
                alt="Official seal of the Municipality of San Fabian"
              />
            </div>

            <div className="sf-about__card">
              <h2 className="sf-about__card-title">Services</h2>
              <ul className="sf-about__nav">
                {SERVICE_LINKS.map(([href, label]) => (
                  <li key={href}>
                    <a href={href}>{label}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sf-about__card">
              <h2 className="sf-about__card-title">Population Office Location</h2>
              <iframe
                className="sf-about__map"
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
                <section className="org-chart" aria-labelledby="org-chart-title">
          <div className="org-chart__head">
            <div>
              <h2 className="org-chart__title" id="org-chart-title">
                Organization Hierarchy
              </h2>
              <p className="org-chart__sub">
                Visual overview of the Municipal Population Office leadership and support structure.
              </p>
            </div>
            {isAdmin && (
              <div className="org-chart__actions">
                <button type="button" className="sf-btn-sm" onClick={() => openHierarchyModal('add')}>
                  <IconPlus width={16} height={16} aria-hidden="true" />
                  Add
                </button>
                <button type="button" className="sf-btn-sm" onClick={() => openHierarchyModal('edit')}>
                  <IconPencil width={16} height={16} aria-hidden="true" />
                  Edit
                </button>
                <button
                  type="button"
                  className="sf-btn-sm sf-btn-danger"
                  onClick={() => openHierarchyModal('delete')}
                >
                  <IconTrash width={16} height={16} aria-hidden="true" />
                  Delete
                </button>
              </div>
            )}
          </div>

          {hierarchyLoading ? (
            <Center py="sm">
              <Loader size="sm" />
            </Center>
          ) : (
            <>
              {/* Levels 1-3: one node per row, stacked and connected. */}
              <ul className="org-chart__level">
                <li className="org-chart__node org-chart__node--top">
                  <span className="org-chart__name">{mayor?.name || '\u2014'}</span>
                  <span className="org-chart__role">Mayor</span>
                </li>
              </ul>

              <div className="org-chart__connector" aria-hidden="true" />

              <ul className="org-chart__level">
                <li className="org-chart__node org-chart__node--top">
                  <span className="org-chart__name">{viceMayor?.name || '\u2014'}</span>
                  <span className="org-chart__role">Vice Mayor</span>
                </li>
              </ul>

              <div className="org-chart__connector" aria-hidden="true" />

              <ul className="org-chart__level">
                <li className="org-chart__node org-chart__node--top">
                  <span className="org-chart__name">{head?.name || '\u2014'}</span>
                  <span className="org-chart__role">Population Office Head</span>
                </li>
              </ul>

              <div className="org-chart__connector" aria-hidden="true" />

              {/* Level 4: office staff. The role is carried by this group
                  heading so it is not repeated on every card. */}
              {staffMembers.length > 0 && (
                <h3 className="org-chart__heading">
                  Population Office Staff{' '}
                  <span className="org-chart__heading-count">({staffMembers.length})</span>
                </h3>
              )}
              {staffMembers.length === 0 ? (
                <ul className="org-chart__level">
                  <li className="org-chart__node org-chart__node--staff">
                    <span className="org-chart__name">&mdash;</span>
                    <span className="org-chart__role">Population Office Staff</span>
                  </li>
                </ul>
              ) : (
                <ul className="org-chart__level">
                  {staffMembers.map((staff) => (
                    <li key={staff.id} className="org-chart__node org-chart__node--staff">
                      <span className="org-chart__name">{staff.name}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="org-chart__connector" aria-hidden="true" />

              {/* Level 5: barangay representatives, one per barangay. */}
              {barangayReps.length > 0 && (
                <h3 className="org-chart__heading">
                  Barangay Representatives{' '}
                  <span className="org-chart__heading-count">({barangayReps.length})</span>
                </h3>
              )}
              <ul className="org-chart__level">
                {barangayReps.map((rep) => {
                  const split = splitNameAndBarangay(rep.name);
                  return (
                    <li key={rep.id} className="org-chart__node org-chart__node--brgy">
                      <span className="org-chart__name">
                        {split ? split.name : rep.name}
                      </span>
                      {split ? (
                        <span className="org-chart__role">Brgy. {split.barangay}</span>
                      ) : (
                        /* Regex did not match: keep the raw name and show the
                           role so no information is lost. */
                        <span className="org-chart__role">Barangay Representative</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>

          <LoginModal
            opened={loginOpen}
            onClose={() => setLoginOpen(false)}
            redirectTo="/contact"
            onOpenRegister={() => {
              setLoginOpen(false);
              setRegisterOpen(true);
            }}
          />

          <RegisterModal opened={registerOpen} onClose={() => setRegisterOpen(false)} />

          {/* Feedback confirmation modal */}
          <Modal
            opened={feedbackConfirmOpen}
            onClose={() => setFeedbackConfirmOpen(false)}
            withCloseButton={false}
            centered
            size="sm"
            radius="md"
            padding={0}
            zIndex={1000}
            classNames={{ content: 'sf-dlg' }}
            overlayProps={{ backgroundOpacity: 0.5, blur: 0, transitionProps: { duration: 150 } }}
            transitionProps={{ transition: 'fade', duration: 150 }}
          >
            <div className="sf-dlg__form">
              <div className="sf-dlg__header">
                <div>
                  <p className="sf-dlg__eyebrow">Feedback Form</p>
                  <h2 className="sf-dlg__title">Are you sure?</h2>
                </div>
                <button
                  type="button"
                  className="sf-dlg__close"
                  aria-label="Close"
                  onClick={() => setFeedbackConfirmOpen(false)}
                >
                  <IconX width={20} height={20} aria-hidden="true" />
                </button>
              </div>

              <div className="sf-dlg__body">
                <Text size="sm" c="dimmed">
                  Are you sure you want to submit this feedback? This action cannot be undone.
                </Text>
              </div>

              <div className="sf-dlg__footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setFeedbackConfirmOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    setFeedbackConfirmOpen(false);
                    handleSubmit(form.values).catch(() => {});
                  }}
                >
                  Submit feedback
                </button>
              </div>
            </div>
          </Modal>

          {isAdmin && (
            <Modal
              opened={officeEditOpen}
              onClose={() => setOfficeEditOpen(false)}
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
                    <dt>Office name</dt>
                    <dd>{officeForm.values.officeName || '\u2014'}</dd>
                  </dl>
                  <dl className="sf-dlg__preview-row">
                    <dt>Address</dt>
                    <dd>{officeForm.values.address || '\u2014'}</dd>
                  </dl>
                  <dl className="sf-dlg__preview-row">
                    <dt>Contact number</dt>
                    <dd>{officeForm.values.contactNumber || '\u2014'}</dd>
                  </dl>
                  <dl className="sf-dlg__preview-row">
                    <dt>Email</dt>
                    <dd>{officeForm.values.email || '\u2014'}</dd>
                  </dl>
                  <dl className="sf-dlg__preview-row">
                    <dt>Office head</dt>
                    <dd>{officeForm.values.officeHead || '\u2014'}</dd>
                  </dl>
                </div>

                <div className="sf-dlg__form">
                  <div className="sf-dlg__header">
                    <div>
                      <p className="sf-dlg__eyebrow">Contact Us</p>
                      <h2 className="sf-dlg__title">Edit Office Details</h2>
                    </div>
                    <button
                      type="button"
                      className="sf-dlg__close"
                      aria-label="Close"
                      onClick={() => setOfficeEditOpen(false)}
                    >
                      <IconX width={20} height={20} aria-hidden="true" />
                    </button>
                  </div>

                  <form
                    onSubmit={officeForm.onSubmit((values) => {
                      handleOfficeSave(values).catch(() => {});
                    })}
                    style={{ display: 'contents' }}
                  >
                    <div className="sf-dlg__body">
                      <Stack>
                        <TextInput
                          label="Office name"
                          required
                          {...officeForm.getInputProps('officeName')}
                        />
                        <Textarea
                          label="Address"
                          required
                          minRows={3}
                          autosize
                          {...officeForm.getInputProps('address')}
                        />
                        <TextInput
                          label="Contact number"
                          required
                          {...officeForm.getInputProps('contactNumber')}
                        />
                        <TextInput
                          label="Email"
                          required
                          {...officeForm.getInputProps('email')}
                        />
                        <TextInput
                          label="Office head"
                          required
                          {...officeForm.getInputProps('officeHead')}
                        />
                      </Stack>
                    </div>

                    <div className="sf-dlg__footer">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setOfficeEditOpen(false)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary">
                        Save changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </Modal>
          )}

          {isAdmin && (
            <Modal
              opened={hierarchyModalOpen}
              onClose={closeHierarchyModal}
              centered
              withCloseButton={false}
              size="md"
              padding={0}
              zIndex={1000}
              classNames={{ content: 'sf-dlg' }}
              overlayProps={{ backgroundOpacity: 0.5, blur: 0, transitionProps: { duration: 150 } }}
              transitionProps={{ transition: 'fade', duration: 150 }}
            >
              <div className="sf-dlg__form">
                <div className="sf-dlg__header">
                  <div>
                    <p className="sf-dlg__eyebrow">Organization Hierarchy</p>
                    <h2 className="sf-dlg__title">
                      {hierarchyModalMode === 'add'
                        ? 'Add hierarchy entry'
                        : hierarchyModalMode === 'edit'
                        ? 'Edit hierarchy entry'
                        : 'Delete hierarchy entry'}
                    </h2>
                  </div>
                  <button
                    type="button"
                    className="sf-dlg__close"
                    aria-label="Close"
                    onClick={closeHierarchyModal}
                  >
                    <IconX width={20} height={20} aria-hidden="true" />
                  </button>
                </div>

                <div className="sf-dlg__body">
                  <Stack gap="sm">
                    {(hierarchyModalMode === 'edit' || hierarchyModalMode === 'delete') && (
                      <Select
                        label="Select entry"
                        placeholder="Choose hierarchy entry"
                        data={hierarchyOptions}
                        value={selectedHierarchyId}
                        onChange={handleHierarchyPrimaryChange}
                        searchable
                        clearable
                        comboboxProps={{ withinPortal: true, zIndex: 1200 }}
                      />
                    )}

                    {hierarchyModalMode !== 'delete' && (
                      <>
                        <Select
                          label="Position"
                          placeholder="Select position"
                          data={HIERARCHY_POSITIONS.map((p) => ({ value: p, label: p }))}
                          value={hierarchyPosition}
                          onChange={(v) => setHierarchyPosition(v || '')}
                          required
                          comboboxProps={{ withinPortal: true, zIndex: 1200 }}
                        />
                        <TextInput
                          label="Name"
                          placeholder="Enter name"
                          value={hierarchyName}
                          onChange={(event) => setHierarchyName(event.currentTarget.value)}
                          required
                        />
                      </>
                    )}

                    {hierarchyModalMode === 'delete' && (
                      <Text size="sm" c="red">
                        This action cannot be undone. The selected hierarchy entry will be permanently removed from the
                        Organization Hierarchy.
                      </Text>
                    )}
                  </Stack>
                </div>

                <div className="sf-dlg__footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={closeHierarchyModal}
                    disabled={hierarchySaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={hierarchyModalMode === 'delete' ? 'sf-btn-danger' : 'btn-primary'}
                    onClick={submitHierarchy}
                    disabled={hierarchySaving}
                  >
                    {hierarchySaving
                      ? 'Saving...'
                      : hierarchyModalMode === 'delete'
                      ? 'Delete'
                      : 'Save'}
                  </button>
                </div>
              </div>
            </Modal>
          )}
      </>
  );
}
