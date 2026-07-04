import { Table, Typography, Tag } from "antd";
import { useQuery } from "@tanstack/react-query";
import { getAttributes } from "../api/attributeApi";

const { Title, Text } = Typography;

export function AttributeLibraryPage() {
  const {
    data = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["attributes"],
    queryFn: getAttributes,
  });

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (category) => <Tag>{category}</Tag>,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (description) =>
        description || <Text type="secondary">No description</Text>,
    },
  ];

  if (isError) {
    return <Text type="danger">Failed to load attributes</Text>;
  }

  return (
    <div>
      <Title level={2}>Attribute Library</Title>

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
