import { useCallback, useState } from 'react';
import type { HtmlFormSubmitEvent } from '../types/reactEvents';
import { BusinessCenter } from '../types/company';
import {
  buildCustomerPayload,
  INITIAL_CUSTOMER_FORM,
  persistCustomer,
  validateCustomerForm,
  type CustomerFormValues,
} from '../utils/customerCreate';
import { requestGeolocationWithReverseGeocode } from '../utils/customerGeolocation';

interface UseCustomerCreateFormOptions {
  tenantId?: string;
  selectedCnId: string;
  centers: BusinessCenter[];
  onCreated: () => void;
}

export function useCustomerCreateForm({
  tenantId,
  selectedCnId,
  centers,
  onCreated,
}: UseCustomerCreateFormOptions) {
  const [form, setForm] = useState<CustomerFormValues>(INITIAL_CUSTOMER_FORM);
  const [createActiveSubTab, setCreateActiveSubTab] = useState<'basic' | 'locations' | 'references' | 'photos'>('basic');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [createInputAddress, setCreateInputAddress] = useState('');
  const [createInputBarrio, setCreateInputBarrio] = useState('');
  const [createInputCity, setCreateInputCity] = useState('Brasilia');
  const [createInputPhone, setCreateInputPhone] = useState('');
  const [createRefName, setCreateRefName] = useState('');
  const [createRefCountry, setCreateRefCountry] = useState('SIN PAÍS');
  const [createRefState, setCreateRefState] = useState('');
  const [createRefCity, setCreateRefCity] = useState('');
  const [createRefAddress, setCreateRefAddress] = useState('');
  const [createRefPhone, setCreateRefPhone] = useState('');
  const [createRefCelular, setCreateRefCelular] = useState('');
  const [createRefComment, setCreateRefComment] = useState('');

  const updateForm = useCallback((patch: Partial<CustomerFormValues>) => {
    setForm((current) => ({ ...current, ...patch }));
  }, []);

  const resetForm = useCallback(() => {
    setForm(INITIAL_CUSTOMER_FORM);
    setCreateActiveSubTab('basic');
  }, []);

  const handleGetCurrentLocation = useCallback(() => {
    requestGeolocationWithReverseGeocode({
      currentAddress: form.formAddress,
      currentBarrio: form.formBarrio,
      currentCity: form.formCity,
      setLatitude: (value) => updateForm({ formLatitude: value }),
      setLongitude: (value) => updateForm({ formLongitude: value }),
      setAddress: (value) => updateForm({ formAddress: value }),
      setBarrio: (value) => updateForm({ formBarrio: value }),
      setCity: (value) => updateForm({ formCity: value }),
      setGettingLocation,
      logContext: 'create form',
    });
  }, [form.formAddress, form.formBarrio, form.formCity, updateForm]);

  const handleSubmit = useCallback(
    async (event: HtmlFormSubmitEvent) => {
      event.preventDefault();
      if (!tenantId) return;

      const validationError = validateCustomerForm(form);
      if (validationError) {
        setNotification({ type: 'error', message: validationError });
        return;
      }

      setSubmitting(true);
      setNotification(null);

      try {
        await persistCustomer(buildCustomerPayload(form, tenantId, selectedCnId, centers));
        setNotification({ type: 'success', message: '¡Cliente creado exitosamente!' });
        resetForm();
        setTimeout(() => {
          onCreated();
          setNotification(null);
        }, 1500);
      } catch (err) {
        console.error('Error creating customer:', err);
        setNotification({ type: 'error', message: 'Error al registrar el cliente en la base de datos.' });
      } finally {
        setSubmitting(false);
      }
    },
    [centers, form, onCreated, resetForm, selectedCnId, tenantId],
  );

  return {
    form,
    updateForm,
    resetForm,
    createActiveSubTab,
    setCreateActiveSubTab,
    gettingLocation,
    notification,
    submitting,
    createInputAddress,
    setCreateInputAddress,
    createInputBarrio,
    setCreateInputBarrio,
    createInputCity,
    setCreateInputCity,
    createInputPhone,
    setCreateInputPhone,
    createRefName,
    setCreateRefName,
    createRefCountry,
    setCreateRefCountry,
    createRefState,
    setCreateRefState,
    createRefCity,
    setCreateRefCity,
    createRefAddress,
    setCreateRefAddress,
    createRefPhone,
    setCreateRefPhone,
    createRefCelular,
    setCreateRefCelular,
    createRefComment,
    setCreateRefComment,
    handleGetCurrentLocation,
    handleSubmit,
  };
}
