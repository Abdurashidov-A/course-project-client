import { Alert, Button, Empty, Space, Table, Tag, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";
import { getCvById } from "../api/cvApi";

const { Title, Text } = Typography;

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

export function CvPreviewPage({ cvId, onBack }) {
  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["cv-preview", cvId],
    queryFn: () => getCvById(cvId),
    enabled: Boolean(cvId),
  });

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

      <Table
        rowKey="positionAttributeId"
        loading={isLoading}
        columns={columns}
        dataSource={data?.attributes || []}
        pagination={{ pageSize: 10 }}
        locale={{
          emptyText: <Empty description="No attributes found" />,
        }}
      />
    </Space>
  );
}
