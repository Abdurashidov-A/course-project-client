import { Alert, Form, Input, Modal, Space, Typography, message } from "antd";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { exportProfileToSalesforce } from "../api/salesforceApi";
import { useI18n } from "../i18n/i18nContext";

const { Text } = Typography;

export function SalesforceExportModal({ open, user, onClose }) {
  const { t } = useI18n();
  const [form] = Form.useForm();
  const [result, setResult] = useState(null);

  const exportMutation = useMutation({
    mutationFn: (values) =>
      exportProfileToSalesforce(user.id, {
        accountName: values.accountName.trim(),
        phone: values.phone?.trim() || null,
      }),

    onSuccess: (data) => {
      setResult(data);

      message.success(
        t(
          "salesforce.exportSuccess",
          "Profile was successfully added to Salesforce",
        ),
      );
    },

    onError: (error) => {
      const backendMessage = error.response?.data?.message;

      message.error(
        backendMessage ||
          t(
            "salesforce.exportError",
            "Failed to add profile to Salesforce",
          ),
      );
    },
  });

  function resetModal() {
    form.resetFields();
    exportMutation.reset();
    setResult(null);
  }

  function handleClose() {
    if (exportMutation.isPending) {
      return;
    }

    resetModal();
    onClose();
  }

  async function handleSubmit() {
    if (result) {
      handleClose();
      return;
    }

    try {
      const values = await form.validateFields();
      exportMutation.mutate(values);
    } catch {
      // Ant Design displays validation errors under the fields.
    }
  }

  const salesforce = result?.salesforce;

  return (
    <Modal
      title={t("salesforce.title", "Add profile to Salesforce")}
      open={open}
      onCancel={handleClose}
      onOk={handleSubmit}
      okText={
        result
          ? t("common.close", "Close")
          : t("salesforce.submit", "Add to Salesforce")
      }
      cancelText={t("common.cancel", "Cancel")}
      cancelButtonProps={{
        disabled: exportMutation.isPending,
      }}
      confirmLoading={exportMutation.isPending}
      destroyOnHidden
      width={560}
    >
      {salesforce ? (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Alert
            type="success"
            showIcon
            message={t(
              "salesforce.exportSuccess",
              "Profile was successfully added to Salesforce",
            )}
            description={t(
              "salesforce.recordsReady",
              "The Account and its linked Contact are now available in Salesforce.",
            )}
          />

          <Space direction="vertical" size={4}>
            <Text>
              <Text strong>
                {t("salesforce.account", "Account")}:
              </Text>{" "}
              {salesforce.account.name}
            </Text>

            <Text type="secondary">
              Account ID: {salesforce.account.id}
            </Text>

            <Text>
              <Text strong>
                {t("salesforce.contact", "Contact")}:
              </Text>{" "}
              {result.user.name}
            </Text>

            <Text type="secondary">
              Contact ID: {salesforce.contact.id}
            </Text>
          </Space>
        </Space>
      ) : (
        <>
          <Text type="secondary">
            {t(
              "salesforce.description",
              "Enter the additional information required to create an Account and a linked Contact in Salesforce.",
            )}
          </Text>

          <Form
            form={form}
            layout="vertical"
            preserve={false}
            style={{ marginTop: 20 }}
            onFinish={handleSubmit}
          >
            <Form.Item
              name="accountName"
              label={t("salesforce.accountName", "Account name")}
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: t(
                    "salesforce.accountNameRequired",
                    "Please enter an account name",
                  ),
                },
                {
                  min: 2,
                  message: t(
                    "salesforce.accountNameMin",
                    "Account name must contain at least 2 characters",
                  ),
                },
                {
                  max: 255,
                  message: t(
                    "salesforce.accountNameMax",
                    "Account name must not exceed 255 characters",
                  ),
                },
              ]}
            >
              <Input
                placeholder={t(
                  "salesforce.accountNamePlaceholder",
                  "For example: CVMS Test - Abduqahhor",
                )}
                maxLength={255}
              />
            </Form.Item>

            <Form.Item
              name="phone"
              label={t("salesforce.phone", "Phone")}
              extra={t("salesforce.phoneOptional", "Optional field")}
              rules={[
                {
                  max: 40,
                  message: t(
                    "salesforce.phoneMax",
                    "Phone must not exceed 40 characters",
                  ),
                },
              ]}
            >
              <Input
                placeholder="+998 90 123 45 67"
                maxLength={40}
              />
            </Form.Item>
          </Form>

          {exportMutation.isError ? (
            <Alert
              type="error"
              showIcon
              message={
                exportMutation.error.response?.data?.message ||
                t(
                  "salesforce.exportError",
                  "Failed to add profile to Salesforce",
                )
              }
            />
          ) : null}
        </>
      )}
    </Modal>
  );
}