import { Alert, Button, Empty, Space, Table, Tag, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";
import { getPositionCvs } from "../api/cvApi";

const { Title, Text } = Typography;

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

export function PositionCvsPage({ positionId, onBack, onOpenCv }) {
  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["position-cvs", positionId],
    queryFn: () => getPositionCvs(positionId),
    enabled: Boolean(positionId),
  });

  const columns = [
    {
      title: "Candidate Name",
      dataIndex: ["candidate", "name"],
      key: "candidateName",
      render: (name) => name || "—",
    },
    {
      title: "Candidate Email",
      dataIndex: ["candidate", "email"],
      key: "candidateEmail",
      render: (email) => email || "—",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag>{status}</Tag>,
    },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: formatDate,
    },
    {
      title: "Version",
      dataIndex: "version",
      key: "version",
      width: 100,
    },
  ];

  if (!positionId) {
    return (
      <Space direction="vertical" size="middle">
        <Button onClick={onBack}>Back to Positions</Button>
        <Empty description="Select a position to view published CVs" />
      </Space>
    );
  }

  if (isError) {
    return (
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Button onClick={onBack}>Back to Positions</Button>
        <Alert type="error" message="Failed to load published CVs" />
      </Space>
    );
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Button onClick={onBack} style={{ width: "fit-content" }}>
        Back to Positions
      </Button>

      <div>
        <Title level={2} style={{ marginBottom: 8 }}>
          {data?.position?.title || "Published CVs"}
        </Title>
        <Text type="secondary">
          {data?.position?.shortDescription || "No short description"}
        </Text>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.cvs || []}
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        onRow={(record) => ({
          onClick: () => onOpenCv?.(record.id),
          style: { cursor: "pointer" },
        })}
        locale={{
          emptyText: <Empty description="No published CVs found" />,
        }}
      />
    </Space>
  );
}
