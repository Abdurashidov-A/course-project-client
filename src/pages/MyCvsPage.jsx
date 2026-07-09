import { Alert, Empty, Table, Tag, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";
import { getMyCvs } from "../api/cvApi";
import { isCandidate } from "../utils/roles";

const { Title } = Typography;

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

export function MyCvsPage({ user, onOpenCv }) {
  if (!isCandidate(user)) {
    return <Alert type="warning" message="You do not have access to this page" />;
  }

  const {
    data = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["my-cvs"],
    queryFn: getMyCvs,
  });

  const columns = [
    {
      title: "Position Title",
      dataIndex: ["position", "title"],
      key: "positionTitle",
      render: (title) => title || "—",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag>{status}</Tag>,
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: formatDate,
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
    {
      title: "Likes",
      dataIndex: "likesCount",
      key: "likesCount",
      width: 100,
      render: (likesCount) => likesCount ?? 0,
    },
  ];

  if (isError) {
    return <Alert type="error" message="Failed to load CVs" />;
  }

  return (
    <div>
      <Title level={2}>My CVs</Title>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        onRow={(record) => ({
          onClick: () => onOpenCv?.(record.id),
          style: { cursor: "pointer" },
        })}
        locale={{
          emptyText: <Empty description="No CVs created yet" />,
        }}
      />
    </div>
  );
}
