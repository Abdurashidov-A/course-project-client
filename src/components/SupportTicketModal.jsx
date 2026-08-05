import { Form, Input, message, Modal, Select } from "antd";
import { useMutation } from "@tanstack/react-query";
import { useRef } from "react";
import { submitSupportTicket } from "../api/supportTicketApi";
import { useI18n } from "../i18n/i18nContext";
import {
  buildSupportTicketPayload,
  DEFAULT_SUPPORT_TICKET_PRIORITY,
  getSupportSummaryValidationError,
  getSupportTicketErrorDetails,
  MAX_SUPPORT_SUMMARY_LENGTH,
  SUPPORT_TICKET_PRIORITIES,
} from "./supportTicketState";

const { TextArea } = Input;

export function SupportTicketModal({ open, onClose, positionId, link }) {
  const { t } = useI18n();
  const [form] = Form.useForm();
  const submissionLockRef = useRef(false);
  const submitMutation = useMutation({
    mutationFn: submitSupportTicket,
    onSuccess: () => {
      submissionLockRef.current = false;
      message.success(
        t("supportTicket.success", "Support ticket submitted successfully"),
      );
      form.resetFields();
      onClose();
    },
    onError: (error) => {
      submissionLockRef.current = false;
      const details = getSupportTicketErrorDetails(error);
      message.error(t(details.key, details.fallback));
    },
  });

  function closeModal() {
    if (submitMutation.isPending || submissionLockRef.current) {
      return;
    }

    form.resetFields();
    submissionLockRef.current = false;
    submitMutation.reset();
    onClose();
  }

  async function submitForm(values) {
    if (submitMutation.isPending || submissionLockRef.current) {
      return;
    }

    const payload = buildSupportTicketPayload({
      summary: values.summary,
      priority: values.priority,
      positionId,
      link,
    });

    submissionLockRef.current = true;
    submitMutation.mutate(payload);
  }

  return (
    <Modal
      title={t("supportTicket.create", "Create support ticket")}
      open={open}
      onCancel={closeModal}
      onOk={() => form.submit()}
      okText={
        submitMutation.isPending
          ? t("supportTicket.submitting", "Submitting ticket...")
          : t("supportTicket.submit", "Submit ticket")
      }
      cancelText={t("common.cancel", "Cancel")}
      confirmLoading={submitMutation.isPending}
      okButtonProps={{ disabled: submitMutation.isPending }}
      cancelButtonProps={{ disabled: submitMutation.isPending }}
      closable={!submitMutation.isPending}
      maskClosable={!submitMutation.isPending}
      keyboard={!submitMutation.isPending}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ priority: DEFAULT_SUPPORT_TICKET_PRIORITY }}
        onFinish={submitForm}
      >
        <Form.Item
          label={t("supportTicket.summary", "Summary")}
          name="summary"
          rules={[
            {
              validator: (_, value) => {
                const validationError =
                  getSupportSummaryValidationError(value);

                if (validationError === "required") {
                  return Promise.reject(
                    new Error(
                      t(
                        "supportTicket.summaryRequired",
                        "Please enter a summary",
                      ),
                    ),
                  );
                }

                if (validationError === "length") {
                  return Promise.reject(
                    new Error(
                      t(
                        "supportTicket.summaryLength",
                        "Summary must contain 5 to 2000 characters",
                      ),
                    ),
                  );
                }

                return Promise.resolve();
              },
            },
          ]}
        >
          <TextArea
            autoFocus
            rows={5}
            maxLength={MAX_SUPPORT_SUMMARY_LENGTH}
            showCount
            placeholder={t(
              "supportTicket.summaryPlaceholder",
              "Describe the problem you need help with",
            )}
          />
        </Form.Item>

        <Form.Item
          label={t("supportTicket.priority", "Priority")}
          name="priority"
          rules={[{ required: true }]}
        >
          <Select
            options={SUPPORT_TICKET_PRIORITIES.map((priority) => ({
              value: priority,
              label: t(`supportTicket.priority${priority}`, priority),
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
