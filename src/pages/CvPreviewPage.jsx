import {
  Alert,
  Button,
  DatePicker,
  Empty,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { getCvById } from "../api/cvApi";
import { saveProfileAttribute } from "../api/profileAttributeApi";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString();
}

function renderAttributeValue(record) {
  const value = record.value;

  if (record.isMissing) {
    return <Text type="secondary">Missing</Text>;
  }

  if (record.type === "STRING" || record.type === "SELECT") {
    return value.stringValue || "—";
  }

  if (record.type === "TEXT") {
    return value.textValue || "—";
  }

  if (record.type === "NUMERIC") {
    return value.numericValue ?? "—";
  }

  if (record.type === "BOOLEAN") {
    if (value.booleanValue === null) {
      return "—";
    }

    return value.booleanValue ? "Yes" : "No";
  }

  if (record.type === "DATE") {
    return formatDate(value.dateValue);
  }

  if (record.type === "PERIOD") {
    const start = formatDate(value.periodStart);
    const end = formatDate(value.periodEnd);

    return `${start} - ${end}`;
  }

  if (record.type === "IMAGE") {
    return value.imageUrl || "—";
  }

  return "—";
}

function getFormValue(attribute) {
  const value = attribute?.value;

  if (!attribute || !value || value.id === null) {
    return attribute?.type === "BOOLEAN" ? false : undefined;
  }

  if (attribute.type === "STRING" || attribute.type === "SELECT") {
    return value.stringValue || undefined;
  }

  if (attribute.type === "TEXT") {
    return value.textValue || undefined;
  }

  if (attribute.type === "NUMERIC") {
    return value.numericValue ?? undefined;
  }

  if (attribute.type === "BOOLEAN") {
    return Boolean(value.booleanValue);
  }

  if (attribute.type === "DATE") {
    return value.dateValue ? dayjs(value.dateValue) : undefined;
  }

  if (attribute.type === "PERIOD") {
    if (!value.periodStart && !value.periodEnd) {
      return undefined;
    }

    return [
      value.periodStart ? dayjs(value.periodStart) : null,
      value.periodEnd ? dayjs(value.periodEnd) : null,
    ];
  }

  if (attribute.type === "IMAGE") {
    return value.imageUrl || undefined;
  }

  return undefined;
}

function buildSavePayload(attribute, value) {
  const payload = {};

  if (attribute.value?.version !== null && attribute.value?.version !== undefined) {
    payload.version = attribute.value.version;
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

function renderValueInput(attribute) {
  if (!attribute) {
    return <Input disabled placeholder="Select attribute first" />;
  }

  if (attribute.type === "TEXT") {
    return <TextArea rows={4} placeholder="Enter text value" />;
  }

  if (attribute.type === "NUMERIC") {
    return <InputNumber style={{ width: "100%" }} placeholder="Enter number" />;
  }

  if (attribute.type === "BOOLEAN") {
    return <Switch checkedChildren="Yes" unCheckedChildren="No" />;
  }

  if (attribute.type === "DATE") {
    return <DatePicker style={{ width: "100%" }} />;
  }

  if (attribute.type === "PERIOD") {
    return <RangePicker style={{ width: "100%" }} />;
  }

  if (attribute.type === "IMAGE") {
    return <Input placeholder="Enter image URL" />;
  }

  if (attribute.type === "SELECT" && attribute.options?.length > 0) {
    return (
      <Select
        placeholder="Select value"
        options={attribute.options.map((option) => ({
          label: option.value,
          value: option.value,
        }))}
      />
    );
  }

  return <Input placeholder="Enter value" />;
}

export function CvPreviewPage({ cvId, onBack }) {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["cv-preview", cvId],
    queryFn: () => getCvById(cvId),
    enabled: Boolean(cvId),
  });

  const selectedAttribute =
    data?.attributes?.find(
      (attribute) => attribute.positionAttributeId === selectedRowKeys[0],
    ) || null;

  const saveMutation = useMutation({
    mutationFn: ({ attributeId, payload }) =>
      saveProfileAttribute(attributeId, payload),
    onSuccess: async () => {
      message.success("Profile attribute saved");
      setIsModalOpen(false);
      setSelectedRowKeys([]);
      form.resetFields();
      await refetch();
    },
    onError: (error) => {
      if (error.response?.status === 409) {
        message.warning(
          "This value was changed elsewhere. Please reload and try again.",
        );
        return;
      }

      message.error("Failed to save profile attribute");
    },
  });

  useEffect(() => {
    if (!isModalOpen || !selectedAttribute) {
      return;
    }

    form.setFieldsValue({
      value: getFormValue(selectedAttribute),
    });
  }, [form, isModalOpen, selectedAttribute]);

  const columns = [
    {
      title: "Attribute Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
    },
    {
      title: "Required",
      dataIndex: "isRequired",
      key: "isRequired",
      render: (isRequired) => (isRequired ? "Yes" : "No"),
    },
    {
      title: "Value",
      key: "value",
      render: (_, record) => renderAttributeValue(record),
    },
    {
      title: "Missing",
      dataIndex: "isMissing",
      key: "isMissing",
      render: (isMissing, record) =>
        isMissing ? (
          <Tag color={record.isRequired ? "red" : "orange"}>Missing</Tag>
        ) : (
          <Tag color="green">Complete</Tag>
        ),
    },
  ];

  if (!cvId) {
    return (
      <Space direction="vertical" size="middle">
        <Button onClick={onBack}>Back to My CVs</Button>
        <Empty description="Select a CV to preview" />
      </Space>
    );
  }

  if (isError) {
    return (
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Button onClick={onBack}>Back to My CVs</Button>
        <Alert type="error" message="Failed to load CV preview" />
      </Space>
    );
  }

  function handleEditValue() {
    if (!selectedAttribute) {
      return;
    }

    setIsModalOpen(true);
  }

  function handleSubmit(values) {
    if (!selectedAttribute) {
      return;
    }

    saveMutation.mutate({
      attributeId: selectedAttribute.attributeId,
      payload: buildSavePayload(selectedAttribute, values.value),
    });
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Button onClick={onBack} style={{ width: "fit-content" }}>
        Back to My CVs
      </Button>

      <div>
        <Title level={2} style={{ marginBottom: 8 }}>
          {data?.position?.title || "CV Preview"}
        </Title>
        <Text type="secondary">
          {data?.position?.shortDescription || "No short description"}
        </Text>
      </div>

      <Space wrap>
        <Tag color="blue">Status: {data?.status || "—"}</Tag>
        <Tag>Version: {data?.version ?? "—"}</Tag>
      </Space>

      <Space wrap>
        <Text type="secondary">Selected: {selectedRowKeys.length}</Text>
        {selectedRowKeys.length > 1 ? (
          <Text type="warning">Select only one attribute to edit</Text>
        ) : null}
        <Button
          disabled={selectedRowKeys.length !== 1}
          onClick={handleEditValue}
        >
          Edit Value
        </Button>
      </Space>

      <Table
        rowKey="positionAttributeId"
        loading={isLoading}
        columns={columns}
        dataSource={data?.attributes || []}
        pagination={{ pageSize: 10 }}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        locale={{
          emptyText: <Empty description="No attributes found" />,
        }}
      />

      <Modal
        title={selectedAttribute ? `Edit ${selectedAttribute.name}` : "Edit Value"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saveMutation.isPending}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Attribute">
            <Input value={selectedAttribute?.name} disabled />
          </Form.Item>

          <Form.Item
            key={selectedAttribute?.type || "empty"}
            label="Value"
            name="value"
            valuePropName={
              selectedAttribute?.type === "BOOLEAN" ? "checked" : "value"
            }
          >
            {renderValueInput(selectedAttribute)}
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
