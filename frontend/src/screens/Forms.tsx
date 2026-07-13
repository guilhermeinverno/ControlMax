import { useCallback } from 'react';
import { useTenant } from '../hooks/useTenant';
import { useFormsData } from '../hooks/useFormsData';
import { useFormsActions } from '../hooks/useFormsActions';
import { FormsFillingModal } from './components/forms/FormsFillingModal';
import { FormsHeader } from './components/forms/FormsHeader';
import { FormsAlerts } from './components/forms/FormsAlerts';
import { FormsTabNav } from './components/forms/FormsTabNav';
import { FormsListTab } from './components/forms/FormsListTab';
import { FormsResponsesTab } from './components/forms/FormsResponsesTab';
import { FormsBuilderTab } from './components/forms/FormsBuilderTab';

export function Forms() {
  const { tenantId, role, userName } = useTenant();
  const isAdminOrSupervisor = role === 'admin' || role === 'supervisor';

  const actions = useFormsActions({ tenantId, userName });
  const handleDataError = useCallback(
    (message: string) => actions.setErrorMsg(message),
    [actions.setErrorMsg]
  );
  const { formsList, responsesList, loadingForms, loadingResponses } = useFormsData({
    tenantId,
    role,
    userName,
    onError: handleDataError,
  });

  return (
    <div className="flex flex-col space-y-6 w-full max-w-[1550px] mx-auto animate-fadeIn px-2 sm:px-4">
      <FormsHeader />

      <FormsAlerts
        errorMsg={actions.errorMsg}
        successMsg={actions.successMsg}
        onDismissError={() => actions.setErrorMsg(null)}
        onDismissSuccess={() => actions.setSuccessMsg(null)}
      />

      <FormsTabNav
        activeTab={actions.activeTab}
        isAdminOrSupervisor={isAdminOrSupervisor}
        onTabChange={actions.setActiveTab}
      />

      {actions.activeTab === 'forms' ? (
        <FormsListTab
          formsList={formsList}
          loadingForms={loadingForms}
          isAdminOrSupervisor={isAdminOrSupervisor}
          onOpenFilling={actions.handleOpenFillingModal}
          onDeleteForm={actions.handleDeleteForm}
        />
      ) : null}

      {actions.activeTab === 'responses' ? (
        <FormsResponsesTab
          responsesList={responsesList}
          loadingResponses={loadingResponses}
          role={role}
        />
      ) : null}

      {actions.activeTab === 'builder' && isAdminOrSupervisor ? (
        <FormsBuilderTab
          newFormTitle={actions.newFormTitle}
          newFormDescription={actions.newFormDescription}
          builderFields={actions.builderFields}
          fieldLabel={actions.fieldLabel}
          fieldType={actions.fieldType}
          fieldRequired={actions.fieldRequired}
          fieldOptionsRaw={actions.fieldOptionsRaw}
          onTitleChange={actions.setNewFormTitle}
          onDescriptionChange={actions.setNewFormDescription}
          onFieldLabelChange={actions.setFieldLabel}
          onFieldTypeChange={actions.setFieldType}
          onFieldRequiredChange={actions.setFieldRequired}
          onFieldOptionsChange={actions.setFieldOptionsRaw}
          onAddField={actions.handleAddFieldToBuilder}
          onRemoveField={actions.handleRemoveFieldFromBuilder}
          onSaveForm={actions.handleSaveForm}
        />
      ) : null}

      {actions.fillingForm ? (
        <FormsFillingModal
          form={actions.fillingForm}
          answers={actions.fillingAnswers}
          error={actions.fillingError}
          submitting={actions.submittingResponse}
          onClose={() => actions.setFillingForm(null)}
          onAnswerChange={actions.handleAnswerChange}
          onSubmit={actions.handleSubmitResponse}
        />
      ) : null}
    </div>
  );
}
