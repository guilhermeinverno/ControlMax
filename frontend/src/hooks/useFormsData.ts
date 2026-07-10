import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FormDefinition, FormResponse } from '../types';
import { logFirestoreError } from '../utils/firestoreError';
import { mapFormDoc, mapResponseDoc } from '../utils/formsHelpers';

interface UseFormsDataOptions {
  tenantId?: string;
  role: string;
  userName: string;
  onError: (message: string) => void;
}

export function useFormsData({ tenantId, role, userName, onError }: UseFormsDataOptions) {
  const [formsList, setFormsList] = useState<FormDefinition[]>([]);
  const [responsesList, setResponsesList] = useState<FormResponse[]>([]);
  const [loadingForms, setLoadingForms] = useState(true);
  const [loadingResponses, setLoadingResponses] = useState(true);

  useEffect(() => {
    if (!tenantId) return;

    setLoadingForms(true);
    setLoadingResponses(true);

    const formsQuery = query(collection(db, 'forms'), where('tenantId', '==', tenantId));
    const unsubscribeForms = onSnapshot(
      formsQuery,
      (snapshot) => {
        setFormsList(snapshot.docs.map((docSnap) => mapFormDoc(docSnap.id, docSnap.data())));
        setLoadingForms(false);
      },
      (error) => {
        onError('Error al cargar formularios.');
        try {
          logFirestoreError(error, 'list', 'forms', {
            label: 'Firestore Error in Forms',
            throwError: true,
            includeAuth: false,
          });
        } catch {
          // logged
        }
        setLoadingForms(false);
      }
    );

    const responsesQuery = query(collection(db, 'form_responses'), where('tenantId', '==', tenantId));
    const unsubscribeResponses = onSnapshot(
      responsesQuery,
      (snapshot) => {
        const loaded = snapshot.docs.map((docSnap) => mapResponseDoc(docSnap.id, docSnap.data()));
        setResponsesList(
          role === 'collector' ? loaded.filter((r) => r.submittedBy === userName) : loaded
        );
        setLoadingResponses(false);
      },
      (error) => {
        onError('Error al cargar respuestas.');
        try {
          logFirestoreError(error, 'list', 'form_responses', {
            label: 'Firestore Error in Forms',
            throwError: true,
            includeAuth: false,
          });
        } catch {
          // logged
        }
        setLoadingResponses(false);
      }
    );

    return () => {
      unsubscribeForms();
      unsubscribeResponses();
    };
  }, [tenantId, role, userName, onError]);

  return { formsList, responsesList, loadingForms, loadingResponses, setFormsList, setResponsesList };
}
