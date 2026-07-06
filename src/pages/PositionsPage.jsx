import { Table, Tag, Typography, Space } from "antd";
import { useQuery } from "@tanstack/react-query";
import { getPositions } from "../api/positionApi";

const { Title, Text } = Typography;

export function PositionsPage() {
  const {
    data = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["positions"],
    queryFn: getPositions,
  });

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Description",
      dataIndex: "shortDescription",
      key: "shortDescription",
      render: (description) =>
        description || <Text type="secondary">No description</Text>,
    },
    {
      title: "Access",
      dataIndex: "isPublic",
      key: "isPublic",
      render: (isPublic) => (
        <Tag color={isPublic ? "green" : "orange"}>
          {isPublic ? "Public" : "Restricted"}
        </Tag>
      ),
    },
    {
      title: "Max Projects",
      dataIndex: "maxProjects",
      key: "maxProjects",
    },
    {
      title: "Attributes",
      dataIndex: "attributes",
      key: "attributes",
      render: (attributes) => {
        if (!attributes || attributes.length === 0) {
          return <Text type="secondary">No attributes</Text>;
        }

        return (
          <Space wrap>
            {attributes.map((item) => (
              <Tag key={item.id}>{item.attribute.name}</Tag>
            ))}
          </Space>
        );
      },
    },
  ];

  if (isError) {
    return <Text type="danger">Failed to load positions</Text>;
  }

  return (
    <div>
      <Title level={2}>Positions</Title>

      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}
