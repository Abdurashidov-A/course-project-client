import {
  Alert,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Typography,
  message,
} from "antd";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { getAttributes } from "../api/attributeApi";
import {
  deleteProfileAttributes,
  getProfileAttributes,
  saveProfileAttribute,
} from "../api/profileAttributeApi";
import { isCandidate } from "../utils/roles";
import { useI18n } from "../i18n/I18nProvider";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

function getDisplayValue(record, t) {
  const type = record.attribute?.type;

  if (type === "STRING" || type === "SELECT") {
    return record.stringValue || t("common.none", "—");
  }

  if (type === "TEXT") {
    return record.textValue || t("common.none", "—");
  }

  if (type === "NUMERIC") {
    return record.numericValue ?? t("common.none", "—");
  }

  if (type === "BOOLEAN") {
    return record.booleanValue === null
      ? t("common.none", "—")
      : record.booleanValue
        ? t("common.yes", "Yes")
        : t("common.no", "No");
  }

  if (type === "DATE") {
    return record.dateValue
      ? new Date(record.dateValue).toLocaleDateString()
      : t("common.none", "—");
  }

  if (type === "PERIOD") {
    const start = record.periodStart
      ? new Date(record.periodStart).toLocaleDateString()
      : t("common.none", "—");

    const end = record.periodEnd
      ? new Date(record.periodEnd).toLocaleDateString()
      : t("common.none", "—");

    return `${start} - ${end}`;
  }

  if (type === "IMAGE") {
    return record.imageUrl || t("common.none", "—");
  }

  return t("common.none", "—");
}

function getFormValue(existingValue, attributeType) {
  if (!existingValue) {
    return attributeType === "BOOLEAN" ? false : undefined;
  }

  if (attributeType === "STRING" || attributeType === "SELECT") {
    return existingValue.stringValue || undefined;
  }

  if (attributeType === "TEXT") {
    return existingValue.textValue || undefined;
  }

  if (attributeType === "NUMERIC") {
    return existingValue.numericValue ?? undefined;
  }

  if (attributeType === "BOOLEAN") {
    return Boolean(existingValue.booleanValue);
  }

  if (attributeType === "DATE") {
    return existingValue.dateValue ? dayjs(existingValue.dateValue) : undefined;
  }

  if (attributeType === "PERIOD") {
    if (!existingValue.periodStart && !existingValue.periodEnd) {
      return undefined;
    }

    return [
      existingValue.periodStart ? dayjs(existingValue.periodStart) : null,
      existingValue.periodEnd ? dayjs(existingValue.periodEnd) : null,
    ];
  }

  if (attributeType === "IMAGE") {
    return existingValue.imageUrl || undefined;
  }

  return undefined;
}

function buildSavePayload(attribute, value, existingValue) {
  const payload = {};

  if (existingValue) {
    payload.version = existingValue.version;
  }

  if (attribute.type === "PERIOD") {
    payload.value = {
      periodStart: value?.[0] ? value[0].toISOString() : null,
      periodEnd: value?.[1] ? value[1].toISOString() : null,
    };

    return payload;
  }

  if (attribute.type === "DATE") {
    payload.value = value ? value.toISOString() : null;

    return payload;
  }

  payload.value = value;

  return payload;
}

function renderValueInput(attribute, t) {
  if (!attribute) {
    return <Input disabled placeholder={t("profile.attributePlaceholder", "Select attribute")} />;
  }

  if (attribute.type === "TEXT") {
    return <TextArea rows={4} placeholder={t("profile.value", "Value")} />;
  }

  if (attribute.type === "NUMERIC") {
    return <InputNumber style={{ width: "100%" }} placeholder={t("attributeType.NUMERIC", "Numeric")} />;
  }

  if (attribute.type === "BOOLEAN") {
    return (
      <Switch
        checkedChildren={t("common.yes", "Yes")}
        unCheckedChildren={t("common.no", "No")}
      />
    );
  }

  if (attribute.type === "DATE") {
    return <DatePicker style={{ width: "100%" }} />;
  }

  if (attribute.type === "PERIOD") {
    return <RangePicker style={{ width: "100%" }} />;
  }

  if (attribute.type === "IMAGE") {
    return <Input placeholder="https://..." />;
  }

  if (attribute.type === "SELECT") {
    return (
      <Select
        placeholder={t("profile.value", "Value")}
        options={(attribute.options || []).map((option) => ({
          label: option.value,
          value: option.value,
        }))}
      />
    );
  }

  return <Input placeholder={t("profile.value", "Value")} />;
}

export function CandidateProfilePage({ user }) {
  const { t } = useI18n();

  if (!isCandidate(user)) {
    return <Alert type="warning" message={t("profile.noAccess", "You do not have access to this page")} />;
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAttributeId, setSelectedAttributeId] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const {
    data: profileAttributes = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["profile-attributes"],
    queryFn: getProfileAttributes,
  });

  const { data: attributes = [] } = useQuery({
    queryKey: ["attributes"],
    queryFn: () => getAttributes(),
  });

  const selectedAttribute = attributes.find(
    (attribute) => attribute.id === selectedAttributeId,
  );

  const existingValue = profileAttributes.find(
    (item) => item.attributeId === selectedAttributeId,
  );

  const saveMutation = useMutation({
    mutationFn: ({ attributeId, payload }) =>
      saveProfileAttribute(attributeId, payload),
    onSuccess: () => {
      message.success(t("profile.saveSuccess", "Profile attribute saved"));
      queryClient.invalidateQueries({ queryKey: ["profile-attributes"] });
      setIsModalOpen(false);
      form.resetFields();
      setSelectedAttributeId(null);
    },
    onError: (error) => {
      if (error.response?.status === 409) {
        message.error(t("profile.conflict", "Version conflict. Please refresh and try again."));
        return;
      }

      message.error(t("profile.saveError", "Failed to save profile attribute"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProfileAttributes,
    onSuccess: () => {
      message.success(t("profile.deleteSuccess", "Profile attribute value deleted"));
      queryClient.invalidateQueries({ queryKey: ["profile-attributes"] });
      setSelectedRowKeys([]);
    },
    onError: () => {
      message.error(t("profile.deleteError", "Failed to delete profile attribute value"));
    },
  });

  useEffect(() => {
    if (!isModalOpen || !selectedAttribute) {
      return;
    }

    form.setFieldsValue({
      attributeId: selectedAttribute.id,
      value: getFormValue(existingValue, selectedAttribute.type),
    });
  }, [existingValue, form, isModalOpen, selectedAttribute]);

  function openModal() {
    form.resetFields();
    setSelectedAttributeId(null);
    setIsModalOpen(true);
  }

  function handleSubmit(values) {
    if (!selectedAttribute) {
      return;
    }

    const payload = buildSavePayload(
      selectedAttribute,
      values.value,
      existingValue,
    );

    saveMutation.mutate({
      attributeId: selectedAttribute.id,
      payload,
    });
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  const columns = [
    {
      title: "Attribute",
      title: t("profile.attribute", "Attribute"),
      dataIndex: ["attribute", "name"],
      key: "attributeName",
    },
    {
      title: t("profile.category", "Category"),
      dataIndex: ["attribute", "category"],
      key: "category",
      render: (category) => t(`attributeCategory.${category}`, category),
    },
    {
      title: t("profile.type", "Type"),
      dataIndex: ["attribute", "type"],
      key: "type",
      render: (type) => t(`attributeType.${type}`, type),
    },
    {
      title: t("profile.value", "Value"),
      key: "value",
      render: (_, record) => <Text strong>{getDisplayValue(record, t)}</Text>,
    },
    {
      title: t("profile.version", "Version"),
      dataIndex: "version",
      key: "version",
      width: 100,
    },
  ];

  return (
    <Card>
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>
            {t("profile.title", "My Profile Attributes")}
          </Title>

          <Text type="secondary">
            {t(
              "profile.subtitle",
              "These values are stored once in the candidate profile and will be reused later for automatic CV generation.",
            )}
          </Text>
        </div>

        <Space>
          <Popconfirm
            title={t("profile.deleteConfirmTitle", "Delete selected profile values?")}
            description={t(
              "profile.deleteConfirmBody",
              "This will remove values only from candidate profile, not from Attribute Library.",
            )}
            okText={t("common.delete", "Delete")}
            cancelText={t("common.cancel", "Cancel")}
            disabled={selectedRowKeys.length === 0}
            onConfirm={() => deleteMutation.mutate(selectedRowKeys)}
          >
            <Button
              danger
              disabled={selectedRowKeys.length === 0}
              loading={deleteMutation.isPending}
            >
              {t("profile.deleteSelected", "Delete Selected")}
            </Button>
          </Popconfirm>

          <Button type="primary" onClick={openModal}>
            {t("profile.addOrUpdate", "Add / Update Attribute Value")}
          </Button>
        </Space>
      </Space>

      {isError ? (
        <Alert
          type="error"
          message={t("profile.loadError", "Failed to load profile attributes")}
          style={{ marginBottom: 16 }}
        />
      ) : null}

      <Table
        rowKey="id"
        rowSelection={rowSelection}
        columns={columns}
        dataSource={profileAttributes}
        loading={isLoading}
        pagination={false}
      />

      <Modal
        title={t("profile.addOrUpdate", "Add / Update Attribute Value")}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saveMutation.isPending}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label={t("profile.attribute", "Attribute")}
            name="attributeId"
            rules={[{ required: true, message: t("profile.selectAttribute", "Please select attribute") }]}
          >
            <Select
              showSearch
              placeholder={t("profile.attributePlaceholder", "Select attribute")}
              optionFilterProp="label"
              onChange={(value) => setSelectedAttributeId(value)}
              options={attributes.map((attribute) => ({
                label: `${attribute.name} (${attribute.type})`,
                value: attribute.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            key={selectedAttribute?.type || "empty"}
            label={t("profile.value", "Value")}
            name="value"
            valuePropName={
              selectedAttribute?.type === "BOOLEAN" ? "checked" : "value"
            }
          >
              {renderValueInput(selectedAttribute, t)}
            </Form.Item>
          </Form>
      </Modal>
    </Card>
  );
}
